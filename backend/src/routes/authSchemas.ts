import { z } from 'zod';
import { studentIdField } from './memberSchemas.js';
import { COLLEGES, YEAR_LEVELS } from '../config/colleges.js';

// Self-service profile edits (PATCH /auth/me/profile). The email is the login, so it isn't editable here.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Full name is required').max(120),
  collegeOrDept: z.enum(COLLEGES, { errorMap: () => ({ message: 'Choose a college or department from the list' }) }),
  yearLevel: z.enum(YEAR_LEVELS).nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// POST /members/me/student-id: the password is asked again because the ID is what proves who someone is.
export const changeStudentIdSchema = z.object({
  password: z.string().min(1, 'Enter your password to confirm'),
  studentId: studentIdField,
});

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
