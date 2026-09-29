import { lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';

// The /dashboard routes are shared: members use them as their portal, and officers reach
// /dashboard/profile from their own nav. Members get the redesigned member portal (its CSS
// ships in this lazy chunk only); everyone else keeps DashboardLayout and the existing pages.
const MemberLayout = lazy(() => import('@/components/member/MemberLayout'));
const MemberProfilePage = lazy(() => import('@/pages/member/MemberProfilePage'));
const ProfilePage = lazy(() => import('@/pages/member/ProfilePage'));

export default function PortalLayout() {
  const { user } = useAuth();
  return user?.role === 'member' ? <MemberLayout /> : <DashboardLayout />;
}

export function PortalProfilePage() {
  const { user } = useAuth();
  return user?.role === 'member' ? <MemberProfilePage /> : <ProfilePage />;
}
