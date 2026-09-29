import { lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';

// One route element for every signed-in area. Members get the member portal; officers and the
// Super Admin get the admin console. Both shells (and their CSS) are lazy chunks. The
// /dashboard/profile route is shared, so it's dispatched by role too.
const MemberLayout = lazy(() => import('@/components/member/MemberLayout'));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const MemberProfilePage = lazy(() => import('@/pages/member/MemberProfilePage'));
const OfficerProfilePage = lazy(() => import('@/pages/admin/OfficerProfilePage'));

export default function PortalLayout() {
  const { user } = useAuth();
  return user?.role === 'member' ? <MemberLayout /> : <AdminLayout />;
}

export function PortalProfilePage() {
  const { user } = useAuth();
  return user?.role === 'member' ? <MemberProfilePage /> : <OfficerProfilePage />;
}
