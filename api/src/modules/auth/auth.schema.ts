import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password:   z.string().min(1, 'Password is required'),
  deviceName: z.string().optional(),
  deviceType: z.enum(['web', 'mobile', 'tablet', 'desktop']).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

export type LoginInput          = z.infer<typeof loginSchema>;
export type RefreshInput        = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;