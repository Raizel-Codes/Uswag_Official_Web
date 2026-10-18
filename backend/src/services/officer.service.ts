import type { OfficerPosition, UserRole } from '@prisma/client';
import { prisma } from '../config/db.js';
import { logAction } from './audit.service.js';

// Article VI positions. The President is the Super Admin; every other position (including the
// VP, who is Super-Admin-equivalent through officerPosition — see role.middleware.ts) is an
// Officer Admin.
export const OFFICER_POSITIONS: OfficerPosition[] = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR', 'BUSINESS_MANAGER', 'PRO'];

export const roleForPosition = (position: OfficerPosition): UserRole => (position === 'PRESIDENT' ? 'SUPER_ADMIN' : 'OFFICER_ADMIN');

/** A reason the Super Admin can act on; the controller passes `status` straight to fail(). */
export class OfficerError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

// An officer must already be a member in good standing (Article III: application, membership fee,
// orientation, then Secretary approval). This is the rule that stops an officer account from being
// a back door around the membership process, so it is checked on the server for every assignment.
const activeMember = () => {
  const now = new Date();
  return { memberProfile: { is: { status: 'ACTIVE' as const, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } } };
};

/** Members who may be put in office. Includes sitting officers who are still active members (re-election). */
export function listNominees() {
  return prisma.user.findMany({
    where: activeMember(),
    select: { id: true, name: true, email: true, collegeOrDept: true, yearLevel: true, officerPosition: true },
    orderBy: { name: 'asc' },
  });
}

/** Throws unless every user is an active member; names who is not so the fix is obvious. */
export async function assertActiveMembers(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, memberProfile: { select: { status: true, expiresAt: true } } },
  });
  if (users.length !== new Set(userIds).size) throw new OfficerError('One of the chosen accounts no longer exists.', 404);

  const now = new Date();
  const blocked = users.filter((u) => {
    const p = u.memberProfile;
    return !p || p.status !== 'ACTIVE' || (p.expiresAt !== null && p.expiresAt <= now);
  });
  if (blocked.length > 0) {
    throw new OfficerError(
      `${blocked.map((u) => u.name).join(', ')} ${blocked.length === 1 ? 'is' : 'are'} not an active member. An officer must first apply, pay the membership fee, attend orientation and be approved by the Secretary (Article III).`,
      422,
    );
  }
}

/**
 * Article VI §1(g): one Public Relations Officer per college/department. Throws if a different
 * account already holds the PRO seat for `college`. (Every other position has one seat in all.)
 */
export async function assertCollegeHasNoOtherPro(userId: string, college: string) {
  const other = await prisma.user.findFirst({
    where: { officerPosition: 'PRO', collegeOrDept: college, id: { not: userId } },
    select: { name: true },
  });
  if (other) throw new OfficerError(`${other.name} is already the PRO for ${college}. Each college has one Public Relations Officer (Article VI §1g).`, 409);
}

interface Assignment {
  userId: string;
  officerPosition: OfficerPosition;
}

/**
 * Installs an elected batch for a new term. Officers are never created here: every nominee is an
 * existing active member. Anyone holding office who is not in the batch steps down to a plain
 * member. Nothing is deleted, so the outgoing officer keeps their membership and history.
 */
export async function installTerm(actorId: string, assignments: Assignment[]) {
  const positions = assignments.map((a) => a.officerPosition);
  const userIds = assignments.map((a) => a.userId);
  // Every position has one seat except PRO, which has one per college (checked below).
  const singleSeats = positions.filter((p) => p !== 'PRO');
  if (new Set(singleSeats).size !== singleSeats.length) throw new OfficerError('Each position can have only one officer.', 422);
  if (new Set(userIds).size !== userIds.length) throw new OfficerError('A member can hold only one position at a time.', 422);
  // Without a President there would be no Super Admin left to run the console.
  if (!positions.includes('PRESIDENT')) throw new OfficerError('A term needs a President — the President runs the Super Admin console.', 422);

  await assertActiveMembers(userIds);

  const proIds = assignments.filter((a) => a.officerPosition === 'PRO').map((a) => a.userId);
  if (proIds.length > 0) {
    const pros = await prisma.user.findMany({ where: { id: { in: proIds } }, select: { name: true, collegeOrDept: true } });
    const byCollege = new Map<string, string>();
    for (const p of pros) {
      const first = byCollege.get(p.collegeOrDept);
      if (first) throw new OfficerError(`${first} and ${p.name} are both PROs for ${p.collegeOrDept}. Each college has one Public Relations Officer (Article VI §1g).`, 422);
      byCollege.set(p.collegeOrDept, p.name);
    }
  }

  // The developer's account is a Super Admin in role only. A term never seats it and never steps it down.
  const sitting = await prisma.user.findMany({
    where: { role: { in: ['OFFICER_ADMIN', 'SUPER_ADMIN'] }, isDeveloper: false },
    select: { id: true, name: true, role: true, officerPosition: true },
  });
  const sittingById = new Map(sitting.map((u) => [u.id, u]));
  const outgoing = sitting.filter((u) => !userIds.includes(u.id));

  // Bump tokenVersion whenever someone's console changes, so a refresh token issued under the old
  // role can't be used to stay in it. (An already-issued access token lives out its short TTL.)
  const roleChange = { tokenVersion: { increment: 1 } };
  await prisma.$transaction([
    ...outgoing.map((u) => prisma.user.update({ where: { id: u.id }, data: { role: 'MEMBER', officerPosition: null, ...roleChange } })),
    ...assignments.map((a) => {
      const before = sittingById.get(a.userId);
      const changed = before?.officerPosition !== a.officerPosition || before?.role !== roleForPosition(a.officerPosition);
      return prisma.user.update({
        where: { id: a.userId },
        data: { role: roleForPosition(a.officerPosition), officerPosition: a.officerPosition, ...(changed ? roleChange : {}) },
      });
    }),
  ]);

  const names = new Map((await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const installed = assignments.map((a) => ({ userId: a.userId, name: names.get(a.userId) ?? '', officerPosition: a.officerPosition }));
  const steppedDown = outgoing.map((u) => ({ userId: u.id, name: u.name, previous: u.officerPosition }));
  await logAction(actorId, 'officer.term.install', 'OfficerTerm', undefined, { installed, steppedDown });

  return { installed, steppedDown };
}
