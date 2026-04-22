import { z } from 'zod';

export const createBranchSchema = z.object({
  orgId:        z.string().uuid('Invalid organization ID'),
  name:         z.string().min(2).max(200),
  code:         z.string().min(2).max(20).toUpperCase(),
  address:      z.string().optional(),
  city:         z.string().max(100).optional(),
  state:        z.string().max(100).optional(),
  country:      z.string().max(60).default('India'),
  pincode:      z.string().max(10).optional(),
  phone:        z.string().max(20).optional(),
  email:        z.string().email().optional().or(z.literal('')),
  isHeadOffice: z.boolean().default(false),
});

export const updateBranchSchema = createBranchSchema.partial().omit({ orgId: true });

export const listBranchSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  orgId:     z.string().uuid().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
  sortBy:    z.enum(['name', 'code', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type ListBranchInput   = z.infer<typeof listBranchSchema>;