import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('A valid email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
