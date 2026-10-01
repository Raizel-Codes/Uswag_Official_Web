import { z } from 'zod';
import { studentIdField } from './memberSchemas.js';

export const forgotPasswordSchema = z.object({
  email: z.string().email('A valid email is required'),
});

// Asking an officer for help signing in (no email involved). The student ID lets the officer see that the
// asker knows something only the owner should.
export const requestResetHelpSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  studentId: studentIdField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
