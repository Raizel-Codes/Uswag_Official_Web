import type { AuthUser } from '@/types/auth.types';

// The Vice President is Super-Admin-equivalent: per claude.md's RBAC table
// (President "+ delegated VP" both sit in the Super Admin row) and explicit
// product direction, the VP must be able to continue every day-to-day
// officer/admin operation during the President's absence — not a read-only
// oversight slice. This mirrors isSuperAdminEquivalent() in the backend's
// role.middleware.ts; every super-admin-only UI branch in the frontend
// should check this instead of `user?.role === 'super_admin'` directly.
export function isSuperAdminEquivalent(user: Pick<AuthUser, 'role' | 'officerPosition'> | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || user.officerPosition === 'vice_president';
}
