import type { Request, Response } from 'express';
import type { OfficerPosition } from '@prisma/client';
import { prisma } from '../config/db.js';
import { logAction } from '../services/audit.service.js';
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
} as const;

// Article VI positions. The President is the Super Admin; every other position (including the
// VP, who is Super-Admin-equivalent through officerPosition — see role.middleware.ts) is an
// Officer Admin.
const POSITIONS: OfficerPosition[] = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR', 'BUSINESS_MANAGER', 'PRO'];

// SUPER ADMIN ONLY — see role.middleware.ts requireRole('SUPER_ADMIN')
// applied in officer.routes.ts.
export async function listOfficers(_req: Request, res: Response) {
  const officers = await prisma.user.findMany({
    where: { role: { in: ['OFFICER_ADMIN', 'SUPER_ADMIN'] } },
    select: OFFICER_FIELDS,
  });
  return ok(res, officers);
}

export async function assignOfficer(req: Request, res: Response) {
  const { userId, officerPosition } = req.body;
  if (!POSITIONS.includes(officerPosition)) {
    return fail(res, 'Choose one of the officer positions in Article VI.', 400);
  }
  const user = await prisma.user.findUnique({ where: { id: String(userId ?? '') } });
  if (!user) return fail(res, 'That account no longer exists.', 404);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: officerPosition === 'PRESIDENT' ? 'SUPER_ADMIN' : 'OFFICER_ADMIN', officerPosition },
    select: OFFICER_FIELDS,
  });
  await logAction(req.user!.id, 'officer.assign', 'User', user.id, { officerPosition, previous: user.officerPosition });
  return ok(res, updated);
}

// PUBLIC READ — for landing pages and public officer roster
export async function listPublicOfficers(_req: Request, res: Response) {
  const officers = await prisma.user.findMany({
    where: { role: { in: ['OFFICER_ADMIN', 'SUPER_ADMIN'] } },
    select: {
      id: true,
      name: true,
      officerPosition: true,
      collegeOrDept: true,
    },
  });
  return ok(res, officers);
}
