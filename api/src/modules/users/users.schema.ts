import { z } from 'zod';

export const createUserSchema = z.object({
  orgId:             z.string().uuid('Invalid organization ID').optional(),
  employeeId:        z.string().max(30).optional(),
  firstName:         z.string().min(1).max(100),
  lastName:          z.string().min(1).max(100),
  displayName:       z.string().max(200).optional(),
  email:             z.string().email('Invalid email address'),
  username:          z.string().min(3).max(100).toLowerCase(),
  password:          z.string().min(8, 'Password must be at least 8 characters'),
  departmentId:      z.string().uuid().optional(),
  designationId:     z.string().uuid().optional(),
  branchId:          z.string().uuid().optional(),
  locationId:        z.string().uuid().optional(),
  reportingManagerId:z.string().uuid().optional(),
  joiningDate:       z.string().optional(),
  workEmail:         z.string().email().optional().or(z.literal('')),
  workPhone:         z.string().max(20).optional(),
  mobile:            z.string().max(20).optional(),
  extension:         z.string().max(10).optional(),
  roleId:            z.string().uuid('Invalid role ID'),
  timezone:          z.string().default('Asia/Kolkata'),
  locale:            z.string().default('en-IN'),
  theme:             z.enum(['light', 'dark', 'system']).default('system'),
  mustChangePassword:z.boolean().default(true),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true, email: true, username: true, roleId: true })
  .partial();

export const listUserSchema = z.object({
  page:         z.coerce.number().min(1).default(1),
  limit:        z.coerce.number().min(1).max(100).default(20),
  search:       z.string().optional(),
  orgId:        z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  branchId:     z.string().uuid().optional(),
  roleCode:     z.string().optional(),
  status:       z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  sortBy:       z.enum(['firstName', 'lastName', 'email', 'username', 'createdAt']).default('createdAt'),
  sortOrder:    z.enum(['asc', 'desc']).default('desc'),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  mustChangePassword: z.boolean().default(true),
});

export const assignRoleSchema = z.object({
  roleId:     z.string().uuid('Invalid role ID'),
  validUntil: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});

export type CreateUserInput      = z.infer<typeof createUserSchema>;
export type UpdateUserInput      = z.infer<typeof updateUserSchema>;
export type ListUserInput        = z.infer<typeof listUserSchema>;
export type ResetPasswordInput   = z.infer<typeof resetPasswordSchema>;
export type AssignRoleInput      = z.infer<typeof assignRoleSchema>;
export type UpdateStatusInput    = z.infer<typeof updateStatusSchema>;