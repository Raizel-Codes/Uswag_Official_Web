import type { ReactNode } from 'react';
import type { NavItem } from '@/config/navigation';
import PortalRail from './PortalRail';
import PortalTabBar from './PortalTabBar';

/**
 * The frame shared by the member portal and the admin console: skip link, desktop rail,
 * phone tab bar, main region. Honors the saved navStyle preference: auto = rail from md up
 * and tab bar below; 'sidebar' / 'bottom' = always that one.
 */
export default function PortalShell({
  navStyle,
  items,
  isLocked,
  lockReason,
  railLabel,
  name,
  subtitle,
  children,
}: {
  navStyle?: string;
  items: NavItem[];
  isLocked: (item: NavItem) => boolean;
  lockReason: string;
  railLabel: string;
  name: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  const style = navStyle || 'auto';
  const railCls = style === 'sidebar' ? 'flex' : style === 'bottom' ? 'hidden' : 'hidden md:flex';
  const tabCls = style === 'bottom' ? '' : style === 'sidebar' ? 'hidden' : 'md:hidden';
  const modeCls = style === 'sidebar' ? 'mp--sidebar' : style === 'bottom' ? 'mp--tabbar' : '';

  return (
    <div className={`mp flex ${modeCls}`}>
      <a
        href="#mp-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-3 focus:rounded-[3px] focus:bg-forest focus:text-mist focus:font-semibold"
      >
        Skip to content
      </a>
      {/* Visibility lives on wrappers: .mp-rail / .mp-tabbar set their own display, which
          would otherwise beat Tailwind's hidden / md:flex (portal CSS loads after it). */}
      <div className={`${railCls} shrink-0`}>
        <PortalRail label={railLabel} items={items} isLocked={isLocked} lockReason={lockReason} name={name} subtitle={subtitle} />
      </div>
      <main id="mp-main" tabIndex={-1} className="flex-1 min-w-0 focus:outline-none">
        {children}
      </main>
      <div className={tabCls}>
        <PortalTabBar items={items} isLocked={isLocked} lockReason={lockReason} />
      </div>
    </div>
  );
}
