import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../config/db.js';
import { users } from '../config/drizzle/schema/index.js';
import { eq, and, isNull } from 'drizzle-orm';
import '@fastify/jwt';

export interface JwtPayload {
  sub:         string;
  email:       string;
  username:    string;
  orgId:       string | null;
  roleCode:    string;
  roleLevel:   number;
  permissions: string[];
  type:        'access' | 'refresh';
  iat?:        number;
  exp?:        number;
}

// ── Extend FastifyRequest ─────────────────────────────────────
declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

// ── Extend @fastify/jwt ───────────────────────────────────────
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload | RefreshPayload;
    user:    JwtPayload;
  }
}

export interface RefreshPayload {
  sub:  string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

// ── Main auth middleware ───────────────────────────────────────
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    const payload = request.user as JwtPayload;

    if (payload.type !== 'access') {
      reply.status(401).send({
        success: false,
        message: 'Invalid token type',
      });
      return;
    }

    const user = await db
      .select({
        id:       users.id,
        status:   users.status,
        isActive: users.isActive,
      })
      .from(users)
      .where(
        and(
          eq(users.id, payload.sub),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (!user.length) {
      reply.status(401).send({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user[0].isActive || user[0].status !== 'active') {
      reply.status(401).send({
        success: false,
        message: 'Account is inactive or suspended',
      });
      return;
    }

  } catch (_error) {
    reply.status(401).send({
      success: false,
      message: 'Unauthorized — invalid or expired token',
    });
  }
}

// ── SADMIN only ───────────────────────────────────────────────
export async function requireSAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await authenticate(request, reply);
  if (reply.sent) return;

  if (request.user.roleCode !== 'SADMIN') {
    reply.status(403).send({
      success: false,
      message: 'Forbidden — Super Admin access required',
    });
  }
}

// ── Minimum role level ────────────────────────────────────────
export function requireRoleLevel(minLevel: number) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await authenticate(request, reply);
    if (reply.sent) return;

    if (request.user.roleLevel < minLevel) {
      reply.status(403).send({
        success: false,
        message: `Forbidden — minimum role level ${minLevel} required`,
      });
    }
  };
}

// ── Permission check ──────────────────────────────────────────
export function requirePermission(permissionCode: string) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await authenticate(request, reply);
    if (reply.sent) return;

    const { permissions, roleCode } = request.user;

    if (roleCode === 'SADMIN') return;

    if (!permissions.includes(permissionCode)) {
      reply.status(403).send({
        success: false,
        message: `Forbidden — missing permission: ${permissionCode}`,
      });
    }
  };
}