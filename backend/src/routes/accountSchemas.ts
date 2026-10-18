import { z } from 'zod';

// The Super Admin has seen what the account's officer records are and agreed to delete them too.
export const deleteAccountSchema = z.object({
  purgeRecords: z.boolean().optional(),
});
