import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { logAction } from '../services/audit.service.js';
import { ok, fail } from '../utils/response.js';

// SUPER ADMIN ONLY. Amendments per Article IX require a general-assembly
// vote before being marked "approved" — this endpoint records the
// proposal/approval state, it does not itself constitute ratification.
export async function listAmendments(_req: Request, res: Response) {
  const amendments = await prisma.amendmentLog.findMany({ orderBy: { createdAt: 'desc' } });
  return ok(res, amendments);
}

export async function proposeAmendment(req: Request, res: Response) {
  const { articleRef, proposal } = req.body;
  if (!articleRef?.trim() || !proposal?.trim()) {
    return fail(res, 'articleRef and proposal are required', 400);
  }
  const amendment = await prisma.amendmentLog.create({
    data: { articleRef, proposal, proposedBy: req.user!.id, status: 'proposed' },
  });
  await logAction(req.user!.id, 'bylaws.propose_amendment', 'AmendmentLog', amendment.id);
  return ok(res, amendment, 201);
}

// PATCH /bylaws/amendments/:id/resolve — approve or reject a pending amendment
export async function resolveAmendment(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return fail(res, 'status must be "approved" or "rejected"', 400);
  }
  const existing = await prisma.amendmentLog.findUnique({ where: { id } });
  if (!existing) return fail(res, 'Amendment not found', 404);
  if (existing.status !== 'proposed') {
    return fail(res, 'Only proposed amendments can be resolved', 409);
  }
  const updated = await prisma.amendmentLog.update({
    where: { id },
    data: { status, resolvedAt: new Date() },
  });
  await logAction(req.user!.id, `bylaws.${status}`, 'AmendmentLog', id);
  return ok(res, updated);
}
