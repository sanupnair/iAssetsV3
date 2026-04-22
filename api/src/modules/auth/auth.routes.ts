import type { FastifyInstance } from 'fastify';
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  getMeHandler,
  changePasswordHandler,
} from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Public routes
  app.post('/login',   loginHandler);
  app.post('/refresh', refreshHandler);

  // Protected routes
  app.post('/logout',     { preHandler: [authenticate] }, logoutHandler);
  app.post('/logout-all', { preHandler: [authenticate] }, logoutAllHandler);
  app.get('/me',          { preHandler: [authenticate] }, getMeHandler);
  app.post('/change-password', { preHandler: [authenticate] }, changePasswordHandler);
}