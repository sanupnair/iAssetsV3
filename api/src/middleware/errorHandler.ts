import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const url    = request.url;
  const method = request.method;

  // ── Zod validation errors ─────────────────────────────────
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || 'value';
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }

    logger.warn({ url, method, errors }, 'Validation error');

    reply.status(422).send({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // ── Fastify validation errors (JSON schema) ───────────────
  if ('validation' in error && error.validation) {
    reply.status(422).send({
      success: false,
      message: 'Validation failed',
      errors:  error.validation,
    });
    return;
  }

  // ── JWT errors ────────────────────────────────────────────
  if (error.message?.includes('jwt') || error.message?.includes('token')) {
    reply.status(401).send({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // ── Known HTTP errors (with statusCode attached) ──────────
  const statusCode = (error as any).statusCode ?? (error as any).status ?? 500;

  if (statusCode < 500) {
    reply.status(statusCode).send({
      success: false,
      message: error.message ?? 'An error occurred',
    });
    return;
  }

  // ── PostgreSQL errors ─────────────────────────────────────
  const pgError = error as any;
  if (pgError.code) {
    switch (pgError.code) {
      case '23505': // unique_violation
        reply.status(409).send({
          success: false,
          message: 'A record with this value already exists',
        });
        return;

      case '23503': // foreign_key_violation
        reply.status(400).send({
          success: false,
          message: 'Referenced record does not exist',
        });
        return;

      case '23502': // not_null_violation
        reply.status(400).send({
          success: false,
          message: `Required field missing: ${pgError.column ?? 'unknown'}`,
        });
        return;

      case '42P01': // undefined_table
        logger.error({ url, method, error }, 'DB table not found');
        break;
    }
  }

  // ── Unhandled 500 errors ──────────────────────────────────
  logger.error(
    { url, method, err: error },
    'Unhandled server error',
  );

  reply.status(500).send({
    success: false,
    message: 'Internal server error. Please try again later.',
  });
}