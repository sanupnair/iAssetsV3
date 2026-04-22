import type { FastifyRequest, FastifyReply } from 'fastify';
import * as LocationService from './locations.service.js';
import { createLocationSchema, updateLocationSchema, listLocationSchema } from './locations.schema.js';

export async function listLocationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = listLocationSchema.parse(req.query);
  const result = await LocationService.listLocations(input);
  return reply.send({ success: true, message: 'Locations fetched', data: result.data, meta: result.meta });
}

export async function getLocationTreeHandler(req: FastifyRequest, reply: FastifyReply) {
  const { orgId } = req.query as { orgId: string };
  if (!orgId) throw Object.assign(new Error('orgId is required'), { statusCode: 400 });
  const tree = await LocationService.getLocationTree(orgId);
  return reply.send({ success: true, message: 'Location tree fetched', data: tree });
}

export async function getLocationHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id }     = req.params as { id: string };
  const location   = await LocationService.getLocationById(id);
  return reply.send({ success: true, message: 'Location fetched', data: location });
}

export async function createLocationHandler(req: FastifyRequest, reply: FastifyReply) {
  const input    = createLocationSchema.parse(req.body);
  const location = await LocationService.createLocation(input, req.user.sub);
  return reply.status(201).send({ success: true, message: 'Location created', data: location });
}

export async function updateLocationHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id }   = req.params as { id: string };
  const input    = updateLocationSchema.parse(req.body);
  const location = await LocationService.updateLocation(id, input, req.user.sub);
  return reply.send({ success: true, message: 'Location updated', data: location });
}

export async function toggleLocationStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id }   = req.params as { id: string };
  const location = await LocationService.toggleLocationStatus(id, req.user.sub);
  return reply.send({
    success: true,
    message: `Location ${location.isActive ? 'activated' : 'deactivated'}`,
    data:    location,
  });
}

export async function deleteLocationHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await LocationService.deleteLocation(id, req.user.sub);
  return reply.send({ success: true, message: 'Location deleted', data: null });
}