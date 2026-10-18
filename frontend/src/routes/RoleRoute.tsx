import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth.types';
import { isSuperAdminEquivalent } from '@/utils/roles';

interface RoleRouteProps {
  allow: UserRole[];
}

// Frontend gate only. The backend must independently enforce the same
// (and finer-grained officer-position) checks — see claude.md
// "Roles & permissions". Never treat this as the security boundary.
export default function RoleRoute({ allow }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  // Wait for localStorage rehydration before redirecting
  if (isLoading) return null;

  // Vice President is Super-Admin-equivalent (see utils/roles.ts) — any
  // route that allows 'super_admin' must also admit the VP.
  const passes = !!user && (allow.includes(user.role) || (allow.includes('super_admin') && isSuperAdminEquivalent(user)));

  if (!passes) return <Navigate to="/" replace />;
  if (user?.mustChangePassword) return <Navigate to="/account/password" replace />;
  return <Outlet />;
}
