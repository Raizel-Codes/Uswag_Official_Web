import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getNavItems, type NavItem } from '@/config/navigation';
import { isSuperAdminEquivalent } from '@/utils/roles';
import PortalShell from '@/components/portal/PortalShell';
import { positionLabel } from './positions';
import '@/styles/member.css';
import '@/styles/admin.css';

// Admin console shell — Officer Admins (mobile-first: four tabs, Scan raised in the centre)
// and the Super Admin / VP (desktop-first: a sectioned rail; on phones the extra
// destinations go in "More"). The Auditor keeps the Scan tab, shown locked: Article VI gives
// the Auditor oversight of attendance, not live scanning (ScanConsolePage explains why and
// links to the read-only records). Route guards and the server still enforce every scope.
export default function AdminLayout() {
  const { user } = useAuth();
  if (!user) return null;

  const isLocked = (item: NavItem) => item.lock === 'auditor' && user.officerPosition === 'auditor';
  const superAdmin = isSuperAdminEquivalent(user);

  return (
    <PortalShell
      navStyle={user.navStyle}
      items={getNavItems(user)}
      isLocked={isLocked}
      lockReason="not part of the Auditor's scope"
      railLabel={superAdmin ? 'Admin console' : 'Officer console'}
      name={user.name}
      subtitle={positionLabel(user.officerPosition)}
    >
      <Outlet />
    </PortalShell>
  );
}
