import { z } from 'zod';
import { COLLEGES, YEAR_LEVELS } from '../config/colleges.js';
import { studentIdField } from './memberSchemas.js';

// Super Admin adds an account for someone already in good standing. The student ID can be wrong here:
// the person corrects it from their own profile later.
export const createAccountSchema = z.object({
  name: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  studentId: studentIdField,
  collegeOrDept: z.enum(COLLEGES, { errorMap: () => ({ message: 'Choose a college or department from the list' }) }),
  yearLevel: z.enum(YEAR_LEVELS).optional(),
});

// The Super Admin has seen what the account's officer records are and agreed to delete them too.
export const deleteAccountSchema = z.object({
  purgeRecords: z.boolean().optional(),
});
