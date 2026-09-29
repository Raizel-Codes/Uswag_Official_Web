import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { fail } from '../utils/response.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return fail(res, 'Validation failed', 422, result.error.flatten());
    }
    req.body = result.data;
    next();
  };
}
