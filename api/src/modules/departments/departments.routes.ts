import type { FastifyInstance } from 'fastify';
import {
  listDepartmentsHandler,
  getDepartmentTreeHandler,
  getDepartmentHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  toggleDepartmentStatusHandler,
  deleteDepartmentHandler,
} from './departments.controller.js';
import { authenticate, requirePermission } from '../../middleware/authenticate.js';

export async function departmentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/tree', { preHandler: [requirePermission('departments.view')]   }, getDepartmentTreeHandler);
  app.get('/',     { preHandler: [requirePermission('departments.view')]   }, listDepartmentsHandler);
  app.get('/:id',  { preHandler: [requirePermission('departments.view')]   }, getDepartmentHandler);
  app.post('/',    { preHandler: [requirePermission('departments.create')] }, createDepartmentHandler);
  app.patch('/:id',              { preHandler: [requirePermission('departments.edit')]   }, updateDepartmentHandler);
  app.patch('/:id/toggle-status',{ preHandler: [requirePermission('departments.edit')]   }, toggleDepartmentStatusHandler);
  app.delete('/:id',             { preHandler: [requirePermission('departments.delete')] }, deleteDepartmentHandler);
}