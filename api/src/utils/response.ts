import type { FastifyReply } from 'fastify';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

// ── Success Responses ─────────────────────────────────────────

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  message = 'Success',
  statusCode = 200
): void {
  reply.status(statusCode).send({
    success: true,
    message,
    data,
  } satisfies ApiResponse<T>);
}

export function sendCreated<T>(
  reply: FastifyReply,
  data: T,
  message = 'Created successfully'
): void {
  sendSuccess(reply, data, message, 201);
}

export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  meta: PaginationMeta,
  message = 'Success'
): void {
  reply.status(200).send({
    success: true,
    message,
    data,
    meta,
  } satisfies ApiResponse<T[]>);
}

export function sendNoContent(reply: FastifyReply): void {
  reply.status(204).send();
}

// ── Error Responses ───────────────────────────────────────────

export function sendError(
  reply: FastifyReply,
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]>
): void {
  reply.status(statusCode).send({
    success: false,
    message,
    ...(errors && { errors }),
  } satisfies ApiResponse);
}

export function sendNotFound(
  reply: FastifyReply,
  message = 'Resource not found'
): void {
  sendError(reply, message, 404);
}

export function sendUnauthorized(
  reply: FastifyReply,
  message = 'Unauthorized'
): void {
  sendError(reply, message, 401);
}

export function sendForbidden(
  reply: FastifyReply,
  message = 'Forbidden — insufficient permissions'
): void {
  sendError(reply, message, 403);
}

export function sendConflict(
  reply: FastifyReply,
  message = 'Resource already exists'
): void {
  sendError(reply, message, 409);
}

export function sendServerError(
  reply: FastifyReply,
  message = 'Internal server error'
): void {
  sendError(reply, message, 500);
}

// ── Pagination Helper ─────────────────────────────────────────

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}