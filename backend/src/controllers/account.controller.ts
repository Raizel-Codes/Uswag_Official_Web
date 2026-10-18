import type { Request, Response } from 'express';
import { AccountError, deleteAccount, previewDeletion } from '../services/account.service.js';
import { ok, fail } from '../utils/response.js';

// Turns a rule the Super Admin can fix (own account, last Super Admin, records to confirm…) into a
// 4xx with its message; anything else is a real error and falls through to the error handler.
function failAccount(res: Response, err: unknown) {
  if (err instanceof AccountError) return fail(res, err.message, err.status, err.details);
  throw err;
}

// SUPER ADMIN ONLY — requireRole('SUPER_ADMIN') in account.routes.ts.
export async function getDeletionImpact(req: Request, res: Response) {
  try {
    return ok(res, await previewDeletion(req.user!, req.params.userId));
  } catch (err) {
    return failAccount(res, err);
  }
}

export async function removeAccount(req: Request, res: Response) {
  try {
    const { account } = await deleteAccount(req.user!, req.params.userId, req.body.purgeRecords === true);
    return ok(res, { id: account.id, name: account.name });
  } catch (err) {
    return failAccount(res, err);
  }
}
