import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // ── Zod Validation Error ──────────────────────────────────
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const key = issue.path.join('.') || 'value';
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    });

    reply.status(422).send({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // ── Fastify Validation Error (schema) ─────────────────────
  if ('validation' in error && error.validation) {
    reply.status(422).send({
      success: false,
      message: 'Validation failed',
      errors: { validation: [error.message] },
    });
    return;
  }

  // ── Known HTTP Errors ─────────────────────────────────────
  if ('statusCode' in error && error.statusCode) {
    const statusCode = error.statusCode as number;
    if (statusCode < 500) {
      reply.status(statusCode).send({
        success: false,
        message: error.message,
      });
      return;
    }
  }

  // ── PostgreSQL Errors ─────────────────────────────────────
  if ('code' in error) {
    const pgError = error as Error & { code: string; detail?: string };

    if (pgError.code === '23505') {
      reply.status(409).send({
        success: false,
        message: 'A record with this value already exists',
        errors: { detail: [pgError.detail ?? 'Duplicate entry'] },
      });
      return;
    }

    if (pgError.code === '23503') {
      reply.status(409).send({
        success: false,
        message: 'Referenced record does not exist',
        errors: { detail: [pgError.detail ?? 'Foreign key violation'] },
      });
      return;
    }

    if (pgError.code === '23502') {
      reply.status(400).send({
        success: false,
        message: 'Required field is missing',
        errors: { detail: [pgError.detail ?? 'Not null violation'] },
      });
      return;
    }
  }

  // ── Unknown / Server Errors ───────────────────────────────
  logger.error(
    {
      err: error,
      method: request.method,
      url:    request.url,
      params: request.params,
    },
    'Unhandled server error'
  );

  reply.status(500).send({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
  });
}