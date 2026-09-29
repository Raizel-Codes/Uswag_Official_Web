import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { fail } from '../utils/response.js';


function handler(_req: Request, res: Response) {
  fail(res, 'Too many requests. Please wait a moment and try again.', 429);
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const applyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});


export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
