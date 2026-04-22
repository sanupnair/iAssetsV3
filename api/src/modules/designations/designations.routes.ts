import type { FastifyInstance } from 'fastify';
import {
  listDesignationsHandler,
  getDesignationHandler,
  createDesignationHandler,
  updateDesignationHandler,
  toggleDesignationStatusHandler,
  deleteDesignationHandler,
} from './designations.controller.js';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';

export async function designationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/',    { preHandler: [requirePermission('departments.view')]   }, listDesignationsHandler);
  app.get('/:id', { preHandler: [requirePermission('departments.view')]   }, getDesignationHandler);
  app.post('/',   { preHandler: [requirePermission('departments.create')] }, createDesignationHandler);
  app.patch('/:id',               { preHandler: [requirePermission('departments.edit')]   }, updateDesignationHandler);
  app.patch('/:id/toggle-status', { preHandler: [requirePermission('departments.edit')]   }, toggleDesignationStatusHandler);
  app.delete('/:id',              { preHandler: [requirePermission('departments.delete')] }, deleteDesignationHandler);
}