import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { fail } from '../utils/response.js';

// Last-resort error handler. Individual controllers should still catch
// and handle expected errors (validation, not-found) themselves;
// this exists for anything unexpected so the process doesn't crash
// and the client still gets a clean JSON error.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err);
  fail(res, 'Something went wrong', 500);
}
