import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyProfile } from '@/hooks/useMyProfile';
import { getNavItems } from '@/config/navigation';
import { isActive } from './standing';
import MemberRail from './MemberRail';
import MemberTabBar from './MemberTabBar';
import '@/styles/member.css';

// Member portal shell (members only — officers and the Super Admin keep DashboardLayout;
// see routes/PortalLayout.tsx). Honors the saved navStyle preference exactly as
// DashboardLayout does: auto = rail from md up, tab bar below; or always one of them.
export default function MemberLayout() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  if (!user) return null;

  const items = getNavItems(user);
  // Locks only once the standing is known, so an active member never sees them flash.
  const locked = profile ? !isActive(profile.status) : false;
  const navStyle = user.navStyle || 'auto';

  const railCls = navStyle === 'sidebar' ? 'flex' : navStyle === 'bottom' ? 'hidden' : 'hidden md:flex';
  const tabCls = navStyle === 'bottom' ? '' : navStyle === 'sidebar' ? 'hidden' : 'md:hidden';
  const modeCls = navStyle === 'sidebar' ? 'mp--sidebar' : navStyle === 'bottom' ? 'mp--tabbar' : '';

  return (
    <div className={`mp flex ${modeCls}`}>
      <a
        href="#mp-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-3 focus:rounded-[3px] focus:bg-forest focus:text-mist focus:font-semibold"
      >
        Skip to content
      </a>
      {/* Visibility lives on wrappers: .mp-rail / .mp-tabbar set their own display, which
          would otherwise beat Tailwind's hidden / md:flex (member.css loads after it). */}
      <div className={`${railCls} shrink-0`}>
        <MemberRail items={items} locked={locked} user={user} profile={profile} />
      </div>
      <main id="mp-main" tabIndex={-1} className="flex-1 min-w-0 focus:outline-none">
        <Outlet />
      </main>
      <div className={tabCls}>
        <MemberTabBar items={items} locked={locked} />
      </div>
    </div>
  );
}
