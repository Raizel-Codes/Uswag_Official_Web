import { z } from 'zod';

export const createManualPostSchema = z.object({
  body: z.string().min(1, 'Post body is required'),
  imageUrl: z.string().url().optional().nullable(),
  type: z.enum(['NEWS', 'MINUTE', 'ANNOUNCEMENT']).optional().default('NEWS'),
});
