import type { FastifyRequest, FastifyReply } from 'fastify';
import * as UserService from './users.service.js';
import {
  createUserSchema,
  updateUserSchema,
  listUserSchema,
  resetPasswordSchema,
  assignRoleSchema,
  updateStatusSchema,
} from './users.schema.js';

export async function listUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = listUserSchema.parse(req.query);
  const result = await UserService.listUsers(input);
  return reply.send({ success: true, message: 'Users fetched', data: result.data, meta: result.meta });
}

export async function getUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const user   = await UserService.getUserById(id);
  return reply.send({ success: true, message: 'User fetched', data: user });
}

export async function createUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const input = createUserSchema.parse(req.body);
  const user  = await UserService.createUser(input, req.user.sub);
  return reply.status(201).send({ success: true, message: 'User created', data: user });
}

export async function updateUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = updateUserSchema.parse(req.body);
  const user   = await UserService.updateUser(id, input, req.user.sub);
  return reply.send({ success: true, message: 'User updated', data: user });
}

export async function updateUserStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = updateStatusSchema.parse(req.body);
  const user   = await UserService.updateUserStatus(id, input, req.user.sub);
  return reply.send({ success: true, message: `User ${input.status}`, data: user });
}

export async function resetPasswordHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = resetPasswordSchema.parse(req.body);
  await UserService.resetPassword(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Password reset successfully', data: null });
}

export async function assignRoleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = assignRoleSchema.parse(req.body);
  const user   = await UserService.assignRole(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Role assigned successfully', data: user });
}

export async function deleteUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await UserService.deleteUser(id, req.user.sub);
  return reply.send({ success: true, message: 'User deleted', data: null });
}