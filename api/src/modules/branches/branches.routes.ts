import type { FastifyInstance } from 'fastify';
import {
  listBranchesHandler,
  getBranchHandler,
  createBranchHandler,
  updateBranchHandler,
  toggleBranchStatusHandler,
  deleteBranchHandler,
} from './branches.controller.js';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';

export async function branchRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/',    { preHandler: [requirePermission('branches.view')]   }, listBranchesHandler);
  app.get('/:id', { preHandler: [requirePermission('branches.view')]   }, getBranchHandler);
  app.post('/',   { preHandler: [requirePermission('branches.create')] }, createBranchHandler);
  app.patch('/:id',             { preHandler: [requirePermission('branches.edit')]   }, updateBranchHandler);
  app.patch('/:id/toggle-status', { preHandler: [requirePermission('branches.edit')] }, toggleBranchStatusHandler);
  app.delete('/:id',            { preHandler: [requirePermission('branches.delete')] }, deleteBranchHandler);
}