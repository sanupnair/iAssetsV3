import { z } from 'zod';

export const createOrgSchema = z.object({
  name:      z.string().min(2, 'Name must be at least 2 characters').max(200),
  code:      z.string().min(2).max(20).toUpperCase(),
  legalName: z.string().max(300).optional(),
  industry:  z.string().max(100).optional(),
  size:      z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  website:   z.string().url().optional().or(z.literal('')),
  email:     z.string().email().optional().or(z.literal('')),
  phone:     z.string().max(20).optional(),
  address:   z.string().optional(),
  city:      z.string().max(100).optional(),
  state:     z.string().max(100).optional(),
  country:   z.string().max(60).default('India'),
  pincode:   z.string().max(10).optional(),
});

export const updateOrgSchema = createOrgSchema.partial();

export const listOrgSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
  sortBy:    z.enum(['name', 'code', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type ListOrgInput   = z.infer<typeof listOrgSchema>;