import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import type { NavItem } from '@/config/navigation';
import LockGlyph from './LockGlyph';

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

/**
 * Desktop navigation for every portal: a Deep Forest "vault" column, small-caps destinations
 * (grouped under section headings when items carry `section`), and the signed-in person's
 * plate at the foot.
 */
export default function PortalRail({
  label,
  items,
  isLocked,
  lockReason,
  name,
  subtitle,
}: {
  label: string;
  items: NavItem[];
  isLocked: (item: NavItem) => boolean;
  lockReason: string;
  name: string;
  subtitle: ReactNode;
}) {
  const groups: { section?: string; items: NavItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }

  return (
    <aside className="mp-rail mp-vault mp-on-dark" aria-label={label}>
      <Logo variant="onDark" size={34} wordmarkFont="heading" />
      <p className="mp-eyebrow mt-3" style={{ color: 'var(--color-sage)' }}>{label}</p>

      <nav aria-label="Main" className="mt-8 flex flex-col gap-5 min-h-0 overflow-y-auto overscroll-contain uw-scroll -mx-1 px-1">
        {groups.map((g, gi) => (
          <div key={g.section ?? gi} className="flex flex-col gap-1">
            {g.section && <p className="mp-rail__section">{g.section}</p>}
            {g.items.map((item) => {
              const Icon = item.icon;
              const locked = isLocked(item);
              return (
                <NavLink key={item.href} to={item.href} end={item.href === '/dashboard' || item.href === '/admin'} className="mp-rail__link">
                  <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                  {item.name}
                  {locked && (
                    <>
                      <LockGlyph className="mp-rail__lock w-3.5 h-3.5" />
                      <span className="mp-sr-only"> ({lockReason})</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-[rgb(152_203_176/0.25)] flex items-center gap-3">
        <span className="mp-seal w-10 h-10 font-heading text-[0.875rem] font-semibold" aria-hidden="true">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <p className="text-[0.875rem] font-semibold text-mist truncate">{name}</p>
          <p className="text-[0.75rem] mp-muted truncate">{subtitle}</p>
        </div>
      </div>
    </aside>
  );
}
