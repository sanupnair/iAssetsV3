import type { FastifyRequest, FastifyReply } from 'fastify';
import * as OrgService from './organizations.service.js';
import {
  createOrgSchema,
  updateOrgSchema,
  listOrgSchema,
} from './organizations.schema.js';

export async function listOrgsHandler(req: FastifyRequest, reply: FastifyReply) {
  const input  = listOrgSchema.parse(req.query);
  const result = await OrgService.listOrgs(input);

  return reply.send({
    success: true,
    message: 'Organizations fetched',
    data:    result.data,
    meta:    result.meta,
  });
}

export async function getOrgHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const org    = await OrgService.getOrgById(id);

  return reply.send({
    success: true,
    message: 'Organization fetched',
    data:    org,
  });
}

export async function createOrgHandler(req: FastifyRequest, reply: FastifyReply) {
  const input = createOrgSchema.parse(req.body);
  const org   = await OrgService.createOrg(input, req.user.sub);

  return reply.status(201).send({
    success: true,
    message: 'Organization created',
    data:    org,
  });
}

export async function updateOrgHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const input  = updateOrgSchema.parse(req.body);
  const org    = await OrgService.updateOrg(id, input, req.user.sub);

  return reply.send({
    success: true,
    message: 'Organization updated',
    data:    org,
  });
}

export async function toggleOrgStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const org    = await OrgService.toggleOrgStatus(id, req.user.sub);

  return reply.send({
    success: true,
    message: `Organization ${org.isActive ? 'activated' : 'deactivated'}`,
    data:    org,
  });
}

export async function deleteOrgHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await OrgService.deleteOrg(id, req.user.sub);

  return reply.send({
    success: true,
    message: 'Organization deleted',
    data:    null,
  });
}