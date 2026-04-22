import type { FastifyRequest, FastifyReply } from 'fastify';
import * as DesignationService from './designations.service.js';
import {
  createDesignationSchema,
  updateDesignationSchema,
  listDesignationSchema,
} from './designations.schema.js';

export async function listDesignationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = listDesignationSchema.parse(req.query);
  const result = await DesignationService.listDesignations(input);
  return reply.send({ success: true, message: 'Designations fetched', data: result.data, meta: result.meta });
}

export async function getDesignationHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id }      = req.params as { id: string };
  const designation = await DesignationService.getDesignationById(id);
  return reply.send({ success: true, message: 'Designation fetched', data: designation });
}

export async function createDesignationHandler(req: FastifyRequest, reply: FastifyReply) {
  const input       = createDesignationSchema.parse(req.body);
  const designation = await DesignationService.createDesignation(input, req.user.sub);
  return reply.status(201).send({ success: true, message: 'Designation created', data: designation });
}

export async function updateDesignationHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id }      = req.params as { id: string };
  const input       = updateDesignationSchema.parse(req.body);
  const designation = await DesignationService.updateDesignation(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Designation updated', data: designation });
}

export async function toggleDesignationStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id }      = req.params as { id: string };
  const designation = await DesignationService.toggleDesignationStatus(id, req.user.sub);
  return reply.send({
    success: true,
    message: `Designation ${designation.isActive ? 'activated' : 'deactivated'}`,
    data:    designation,
  });
}

export async function deleteDesignationHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await DesignationService.deleteDesignation(id, req.user.sub);
  return reply.send({ success: true, message: 'Designation deleted', data: null });
}