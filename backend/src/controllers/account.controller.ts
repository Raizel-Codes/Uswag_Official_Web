import type { Request, Response } from 'express';
import { AccountError, createAccount, deleteAccount, issueSetupLink, previewDeletion } from '../services/account.service.js';
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

// Adds an active member (an incoming officer, say) without the public application; returns the
// one-time link they use to choose their own password.
export async function addAccount(req: Request, res: Response) {
  try {
    return ok(res, await createAccount(req.user!, req.body), 201);
  } catch (err) {
    return failAccount(res, err);
  }
}

export async function newSetupLink(req: Request, res: Response) {
  try {
    return ok(res, await issueSetupLink(req.user!, req.params.userId));
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
