import { z } from 'zod';

export const createDesignationSchema = z.object({
  orgId:        z.string().uuid('Invalid organization ID'),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  name:         z.string().min(2).max(200),
  code:         z.string().min(2).max(20).toUpperCase(),
  level:        z.coerce.number().min(1).max(100).default(1),
  description:  z.string().optional(),
});

export const updateDesignationSchema = createDesignationSchema.partial().omit({ orgId: true });

export const listDesignationSchema = z.object({
  page:         z.coerce.number().min(1).default(1),
  limit:        z.coerce.number().min(1).max(100).default(20),
  search:       z.string().optional(),
  orgId:        z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status:       z.enum(['active', 'inactive']).optional(),
  sortBy:       z.enum(['name', 'code', 'level', 'createdAt']).default('level'),
  sortOrder:    z.enum(['asc', 'desc']).default('asc'),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type ListDesignationInput   = z.infer<typeof listDesignationSchema>;