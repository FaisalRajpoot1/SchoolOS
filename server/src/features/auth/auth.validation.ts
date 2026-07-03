import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  schoolId: z.string().uuid(),
  // Optional second factor (required only when the account has 2FA enabled).
  totpCode: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code').optional(),
  backupCode: z.string().trim().min(1).max(32).optional(),
});

export const twoFactorCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  schoolId: z.string().uuid(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const sessionIdParamSchema = z.object({ sessionId: z.string().uuid() });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
