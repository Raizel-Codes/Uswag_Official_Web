import crypto from 'crypto';
import type { UserRole } from '@prisma/client';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { hashStudentId } from '../utils/crypto.js';
import { academicYearEnd, academicYearStart, currentAcademicYear } from '../utils/academicYear.js';
import { logAction } from './audit.service.js';
import { createPasswordResetToken, hashPassword, RESET_TOKEN_TTL_MS } from './auth.service.js';
import { generateSerialNumber } from './member.service.js';

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
    select: { id: true, name: true, email: true, role: true, officerPosition: true, collegeOrDept: true, isDeveloper: true },
  });
  if (!target) throw new AccountError('That account no longer exists.', 404);
  // The overseer's account is not the organization's to remove; it is managed with scripts/create-developer.ts.
  if (target.isDeveloper) throw new AccountError('This is the site developer’s account. It can’t be deleted from here.', 403);
  if (target.id === actor.id) throw new AccountError('You can’t delete the account you’re signed in with.', 422);
  // The VP is Super-Admin-equivalent (role.middleware.ts) but only the President may remove a Super Admin.
  if (target.role === 'SUPER_ADMIN') {
    if (actor.role !== 'SUPER_ADMIN') throw new AccountError('Only the President can delete a Super Admin account.', 403);
    // Without one the console would have nobody left to run it.
    const superAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN', isDeveloper: false } });
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

const setupUrl = (rawToken: string) => `${env.frontendOrigin}/reset-password?token=${rawToken}`;
const SETUP_LINK_MINUTES = RESET_TOKEN_TTL_MS / 60_000;

interface NewAccount {
  name: string;
  email: string;
  studentId: string;
  collegeOrDept: string;
  yearLevel?: string;
}

/**
 * Super Admin creates the account of someone who is already a member in good standing (an officer
 * for the coming term, say), without sending them through the public application. The account is a
 * regular member whose membership is ACTIVE for the current academic year; giving them a position
 * is a separate step (Install term), so the Article VI rules stay in one place. The password is
 * random and unknown to anyone: the person sets their own through the one-time setup link this
 * returns, which the Super Admin hands over in person. The student ID may be corrected later by the
 * person themselves (profile.service.ts changeStudentId).
 */
export async function createAccount(actor: Actor, input: NewAccount) {
  const taken = await prisma.user.findFirst({ where: { email: { equals: input.email, mode: 'insensitive' } }, select: { id: true } });
  if (taken) throw new AccountError('An account with this email already exists.', 409);
  const studentIdHash = hashStudentId(input.studentId);
  if (await prisma.memberProfile.findUnique({ where: { studentIdHash }, select: { id: true } })) {
    throw new AccountError('Someone already has an account with this student ID.', 409);
  }

  const year = currentAcademicYear();
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
  let user;
  for (let attempt = 1; ; attempt++) {
    const serialNumber = await generateSerialNumber(academicYearStart(year));
    try {
      user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          awaitingPasswordSetup: true,
          role: 'MEMBER',
          collegeOrDept: input.collegeOrDept,
          yearLevel: input.yearLevel,
          memberProfile: {
            create: { status: 'ACTIVE', serialNumber, academicYear: year, expiresAt: academicYearEnd(year), qrIssuedAt: new Date(), studentIdHash },
          },
        },
        select: { id: true, name: true, email: true },
      });
      break;
    } catch (err) {
      const e = err as { code?: string; meta?: { target?: unknown } };
      if (e.code !== 'P2002') throw err;
      const target = String(e.meta?.target);
      if (target.includes('serialNumber') && attempt < 5) continue; // two accounts at once picked the same serial
      if (target.includes('studentIdHash')) throw new AccountError('Someone already has an account with this student ID.', 409);
      if (target.includes('email')) throw new AccountError('An account with this email already exists.', 409);
      throw err;
    }
  }

  await logAction(actor.id, 'account.create', 'User', user.id, { name: user.name, email: user.email });
  const rawToken = await createPasswordResetToken(user.id);
  return { ...user, url: setupUrl(rawToken), expiresInMinutes: SETUP_LINK_MINUTES };
}

/** A fresh one-time setup link, for an account whose owner hasn't chosen a password yet. */
export async function issueSetupLink(actor: Actor, userId: string) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, awaitingPasswordSetup: true } });
  if (!target) throw new AccountError('That account no longer exists.', 404);
  if (!target.awaitingPasswordSetup) {
    throw new AccountError('They have already set their own password. If they forgot it, use the password-reset requests instead.', 409);
  }
  const rawToken = await createPasswordResetToken(userId);
  await logAction(actor.id, 'account.setupLink.create', 'User', userId);
  return { url: setupUrl(rawToken), expiresInMinutes: SETUP_LINK_MINUTES };
}
