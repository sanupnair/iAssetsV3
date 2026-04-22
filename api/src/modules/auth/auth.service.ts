import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq, or, and, gt } from 'drizzle-orm';

import { db }     from '../../config/db.js';
import { env }    from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  users,
  userRoles,
  userSessions,
  roles,
  rolePermissions,
  permissions,
  loginLogs,
} from '../../config/drizzle/schema/index.js';

import type { LoginInput, ChangePasswordInput } from './auth.schema.js';
import type { AuthUser } from '../../types/index.js';


// ── Types ─────────────────────────────────────────────────────
export interface LoginServiceResult {
  user:      AuthUser;
  userId:    string;
  orgId:     string | null;
}

export interface SessionInfo {
  sessionId:   string;
  tokenFamily: string;
}

// ── Helpers ───────────────────────────────────────────────────
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseExpiry(exp: string): Date {
  const units: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${exp}`);
  return new Date(Date.now() + parseInt(match[1]) * units[match[2]]);
}

// ── Build AuthUser ────────────────────────────────────────────
export async function buildAuthUser(userId: string): Promise<AuthUser> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  // Get active role
  const userRole = await db
    .select({
      roleId:    userRoles.roleId,
      roleCode:  roles.code,
      roleLevel: roles.level,
    })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(eq(userRoles.userId, userId), eq(userRoles.isActive, true)))
    .limit(1);

  const role = userRole[0];

  // Get permissions
  let perms: string[] = [];
  if (role) {
    const rolePerms = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, role.roleId));
    perms = rolePerms.map((p) => p.code);
  }

  return {
    id:                 user.id,
    email:              user.email,
    username:           user.username,
    firstName:          user.firstName,
    lastName:           user.lastName,
    displayName:        user.displayName ?? `${user.firstName} ${user.lastName}`,
    orgId:              user.orgId ?? null,
    orgName:            null,
    roleCode:           role?.roleCode ?? 'viewer',
    roleLevel:          role?.roleLevel ?? 0,
    permissions:        perms,
    avatarUrl:          user.avatarUrl ?? null,
    theme:              (user.theme as AuthUser['theme']) ?? 'system',
    mustChangePassword: user.mustChangePassword,
  };
}

// ── Login ─────────────────────────────────────────────────────
export async function login(
  input:     LoginInput,
  ip?:       string,
  userAgent?: string,
): Promise<LoginServiceResult> {
  const { identifier, password,  deviceType } = input;

  // Find user by email or username
  const user = await db.query.users.findFirst({
    where: or(
      eq(users.email,    identifier.toLowerCase()),
      eq(users.username, identifier.toLowerCase()),
    ),
  });

  const logLogin = async (userId: string | null, status: string, reason?: string) => {
    await db.insert(loginLogs).values({
      userId:        userId ?? undefined,
      orgId:         user?.orgId ?? undefined,
      identifier,
      status,
      failureReason: reason ?? null,
      ipAddress:     ip ?? null,
      userAgent:     userAgent ?? null,
      deviceType:    deviceType ?? null,
    });
  };

  if (!user) {
    await logLogin(null, 'failed', 'User not found');
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  if (!user.isActive || user.status === 'inactive' || user.status === 'suspended') {
    await logLogin(user.id, 'failed', `Account ${user.status}`);
    throw Object.assign(new Error('Account is disabled. Contact your administrator.'), { statusCode: 403 });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await logLogin(user.id, 'failed', 'Account locked');
    throw Object.assign(new Error('Account is temporarily locked. Try again later.'), { statusCode: 423 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts   = (user.failedLoginAttempts ?? 0) + 1;
    const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await db.update(users)
      .set({ failedLoginAttempts: attempts, lockedUntil, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await logLogin(user.id, 'failed', 'Invalid password');
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  // Reset failed attempts
  await db.update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil:         null,
      lastLoginAt:         new Date(),
      lastLoginIp:         ip ?? null,
      updatedAt:           new Date(),
    })
    .where(eq(users.id, user.id));

  const authUser = await buildAuthUser(user.id);
  await logLogin(user.id, 'success');
  logger.info({ userId: user.id }, 'User logged in');

  return {
    user:   authUser,
    userId: user.id,
    orgId:  user.orgId ?? null,
  };
}

// ── Save session after tokens are signed ──────────────────────
export async function saveSession(
  userId:       string,
  refreshToken: string,
  opts: {
    deviceName?: string;
    deviceType?: string;
    userAgent?:  string;
    ip?:         string;
  },
): Promise<void> {
  await db.insert(userSessions).values({
    userId,
    refreshTokenHash: hashToken(refreshToken),
    tokenFamily:      crypto.randomUUID(),
    deviceName:       opts.deviceName ?? null,
    deviceType:       opts.deviceType ?? null,
    userAgent:        opts.userAgent  ?? null,
    ipAddress:        opts.ip         ?? null,
    expiresAt:        parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
  });
}

// ── Refresh tokens ────────────────────────────────────────────
export async function validateRefreshToken(
  refreshTokenHash: string,
  userId: string,
): Promise<typeof userSessions.$inferSelect> {
  const session = await db.query.userSessions.findFirst({
    where: and(
      eq(userSessions.userId,           userId),
      eq(userSessions.refreshTokenHash, refreshTokenHash),
      eq(userSessions.isRevoked,        false),
      gt(userSessions.expiresAt,        new Date()),
    ),
  });

  if (!session) {
    // Possible token reuse — revoke all sessions
    await db.update(userSessions)
      .set({ isRevoked: true, revokedAt: new Date(), revokedReason: 'reuse_detected' })
      .where(eq(userSessions.userId, userId));
    throw Object.assign(new Error('Session invalid. Please login again.'), { statusCode: 401 });
  }

  return session;
}

export async function rotateSession(
  oldSessionId: string,
  userId:       string,
  newRefreshToken: string,
  session: typeof userSessions.$inferSelect,
): Promise<void> {
  await db.update(userSessions)
    .set({ isRevoked: true, revokedAt: new Date(), revokedReason: 'rotated', updatedAt: new Date() })
    .where(eq(userSessions.id, oldSessionId));

  await db.insert(userSessions).values({
    userId,
    refreshTokenHash: hashToken(newRefreshToken),
    tokenFamily:      session.tokenFamily,
    deviceName:       session.deviceName,
    deviceType:       session.deviceType,
    userAgent:        session.userAgent,
    ipAddress:        session.ipAddress,
    expiresAt:        parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
  });
}

// ── Logout ────────────────────────────────────────────────────
export async function logout(userId: string, refreshTokenHash: string): Promise<void> {
  await db.update(userSessions)
    .set({ isRevoked: true, revokedAt: new Date(), revokedReason: 'logout', updatedAt: new Date() })
    .where(and(
      eq(userSessions.userId,           userId),
      eq(userSessions.refreshTokenHash, refreshTokenHash),
    ));
  logger.info({ userId }, 'User logged out');
}

export async function logoutAll(userId: string): Promise<void> {
  await db.update(userSessions)
    .set({ isRevoked: true, revokedAt: new Date(), revokedReason: 'logout_all', updatedAt: new Date() })
    .where(eq(userSessions.userId, userId));
  logger.info({ userId }, 'User logged out from all sessions');
}

// ── Change password ───────────────────────────────────────────
export async function changePassword(
  userId: string,
  input:  ChangePasswordInput,
): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  const hash = await bcrypt.hash(input.newPassword, 12);
  await db.update(users)
    .set({
      passwordHash:       hash,
      passwordChangedAt:  new Date(),
      mustChangePassword: false,
      updatedAt:          new Date(),
    })
    .where(eq(users.id, userId));

  await logoutAll(userId);
  logger.info({ userId }, 'Password changed');
}

// ── Get me ────────────────────────────────────────────────────
export async function getMe(userId: string): Promise<AuthUser> {
  return buildAuthUser(userId);
}