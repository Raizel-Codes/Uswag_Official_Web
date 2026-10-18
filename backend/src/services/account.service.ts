import type { UserRole } from '@prisma/client';
import { prisma } from '../config/db.js';
import { logAction } from './audit.service.js';

/** A reason the Super Admin can act on; the controller passes `status` and `details` straight to fail(). */
export class AccountError extends Error {
  constructor(message: string, readonly status = 400, readonly details?: unknown) {
    super(message);
  }
}

interface Actor {
  id: string;
  role: UserRole;
}

/**
 * What deleting an account takes with it. Membership data (profile, RSVPs, push subscriptions,
 * inbox) always goes with the account. `records` are things the person *did* as an officer: the
 * database refuses to delete an account that still has them, so they are removed only when the
 * Super Admin has seen these counts and confirmed (purgeRecords). Posts they wrote are kept with
 * the author cleared.
 */
export async function accountImpact(userId: string) {
  const [scans, auditEntries, financeEntries, purchaseRequests, posts, rsvps] = await Promise.all([
    prisma.attendanceRecord.count({ where: { scannedByOfficerId: userId } }),
    prisma.auditLogEntry.count({ where: { actorId: userId } }),
    prisma.financeEntry.count({ where: { recordedById: userId } }),
    prisma.purchaseRequest.count({ where: { requestedById: userId } }),
    prisma.post.count({ where: { authorId: userId } }),
    prisma.eventRsvp.count({ where: { member: { userId } } }),
  ]);
  const records = scans + auditEntries + financeEntries + purchaseRequests;
  return { scans, auditEntries, financeEntries, purchaseRequests, posts, rsvps, records };
}

async function loadDeletable(actor: Actor, userId: string) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, officerPosition: true, collegeOrDept: true },
  });
  if (!target) throw new AccountError('That account no longer exists.', 404);
  if (target.id === actor.id) throw new AccountError('You can’t delete the account you’re signed in with.', 422);
  // The VP is Super-Admin-equivalent (role.middleware.ts) but only the President may remove a Super Admin.
  if (target.role === 'SUPER_ADMIN') {
    if (actor.role !== 'SUPER_ADMIN') throw new AccountError('Only the President can delete a Super Admin account.', 403);
    // Without one the console would have nobody left to run it.
    const superAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    if (superAdmins <= 1) throw new AccountError('This is the last Super Admin account, so it can’t be deleted.', 422);
  }
  return target;
}

export async function previewDeletion(actor: Actor, userId: string) {
  const target = await loadDeletable(actor, userId);
  return { account: target, impact: await accountImpact(userId) };
}

export async function deleteAccount(actor: Actor, userId: string, purgeRecords: boolean) {
  const target = await loadDeletable(actor, userId);
  const impact = await accountImpact(userId);
  if (impact.records > 0 && !purgeRecords) {
    throw new AccountError('This account has officer records attached. Confirm to delete them along with the account.', 409, impact);
  }

  await prisma.$transaction([
    prisma.attendanceRecord.deleteMany({ where: { scannedByOfficerId: userId } }),
    prisma.auditLogEntry.deleteMany({ where: { actorId: userId } }),
    prisma.financeEntry.deleteMany({ where: { recordedById: userId } }),
    prisma.purchaseRequest.deleteMany({ where: { requestedById: userId } }),
    prisma.post.updateMany({ where: { authorId: userId }, data: { authorId: null } }),
    // Member profile, RSVPs, push subscriptions and notifications go with it (onDelete: Cascade).
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // Written after the account's own entries are gone, so this one always survives.
  await logAction(actor.id, 'account.delete', 'User', userId, {
    name: target.name,
    email: target.email,
    role: target.role,
    officerPosition: target.officerPosition,
    removed: impact,
  });
  return { account: target, impact };
}
