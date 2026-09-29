import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyProfile } from '@/hooks/useMyProfile';
import { getNavItems, type NavItem } from '@/config/navigation';
import PortalShell from '@/components/portal/PortalShell';
import { STANDING_LABEL, isActive } from './standing';
import '@/styles/member.css';

// Member portal shell (members only — officers and the Super Admin get AdminLayout; see
// routes/PortalLayout.tsx). Card and Events show a lock until the membership is ACTIVE.
export default function MemberLayout() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  if (!user) return null;

  // Locks only once the standing is known, so an active member never sees them flash.
  const inactive = profile ? !isActive(profile.status) : false;
  const isLocked = (item: NavItem) => item.lock === 'inactiveMember' && inactive;

  return (
    <PortalShell
      navStyle={user.navStyle}
      items={getNavItems(user)}
      isLocked={isLocked}
      lockReason="locked until your membership is active"
      railLabel="Member portal"
      name={user.name}
      subtitle={profile ? STANDING_LABEL[profile.status] : user.collegeOrDept}
    >
      <Outlet />
    </PortalShell>
  );
}
