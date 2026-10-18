import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { encryptStudentId, hashStudentId } from '../utils/crypto.js';
import { logAction } from './audit.service.js';
import { hashPassword } from './auth.service.js';
import { OfficerError, assertCollegeHasNoOtherPro } from './officer.service.js';

/** A reason the person can act on; the controller passes `status` straight to fail(). */
export class ProfileError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const DUPLICATE_ID = 'Someone already has an account with this student ID. If it is yours, contact the Secretary.';

async function loadWithPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ProfileError('That account no longer exists.', 404);
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new ProfileError('That password isn’t right.', 422); // not 401/403: the client treats those as an expired session / a scope wall
  return user;
}

/** Name, college/department and year level: the details people typed wrong, or that change. */
export async function updateDetails(userId: string, input: { name: string; collegeOrDept: string; yearLevel?: string | null }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ProfileError('That account no longer exists.', 404);

  // A PRO sits in the seat of their college (Article VI §1g); moving to a college whose seat is taken is refused.
  if (user.officerPosition === 'PRO' && input.collegeOrDept !== user.collegeOrDept) {
    try {
      await assertCollegeHasNoOtherPro(userId, input.collegeOrDept);
    } catch (err) {
      if (err instanceof OfficerError) throw new ProfileError(err.message, err.status);
      throw err;
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name, collegeOrDept: input.collegeOrDept, yearLevel: input.yearLevel ?? null },
  });
}

/**
 * Changes the signed-in person's password after checking the current one. Every other session is
 * signed out (tokenVersion bump); the caller returns a fresh session so this device stays in.
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await loadWithPassword(userId, currentPassword);
  if (currentPassword === newPassword) throw new ProfileError('Choose a password different from the current one.', 422);
  return prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), awaitingPasswordSetup: false, mustChangePassword: false, tokenVersion: { increment: 1 } },
  });
}

/**
 * Lets a member (officers included: they hold a membership too) correct their own student ID, after
 * confirming their password. The ID itself is never stored readable: only its keyed fingerprint,
 * which is what stops a second account using the same ID. A still-pending application also keeps the
 * temporary encrypted copy the Secretary checks, so that is updated too, or the Secretary would
 * compare against the old typo.
 */
export async function changeStudentId(userId: string, password: string, studentId: string) {
  await loadWithPassword(userId, password);
  const profile = await prisma.memberProfile.findUnique({ where: { userId } });
  if (!profile) throw new ProfileError('This account has no membership record, so there is no student ID to change.', 404);

  const studentIdHash = hashStudentId(studentId);
  if (studentIdHash === profile.studentIdHash) return { changed: false };

  const clash = await prisma.memberProfile.findUnique({ where: { studentIdHash }, select: { id: true } });
  if (clash && clash.id !== profile.id) throw new ProfileError(DUPLICATE_ID, 409);

  try {
    await prisma.memberProfile.update({
      where: { id: profile.id },
      data: { studentIdHash, ...(profile.studentIdCiphertext !== null ? { studentIdCiphertext: encryptStudentId(studentId) } : {}) },
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') throw new ProfileError(DUPLICATE_ID, 409);
    throw err;
  }
  // The ID itself never goes in the log.
  await logAction(userId, 'account.studentId.change', 'MemberProfile', profile.id, { hadIdOnFile: profile.studentIdHash !== null });
  return { changed: true };
}
