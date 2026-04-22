import { z } from 'zod';

export const createDesignationSchema = z.object({
  orgId:        z.string().uuid(),
  name:         z.string().min(2).max(300),
  shortName:    z.string().max(20).optional(),
  description:  z.string().optional(),
  level:        z.number().int().min(1).max(99).optional(),
  grade:        z.string().max(50).optional(),
  category:     z.string().max(50).optional(),
  canApprove:   z.boolean().optional(),
  isHodLevel:   z.boolean().optional(),
  isManagement: z.boolean().optional(),
});

export const updateDesignationSchema = createDesignationSchema.omit({ orgId: true }).partial();

export const listDesignationSchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  orgId:     z.string().uuid().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type ListDesignationInput   = z.infer<typeof listDesignationSchema>;