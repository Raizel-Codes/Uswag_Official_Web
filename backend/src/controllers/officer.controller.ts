import type { Request, Response } from 'express';
import type { OfficerPosition } from '@prisma/client';
import { prisma } from '../config/db.js';
import { logAction } from '../services/audit.service.js';
import { OFFICER_POSITIONS, OfficerError, assertActiveMembers, assertCollegeHasNoOtherPro, installTerm, listNominees, roleForPosition } from '../services/officer.service.js';
import { buildOfficerQrValue } from '../services/qr.service.js';
import { ok, fail } from '../utils/response.js';

// Only what the console shows. Never the full User row: it carries the password hash, the
// reset-token hash and the session version.
const OFFICER_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  officerPosition: true,
  collegeOrDept: true,
  createdAt: true,
  awaitingPasswordSetup: true, // the Super Admin still has to hand them a setup link
} as const;

// Turns a rule the Super Admin can fix (not an active member, duplicate position…) into a 4xx
// with its message; anything else is a real error and falls through to the error handler.
function failOfficer(res: Response, err: unknown) {
  if (err instanceof OfficerError) return fail(res, err.message, err.status);
  throw err;
}

// SUPER ADMIN ONLY — see role.middleware.ts requireRole('SUPER_ADMIN')
// applied in officer.routes.ts.
export async function listOfficers(_req: Request, res: Response) {
  const officers = await prisma.user.findMany({
    // The developer's account is a Super Admin in role only: it is never an officer, so it isn't listed.
    where: { role: { in: ['OFFICER_ADMIN', 'SUPER_ADMIN'] }, isDeveloper: false },
    select: OFFICER_FIELDS,
  });
  return ok(res, officers);
}

export async function assignOfficer(req: Request, res: Response) {
  const { userId, officerPosition } = req.body;
  if (!OFFICER_POSITIONS.includes(officerPosition)) {
    return fail(res, 'Choose one of the officer positions in Article VI.', 400);
  }
  const user = await prisma.user.findUnique({ where: { id: String(userId ?? '') } });
  if (!user) return fail(res, 'That account no longer exists.', 404);

  try {
    await assertActiveMembers([user.id]);
    if (officerPosition === 'PRO') await assertCollegeHasNoOtherPro(user.id, user.collegeOrDept);
  } catch (err) {
    return failOfficer(res, err);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: roleForPosition(officerPosition as OfficerPosition), officerPosition },
    select: OFFICER_FIELDS,
  });
  await logAction(req.user!.id, 'officer.assign', 'User', user.id, { officerPosition, previous: user.officerPosition });
  return ok(res, updated);
}

// Active members who can be put in office — the only people the term form offers.
export async function listNomineesHandler(_req: Request, res: Response) {
  return ok(res, await listNominees());
}

// Installs an elected batch for a new term (see officer.service.ts installTerm).
export async function installOfficerTerm(req: Request, res: Response) {
  try {
    return ok(res, await installTerm(req.user!.id, req.body.assignments, req.body.mode));
  } catch (err) {
    return failOfficer(res, err);
  }
}

// Any officer (Officer Admin or Super Admin) — their own signed identity QR, for meetings and
// forums they conduct. Self-scoped from the JWT, same as GET /members/me/qr. Not tied to a
// UswagEvent: scanning it verifies "this is officer X, position Y" and logs to the audit
// trail (see scan.controller.ts), it does not create an AttendanceRecord.
export async function getMyOfficerQr(req: Request, res: Response) {
  return ok(res, { qrValue: buildOfficerQrValue(req.user!.id) });
}

// PUBLIC READ — for landing pages and public officer roster
export async function listPublicOfficers(_req: Request, res: Response) {
  const officers = await prisma.user.findMany({
    where: { role: { in: ['OFFICER_ADMIN', 'SUPER_ADMIN'] }, isDeveloper: false },
    select: {
      id: true,
      name: true,
      officerPosition: true,
      collegeOrDept: true,
    },
  });
  return ok(res, officers);
}
