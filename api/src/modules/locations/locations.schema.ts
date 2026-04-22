import { z } from 'zod';

export const createLocationSchema = z.object({
  orgId:            z.string().uuid(),
  branchId:         z.string().uuid().optional(),
  parentLocationId: z.string().uuid().optional(),
  name:             z.string().min(2).max(300),
  code:             z.string().max(20).optional(),
  type:             z.string().max(50).optional(),
  description:      z.string().optional(),
  floorNumber:      z.number().int().optional(),
  capacity:         z.number().int().min(0).optional(),
  areaSqft:         z.number().min(0).optional(),
});

export const updateLocationSchema = createLocationSchema.omit({ orgId: true }).partial();

export const listLocationSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  orgId:     z.string().uuid().optional(),
  branchId:  z.string().uuid().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
  sortBy:    z.enum(['name', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type ListLocationInput   = z.infer<typeof listLocationSchema>;