import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerSchema = z.object({
  email: z.string().email(),
  password,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  schoolId: z.string().uuid(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  schoolId: z.string().uuid(),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
