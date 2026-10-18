import type { OfficerPosition, UserRole } from '@prisma/client';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { hashStudentId } from '../utils/crypto.js';
import { createPasswordResetToken, RESET_TOKEN_TTL_MS } from './auth.service.js';
import { logAction } from './audit.service.js';
import { notifyUsers } from './notification.service.js';
import { logger } from '../utils/logger.js';

// Officer-assisted password reset — the way back in when mail isn't an option. The person asks (public,
// with their email and student ID); an officer confirms who they are by other means and issues a
// one-time link, the same 1-hour link as the email flow. Why it's built this way:
//
// - A link can only be issued for an OPEN REQUEST, i.e. the account owner asked. Without that, this would
//   be a button that takes over anyone's login.
// - Who may handle whose request is decided here, once (canHandle), and enforced on the server for the list,
//   for issuing and for dismissing:
//     member account  -> the Secretary (owns membership records, Article VI §2(c)) or the Super Admin / VP
//     officer account -> the Super Admin / VP only (a Secretary resetting the Treasurer would be a way into
//                        the finances), and never one's own account
// - The student ID typed in is compared to the fingerprint on file; the officer sees only matched / not
//   matched / couldn't check. The ID itself is never stored or shown.
// - Every issued link and every dismissal is audit-logged.

const REQUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const openSince = () => new Date(Date.now() - REQUEST_TTL_MS);

interface Actor {
  id: string;
  role: UserRole;
  officerPosition?: OfficerPosition | null;
}

const isSuperAdminEquivalent = (a: { role: UserRole; officerPosition?: OfficerPosition | null }) =>
  a.role === 'SUPER_ADMIN' || a.officerPosition === 'VICE_PRESIDENT';

/** Can `handler` act on a reset request from `target`? */
export function canHandle(handler: Actor, target: { id: string; role: UserRole }): boolean {
  if (handler.id === target.id) return false;
  if (isSuperAdminEquivalent(handler)) return true;
  return handler.role === 'OFFICER_ADMIN' && handler.officerPosition === 'SECRETARY' && target.role === 'MEMBER';
}

/** Everyone who may handle a request from this account. */
async function handlersFor(target: { id: string; role: UserRole }): Promise<string[]> {
  const candidates = await prisma.user.findMany({
    where: { isDeveloper: false, OR: [{ role: 'SUPER_ADMIN' }, { officerPosition: { in: ['VICE_PRESIDENT', 'SECRETARY'] } }] },
    select: { id: true, role: true, officerPosition: true },
  });
  return candidates.filter((c) => canHandle(c, target)).map((c) => c.id);
}

/**
 * Records that this account's owner asked for help. Called detached (the public response is identical
 * whether or not the email has an account, and doesn't wait for this), so it never throws.
 */
export async function recordResetRequest(email: string, studentId: string): Promise<void> {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      select: {
        id: true,
        role: true,
        isDeveloper: true,
        passwordResetRequestedAt: true,
        passwordResetIdMatched: true,
        memberProfile: { select: { studentIdHash: true } },
      },
    });
    // Nobody can be handed a link to the developer's account (it is reset with scripts/create-developer.ts).
    if (!user || user.isDeveloper) return;

    const onFile = user.memberProfile?.studentIdHash ?? null;
    const idMatched = onFile === null ? null : hashStudentId(studentId) === onFile;

    // An open request stands. The one exception: a request that checked out replaces one that didn't, so
    // someone who can't prove who they are can't sit on the queue and shut out the real owner.
    const open = user.passwordResetRequestedAt !== null && user.passwordResetRequestedAt > openSince();
    if (open && !(user.passwordResetIdMatched !== true && idMatched === true)) return;

    await prisma.user.update({ where: { id: user.id }, data: { passwordResetRequestedAt: new Date(), passwordResetIdMatched: idMatched } });
    // No name in the notification: push payloads pass through the browser vendor's servers.
    await notifyUsers(await handlersFor(user), {
      kind: 'membership',
      title: 'Password reset request',
      body: 'Someone is asking for help signing in. Review it under Members.',
      url: '/admin/members?tab=resets',
    });
  } catch (err) {
    logger.error('Recording a password-reset request failed', err);
  }
}

/** Open requests this officer may act on, oldest first. */
export async function listOpenRequests(handler: Actor) {
  const users = await prisma.user.findMany({
    where: { passwordResetRequestedAt: { gt: openSince() } },
    orderBy: { passwordResetRequestedAt: 'asc' },
    select: {
      id: true, name: true, email: true, role: true, officerPosition: true, collegeOrDept: true, yearLevel: true,
      passwordResetRequestedAt: true, passwordResetIdMatched: true,
    },
  });
  return users
    .filter((u) => canHandle(handler, u))
    .map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      collegeOrDept: u.collegeOrDept,
      yearLevel: u.yearLevel,
      // Shown so the officer knows what kind of account this is (an officer's reset is the Super Admin's call).
      isOfficer: u.role !== 'MEMBER',
      requestedAt: u.passwordResetRequestedAt,
      studentIdMatched: u.passwordResetIdMatched,
    }));
}

export class ResetRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function openRequestFor(handler: Actor, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, passwordResetRequestedAt: true, passwordResetIdMatched: true },
  });
  if (!user || !user.passwordResetRequestedAt || user.passwordResetRequestedAt <= openSince()) {
    throw new ResetRequestError('There is no open reset request for this account.', 404);
  }
  if (!canHandle(handler, user)) throw new ResetRequestError('This request is outside your role’s scope.', 403);
  return user;
}

/**
 * Issues the one-time link for an open request. When the student ID didn't match (or couldn't be
 * checked) the officer has to say they confirmed the person another way.
 */
export async function issueResetLink(handler: Actor, userId: string, identityConfirmed: boolean) {
  const user = await openRequestFor(handler, userId);
  if (user.passwordResetIdMatched !== true && !identityConfirmed) {
    throw new ResetRequestError('The student ID didn’t match, or couldn’t be checked. Confirm who this is another way, then tick the box to continue.', 409);
  }
  const rawToken = await createPasswordResetToken(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { passwordResetRequestedAt: null, passwordResetIdMatched: null } });
  await logAction(handler.id, 'account.resetLink.create', 'User', user.id, { studentIdMatched: user.passwordResetIdMatched, confirmedAnotherWay: identityConfirmed });
  return { url: `${env.frontendOrigin}/reset-password?token=${rawToken}`, expiresInMinutes: RESET_TOKEN_TTL_MS / 60_000 };
}

export async function dismissRequest(handler: Actor, userId: string) {
  const user = await openRequestFor(handler, userId);
  await prisma.user.update({ where: { id: user.id }, data: { passwordResetRequestedAt: null, passwordResetIdMatched: null } });
  await logAction(handler.id, 'account.resetRequest.dismiss', 'User', user.id);
}
