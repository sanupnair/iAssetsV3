import type { FastifyInstance } from 'fastify';
import {
  listPermissionsHandler,
  listRolesHandler,
  getRoleHandler,
  createRoleHandler,
  updateRoleHandler,
  assignPermissionsHandler,
  toggleRoleStatusHandler,
  deleteRoleHandler,
} from './roles.controller.js';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';

export async function roleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Permissions list (for UI dropdowns)
  app.get('/permissions', { preHandler: [requirePermission('roles.view')] }, listPermissionsHandler);

  // Roles CRUD
  app.get('/',    { preHandler: [requirePermission('roles.view')]   }, listRolesHandler);
  app.get('/:id', { preHandler: [requirePermission('roles.view')]   }, getRoleHandler);
  app.post('/',   { preHandler: [requirePermission('roles.create')] }, createRoleHandler);
  app.patch('/:id',                  { preHandler: [requirePermission('roles.edit')]   }, updateRoleHandler);
  app.put('/:id/permissions',        { preHandler: [requirePermission('roles.edit')]   }, assignPermissionsHandler);
  app.patch('/:id/toggle-status',    { preHandler: [requirePermission('roles.edit')]   }, toggleRoleStatusHandler);
  app.delete('/:id',                 { preHandler: [requirePermission('roles.delete')] }, deleteRoleHandler);
}