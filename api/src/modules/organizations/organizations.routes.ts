import type { FastifyInstance } from 'fastify';
import {
  listOrgsHandler,
  getOrgHandler,
  createOrgHandler,
  updateOrgHandler,
  toggleOrgStatusHandler,
  deleteOrgHandler,
} from './organizations.controller.js';
import {
  authenticate,
  requirePermission,
} from '../../middleware/authenticate.js';

export async function organizationRoutes(app: FastifyInstance): Promise<void> {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  app.get('/',           { preHandler: [requirePermission('org.view')]   }, listOrgsHandler);
  app.get('/:id',        { preHandler: [requirePermission('org.view')]   }, getOrgHandler);
  app.post('/',          { preHandler: [requirePermission('org.edit')]   }, createOrgHandler);
  app.patch('/:id',      { preHandler: [requirePermission('org.edit')]   }, updateOrgHandler);
  app.patch('/:id/toggle-status', { preHandler: [requirePermission('org.settings')] }, toggleOrgStatusHandler);
  app.delete('/:id',     { preHandler: [requirePermission('org.edit')]   }, deleteOrgHandler);
}