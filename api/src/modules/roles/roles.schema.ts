import { z } from 'zod';

export const createRoleSchema = z.object({
  orgId:          z.string().uuid(),
  name:           z.string().min(2).max(100),
  code:           z.string().max(20).optional(),
  description:    z.string().optional(),
  color:          z.string().max(20).optional(),
  icon:           z.string().max(50).optional(),
  level:          z.coerce.number().int().min(0).max(99).optional(),
  canApprove:     z.boolean().optional().default(false),
  canManageUsers: z.boolean().optional().default(false),
  isDefault:      z.boolean().optional().default(false),
});

export const updateRoleSchema = createRoleSchema.omit({ orgId: true }).partial();

export const listRoleSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  orgId:     z.string().uuid().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
  sortBy:    z.enum(['name', 'level', 'createdAt']).default('level'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type ListRoleInput   = z.infer<typeof listRoleSchema>;