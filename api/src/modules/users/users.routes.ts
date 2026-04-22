import type { FastifyInstance } from 'fastify';
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  updateUserStatusHandler,
  resetPasswordHandler,
  assignRoleHandler,
  deleteUserHandler,
} from './users.controller.js';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/',    { preHandler: [requirePermission('users.view')]           }, listUsersHandler);
  app.get('/:id', { preHandler: [requirePermission('users.view')]           }, getUserHandler);
  app.post('/',   { preHandler: [requirePermission('users.create')]         }, createUserHandler);
  app.patch('/:id',              { preHandler: [requirePermission('users.edit')]          }, updateUserHandler);
  app.patch('/:id/status',       { preHandler: [requirePermission('users.edit')]          }, updateUserStatusHandler);
  app.post('/:id/reset-password',{ preHandler: [requirePermission('users.reset_password')]}, resetPasswordHandler);
  app.post('/:id/assign-role',   { preHandler: [requirePermission('users.assign_role')]   }, assignRoleHandler);
  app.delete('/:id',             { preHandler: [requirePermission('users.delete')]        }, deleteUserHandler);
}