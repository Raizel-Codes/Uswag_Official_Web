import { z } from 'zod';

const OFFICER_POSITIONS = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR', 'BUSINESS_MANAGER', 'PRO'] as const;

// One elected batch: who holds which Article VI position for the coming term.
export const installTermSchema = z.object({
  assignments: z
    .array(
      z.object({
        userId: z.string().min(1),
        officerPosition: z.enum(OFFICER_POSITIONS),
      }),
    )
    .min(1, 'Choose at least the President.')
    .max(OFFICER_POSITIONS.length),
});
