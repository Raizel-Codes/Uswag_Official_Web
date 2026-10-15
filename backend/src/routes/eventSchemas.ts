import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  pillar: z.enum(['YOUTH_VOICE', 'MENTAL_HEALTH', 'ENVIRONMENTAL']),
  scope: z.enum(['IN_CAMPUS', 'OUT_OF_CAMPUS']),
  location: z.string().min(1, 'Location is required'),
  startsAt: z.string().datetime({ message: "Invalid date format" }),
  limitedSlots: z.number().int().positive().optional().nullable(),
  // "Publish" saves CONFIRMED and notifies members; "Save as draft" keeps it private to officers.
  status: z.enum(['DRAFT', 'CONFIRMED']).default('CONFIRMED'),
});
