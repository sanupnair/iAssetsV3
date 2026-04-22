import type { FastifyRequest, FastifyReply } from 'fastify';
import * as DeptService from './departments.service.js';
import { createDepartmentSchema, updateDepartmentSchema, listDepartmentSchema } from './departments.schema.js';

export async function listDepartmentsHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = listDepartmentSchema.parse(req.query);
  const result = await DeptService.listDepartments(input);
  return reply.send({ success: true, message: 'Departments fetched', data: result.data, meta: result.meta });
}

export async function getDepartmentTreeHandler(req: FastifyRequest, reply: FastifyReply) {
  const { orgId } = req.query as { orgId: string };
  if (!orgId) throw Object.assign(new Error('orgId is required'), { statusCode: 400 });
  const tree = await DeptService.getDepartmentTree(orgId);
  return reply.send({ success: true, message: 'Department tree fetched', data: tree });
}

export async function getDepartmentHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const dept   = await DeptService.getDepartmentById(id);
  return reply.send({ success: true, message: 'Department fetched', data: dept });
}

export async function createDepartmentHandler(req: FastifyRequest, reply: FastifyReply) {
  const input = createDepartmentSchema.parse(req.body);
  const dept  = await DeptService.createDepartment(input, req.user.sub);
  return reply.status(201).send({ success: true, message: 'Department created', data: dept });
}

export async function updateDepartmentHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = updateDepartmentSchema.parse(req.body);
  const dept   = await DeptService.updateDepartment(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Department updated', data: dept });
}

export async function toggleDepartmentStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const dept   = await DeptService.toggleDepartmentStatus(id, req.user.sub);
  return reply.send({
    success: true,
    message: `Department ${dept.isActive ? 'activated' : 'deactivated'}`,
    data:    dept,
  });
}

export async function deleteDepartmentHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await DeptService.deleteDepartment(id, req.user.sub);
  return reply.send({ success: true, message: 'Department deleted', data: null });
}