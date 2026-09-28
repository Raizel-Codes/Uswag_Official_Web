import type { Request, Response, NextFunction } from 'express';
import type { UserRole, OfficerPosition } from '@prisma/client';
import { fail } from '../utils/response.js';

// The Vice President is Super-Admin-equivalent: per claude.md's RBAC table
// (President "+ delegated VP" both sit in the Super Admin row) and explicit
// product direction, the VP must be able to continue every day-to-day
// officer/admin operation during the President's absence — not a read-only
// oversight slice. This is the single place that equivalence is defined;
// every role/position check in this file goes through it.
function isSuperAdminEquivalent(user: { role: UserRole; officerPosition?: OfficerPosition | null }) {
  return user.role === 'SUPER_ADMIN' || user.officerPosition === 'VICE_PRESIDENT';
}

// Coarse role gate. Use requireOfficerPosition() alongside this for the
// finer Article VI scope checks (e.g. only Secretary can approve members).
//
// IMPORTANT: this must run on every route touching a scoped resource,
// regardless of what the frontend hides. See claude.md "Roles & permissions" —
// the frontend RoleRoute component is a UX nicety, not a security boundary.
export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return fail(res, 'Not authenticated', 401);
    if (allowed.includes('SUPER_ADMIN') && isSuperAdminEquivalent(req.user)) return next();
    if (!allowed.includes(req.user.role)) {
      return fail(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
}

// Fine-grained officer scope check, per the ROLES table in
// prototype/officer-admin.html and claude.md. Super Admin (and the VP, who
// is Super-Admin-equivalent) always passes.
export function requireOfficerPosition(...allowed: OfficerPosition[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return fail(res, 'Not authenticated', 401);
    if (isSuperAdminEquivalent(req.user)) return next();
    if (req.user.role === 'OFFICER_ADMIN' && req.user.officerPosition && allowed.includes(req.user.officerPosition)) {
      return next();
    }
    return fail(res, 'This action is outside your officer role\'s scope', 403);
  };
}
