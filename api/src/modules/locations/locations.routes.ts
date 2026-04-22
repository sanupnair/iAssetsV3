import type { FastifyInstance } from 'fastify';
import {
  listLocationsHandler,
  getLocationTreeHandler,
  getLocationHandler,
  createLocationHandler,
  updateLocationHandler,
  toggleLocationStatusHandler,
  deleteLocationHandler,
} from './locations.controller.js';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';

export async function locationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/tree',            { preHandler: [requirePermission('branches.view')]   }, getLocationTreeHandler);
  app.get('/',                { preHandler: [requirePermission('branches.view')]   }, listLocationsHandler);
  app.get('/:id',             { preHandler: [requirePermission('branches.view')]   }, getLocationHandler);
  app.post('/',               { preHandler: [requirePermission('branches.create')] }, createLocationHandler);
  app.patch('/:id',           { preHandler: [requirePermission('branches.edit')]   }, updateLocationHandler);
  app.patch('/:id/toggle-status', { preHandler: [requirePermission('branches.edit')] }, toggleLocationStatusHandler);
  app.delete('/:id',          { preHandler: [requirePermission('branches.delete')] }, deleteLocationHandler);
}