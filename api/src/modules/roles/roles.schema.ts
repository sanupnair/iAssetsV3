import { z } from 'zod';

export const createRoleSchema = z.object({
  orgId:       z.string().uuid('Invalid organization ID').optional(),
  name:        z.string().min(2).max(100),
  code:        z.string().min(2).max(50).toUpperCase(),
  description: z.string().optional(),
  level:       z.coerce.number().min(1).max(100).default(1),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const updateRoleSchema = createRoleSchema.partial().omit({ orgId: true });

export const listRoleSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  orgId:     z.string().uuid().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
  sortBy:    z.enum(['name', 'code', 'level', 'createdAt']).default('level'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const assignPermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export type CreateRoleInput        = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput        = z.infer<typeof updateRoleSchema>;
export type ListRoleInput          = z.infer<typeof listRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;