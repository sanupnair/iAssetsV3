import type { FastifyRequest, FastifyReply } from 'fastify';
import * as AuthService from './auth.service.js';
import {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from './auth.schema.js';
import { env }       from '../../config/env.js';
import { hashToken } from './auth.service.js';
import type { JwtPayload, RefreshPayload } from '../../middleware/authenticate.js';

// ── Login ─────────────────────────────────────────────────────
export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = loginSchema.parse(req.body);
  const result = await AuthService.login(input, req.ip, req.headers['user-agent']);

  // Sign access token via @fastify/jwt
  const accessToken = await reply.jwtSign(
    {
      sub:         result.userId,
      orgId:       result.user.orgId,
      email:       result.user.email,
      username:    result.user.username,
      roleCode:    result.user.roleCode,
      roleLevel:   result.user.roleLevel,
      permissions: result.user.permissions,
      type:        'access',
    } satisfies Omit<JwtPayload, 'iat' | 'exp'>,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );

  // Sign refresh token
  const refreshToken = await reply.jwtSign(
  { sub: result.userId, type: 'refresh' } as RefreshPayload,
  { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
);
  // Persist session
  await AuthService.saveSession(result.userId, refreshToken, {
    deviceName: input.deviceName,
    deviceType: input.deviceType,
    userAgent:  req.headers['user-agent'],
    ip:         req.ip,
  });

  return reply.status(200).send({
    success: true,
    message: 'Login successful',
    data:    { user: result.user, tokens: { accessToken, refreshToken } },
  });
}

// ── Refresh ───────────────────────────────────────────────────
export async function refreshHandler(req: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = refreshSchema.parse(req.body);

  // Decode and verify manually since token is in body, not Authorization header
  let payload: RefreshPayload;

  try {
    payload = req.server.jwt.verify<RefreshPayload>(refreshToken);
  } catch {
    return reply.status(401).send({ success: false, message: 'Invalid or expired refresh token' });
  }

  if (payload.type !== 'refresh') {
    return reply.status(401).send({ success: false, message: 'Invalid token type' });
  }

  const userId    = payload.sub;
  const tokenHash = hashToken(refreshToken);
  const session   = await AuthService.validateRefreshToken(tokenHash, userId);

  // Need user's current data for new access token
  const authUser = await AuthService.buildAuthUser(userId);

  const newAccessToken = await reply.jwtSign(
    {
      sub:         userId,
      orgId:       authUser.orgId,
      email:       authUser.email,
      username:    authUser.username,
      roleCode:    authUser.roleCode,
      roleLevel:   authUser.roleLevel,
      permissions: authUser.permissions,
      type:        'access',
    } satisfies Omit<JwtPayload, 'iat' | 'exp'>,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );

  const newRefreshToken = await reply.jwtSign(
    { sub: userId, type: 'refresh' } as RefreshPayload,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );

  await AuthService.rotateSession(session.id, userId, newRefreshToken, session);

  return reply.status(200).send({
    success: true,
    message: 'Tokens refreshed',
    data:    { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
}

// ── Logout ────────────────────────────────────────────────────
export async function logoutHandler(req: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = refreshSchema.parse(req.body);
  await AuthService.logout(req.user.sub, hashToken(refreshToken));

  return reply.status(200).send({
    success: true,
    message: 'Logged out successfully',
    data:    null,
  });
}

// ── Logout all ────────────────────────────────────────────────
export async function logoutAllHandler(req: FastifyRequest, reply: FastifyReply) {
  await AuthService.logoutAll(req.user.sub);

  return reply.status(200).send({
    success: true,
    message: 'Logged out from all sessions',
    data:    null,
  });
}

// ── Me ────────────────────────────────────────────────────────
export async function getMeHandler(req: FastifyRequest, reply: FastifyReply) {
  const result = await AuthService.getMe(req.user.sub);

  return reply.status(200).send({
    success: true,
    message: 'User fetched',
    data:    result,
  });
}

// ── Change password ───────────────────────────────────────────
export async function changePasswordHandler(req: FastifyRequest, reply: FastifyReply) {
  const input = changePasswordSchema.parse(req.body);
  await AuthService.changePassword(req.user.sub, input);

  return reply.status(200).send({
    success: true,
    message: 'Password changed. Please login again.',
    data:    null,
  });
}