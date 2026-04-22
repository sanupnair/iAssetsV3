import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { organizationRoutes } from './modules/organizations/organizations.routes.js';
import { branchRoutes } from './modules/branches/branches.routes.js';
import { locationRoutes } from './modules/locations/locations.routes.js';
import { departmentRoutes } from './modules/departments/departments.routes.js';
import { designationRoutes } from './modules/designations/designations.routes.js';
import { roleRoutes } from './modules/roles/roles.routes.js';
import { userRoutes } from './modules/users/users.routes.js';

// ── Create Fastify instance ───────────────────────────────────
const app = Fastify({
  logger: false, // We use our own Pino logger
  trustProxy: true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true,
    },
  },
});

// ── Register plugins ──────────────────────────────────────────
async function registerPlugins(): Promise<void> {
  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Cookies
  await app.register(cookie, {
    secret: env.JWT_REFRESH_SECRET,
    hook: 'onRequest',
  });

  // JWT
  await app.register(jwt, {
    secret: {
      private: env.JWT_ACCESS_SECRET,
      public:  env.JWT_ACCESS_SECRET,
    },
    sign: {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  });

  // Rate limiting
  await app.register(rateLimit, {
    max:     env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: () => ({
      success: false,
      message: 'Too many requests — please slow down',
    }),
  });

  // File uploads
  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
      files: 5,
    },
  });
}

// ── Register routes ───────────────────────────────────────────
async function registerRoutes(): Promise<void> {
  // Health check — no auth required
  app.get(`${env.API_PREFIX}/health`, async (_request, reply) => {
    reply.send({
      success: true,
      message: 'iAssetsV3 API is running',
      data: {
        version:     '1.0.0',
        environment: env.NODE_ENV,
        timestamp:   new Date().toISOString(),
      },
    });
  });

  // Auth routes
  await app.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });

  // Settings routes
  await app.register(organizationRoutes,         { prefix: `${env.API_PREFIX}/organizations` });
  await app.register(branchRoutes,      { prefix: `${env.API_PREFIX}/branches` });
  await app.register(locationRoutes,    { prefix: `${env.API_PREFIX}/locations` });
  await app.register(departmentRoutes,  { prefix: `${env.API_PREFIX}/departments` });
  await app.register(designationRoutes, { prefix: `${env.API_PREFIX}/designations` });
  await app.register(roleRoutes,        { prefix: `${env.API_PREFIX}/roles` });
  await app.register(userRoutes,        { prefix: `${env.API_PREFIX}/users` });
}

// ── Global error handler ──────────────────────────────────────
app.setErrorHandler(errorHandler);

// ── 404 handler ───────────────────────────────────────────────
app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({
    success: false,
    message: `Route not found`,
  });
});

// ── Bootstrap ─────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    // Connect to DB and Redis
    await connectDB();
    await connectRedis();

    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start server
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`🚀 iAssetsV3 API running at http://${env.HOST}:${env.PORT}`);
    logger.info(`📡 Health check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);

  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function shutdown(signal: string): Promise<void> {
  logger.info(`⚠️  Received ${signal} — shutting down gracefully`);
  try {
    await app.close();
    logger.info('✅ Server closed');
    process.exit(0);
  } catch (error) {
    logger.error(error, '❌ Error during shutdown');
    process.exit(1);
  }
}

bootstrap();

export default app;