import { z } from 'zod';

export const createBranchSchema = z.object({
  orgId:        z.string().uuid(),
  name:         z.string().min(2).max(300),
  code:         z.string().max(20).optional(),
  branchType:   z.string().max(50).optional(),
  description:  z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  pincode:      z.string().optional(),
  phone:        z.string().max(20).optional(),
  email:        z.string().email().optional().or(z.literal('')),
  gstin:        z.string().optional(),
  isHq:         z.boolean().optional(),
});

export const updateBranchSchema = createBranchSchema.omit({ orgId: true }).partial();

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