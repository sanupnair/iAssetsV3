import { z } from 'zod';

export const createDepartmentSchema = z.object({
  orgId:       z.string().uuid('Invalid organization ID'),
  parentId:    z.string().uuid('Invalid parent department ID').optional(),
  name:        z.string().min(2).max(200),
  code:        z.string().min(2).max(20).toUpperCase(),
  description: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().omit({ orgId: true });

export const listDepartmentSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  orgId:     z.string().uuid().optional(),
  parentId:  z.string().uuid().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
  sortBy:    z.enum(['name', 'code', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type ListDepartmentInput   = z.infer<typeof listDepartmentSchema>;