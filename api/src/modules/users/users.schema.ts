import { z } from 'zod';

export const createUserSchema = z.object({
  orgId:              z.string().uuid(),
  firstName:          z.string().min(1).max(100),
  lastName:           z.string().optional(),
  displayName:        z.string().optional(),
  email:              z.string().email(),
  username:           z.string().min(2).max(100).optional(),
  employeeId:         z.string().max(50).optional(),
  departmentId:       z.string().uuid().optional(),
  designationId:      z.string().uuid().optional(),
  branchId:           z.string().uuid().optional(),
  locationId:         z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().optional(),
  joiningDate:        z.string().optional(),       // ISO date string
  workEmail:          z.string().email().optional().or(z.literal('')),
  workPhone:          z.string().optional(),
  mobile:             z.string().optional(),
  extension:          z.string().optional(),
  status:             z.enum(['active', 'inactive', 'suspended', 'offboarded']).optional(),
  timezone:           z.string().optional(),
  locale:             z.string().optional(),
  theme:              z.enum(['light', 'dark', 'system']).optional(),
});

export const updateUserSchema = createUserSchema.omit({ orgId: true, email: true }).partial();

export const listUserSchema = z.object({
  page:           z.coerce.number().min(1).default(1),
  limit:          z.coerce.number().min(1).max(100).default(20),
  search:         z.string().optional(),
  orgId:          z.string().uuid().optional(),
  departmentId:   z.string().uuid().optional(),
  branchId:       z.string().uuid().optional(),
  designationId:  z.string().uuid().optional(),
  status:         z.enum(['active', 'inactive', 'suspended', 'offboarded']).optional(),
  sortBy:         z.enum(['firstName', 'email', 'createdAt', 'joiningDate']).default('createdAt'),
  sortOrder:      z.enum(['asc', 'desc']).default('desc'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUserInput   = z.infer<typeof listUserSchema>;