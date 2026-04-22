import { z } from 'zod';

export const createOrgSchema = z.object({
  name:         z.string().min(2).max(300),
  legalName:    z.string().optional(),
  shortCode:    z.string().max(20).optional(),   // ← was 'code', now 'shortCode' and optional
  website:      z.string().optional(),
  description:  z.string().optional(),
  primaryEmail: z.string().email().optional().or(z.literal('')),
  primaryPhone: z.string().max(20).optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().max(20).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().optional(),
  country:      z.string().optional(),
  pincode:      z.string().optional(),
  gstin:        z.string().optional(),
  pan:          z.string().optional(),
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