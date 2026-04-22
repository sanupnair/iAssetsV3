import type { FastifyRequest, FastifyReply } from 'fastify';
import * as RoleService from './roles.service.js';
import {
  createRoleSchema,
  updateRoleSchema,
  listRoleSchema,
  assignPermissionsSchema,
} from './roles.schema.js';

export async function listPermissionsHandler(req: FastifyRequest, reply: FastifyReply) {
  const perms = await RoleService.listPermissions();
  return reply.send({ success: true, message: 'Permissions fetched', data: perms });
}

export async function listRolesHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = listRoleSchema.parse(req.query);
  const result = await RoleService.listRoles(input);
  return reply.send({ success: true, message: 'Roles fetched', data: result.data, meta: result.meta });
}

export async function getRoleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const role   = await RoleService.getRoleById(id);
  return reply.send({ success: true, message: 'Role fetched', data: role });
}

export async function createRoleHandler(req: FastifyRequest, reply: FastifyReply) {
  const input = createRoleSchema.parse(req.body);
  const role  = await RoleService.createRole(input, req.user.sub);
  return reply.status(201).send({ success: true, message: 'Role created', data: role });
}

export async function updateRoleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = updateRoleSchema.parse(req.body);
  const role   = await RoleService.updateRole(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Role updated', data: role });
}

export async function assignPermissionsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = assignPermissionsSchema.parse(req.body);
  const role   = await RoleService.assignPermissions(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Permissions assigned', data: role });
}

export async function toggleRoleStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const role   = await RoleService.toggleRoleStatus(id, req.user.sub);
  return reply.send({
    success: true,
    message: `Role ${role.isActive ? 'activated' : 'deactivated'}`,
    data:    role,
  });
}

export async function deleteRoleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await RoleService.deleteRole(id, req.user.sub);
  return reply.send({ success: true, message: 'Role deleted', data: null });
}