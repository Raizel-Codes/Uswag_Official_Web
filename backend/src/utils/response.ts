import type { Response } from 'express';

// Consistent response shaping. Controllers should go through this
// rather than calling res.json() directly, per claude.md conventions.
export function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res: Response, message: string, status = 400, details?: unknown) {
  return res.status(status).json({ success: false, message, details });
}
