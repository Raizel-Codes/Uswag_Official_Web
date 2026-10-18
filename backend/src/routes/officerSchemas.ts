import { z } from 'zod';
import { COLLEGES } from '../config/colleges.js';

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
    // Six single seats plus one PRO per college (Article VI §1); the service checks the rest.
    .max(OFFICER_POSITIONS.length - 1 + COLLEGES.length),
});
