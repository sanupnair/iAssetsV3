import { z } from 'zod';

export const createLocationSchema = z.object({
  orgId:       z.string().uuid('Invalid organization ID'),
  branchId:    z.string().uuid('Invalid branch ID').optional(),
  parentId:    z.string().uuid('Invalid parent location ID').optional(),
  name:        z.string().min(2).max(200),
  code:        z.string().min(2).max(20).toUpperCase(),
  type:        z.enum(['building', 'floor', 'wing', 'room', 'desk', 'warehouse', 'zone', 'other']).optional(),
  floor:       z.string().max(20).optional(),
  description: z.string().optional(),
});

export const updateLocationSchema = createLocationSchema.partial().omit({ orgId: true });

export const listLocationSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  orgId:     z.string().uuid().optional(),
  branchId:  z.string().uuid().optional(),
  parentId:  z.string().uuid().optional(),
  type:      z.string().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
  sortBy:    z.enum(['name', 'code', 'type', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type ListLocationInput   = z.infer<typeof listLocationSchema>;