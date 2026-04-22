import type { FastifyRequest, FastifyReply } from 'fastify';
import * as BranchService from './branches.service.js';
import { createBranchSchema, updateBranchSchema, listBranchSchema } from './branches.schema.js';

export async function listBranchesHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = listBranchSchema.parse(req.query);
  const result = await BranchService.listBranches(input);
  return reply.send({ success: true, message: 'Branches fetched', data: result.data, meta: result.meta });
}

export async function getBranchHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const branch = await BranchService.getBranchById(id);
  return reply.send({ success: true, message: 'Branch fetched', data: branch });
}

export async function createBranchHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = createBranchSchema.parse(req.body);
  const branch = await BranchService.createBranch(input, req.user.sub);
  return reply.status(201).send({ success: true, message: 'Branch created', data: branch });
}

export async function updateBranchHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = updateBranchSchema.parse(req.body);
  const branch = await BranchService.updateBranch(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Branch updated', data: branch });
}

export async function toggleBranchStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const branch = await BranchService.toggleBranchStatus(id, req.user.sub);
  return reply.send({ success: true, message: `Branch ${branch.isActive ? 'activated' : 'deactivated'}`, data: branch });
}

export async function deleteBranchHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await BranchService.deleteBranch(id, req.user.sub);
  return reply.send({ success: true, message: 'Branch deleted', data: null });
}