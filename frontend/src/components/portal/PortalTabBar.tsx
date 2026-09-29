import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { NavItem } from '@/config/navigation';
import LockGlyph from './LockGlyph';

const MAX_TABS = 5;

/**
 * Phone tab bar for every portal (member, officer, Super Admin). Up to five destinations; the
 * one marked `centre` is raised as a seal. A "More" tab and sheet appear only when there are
 * more than five — the Super Admin's extra destinations live there instead of being hidden.
 */
export default function PortalTabBar({
  items,
  isLocked,
  lockReason,
}: {
  items: NavItem[];
  isLocked: (item: NavItem) => boolean;
  /** Screen-reader text appended to a locked tab. */
  lockReason: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const overflow = items.length > MAX_TABS;
  const visible = overflow ? items.slice(0, MAX_TABS - 1) : items;
  const extra = overflow ? items.slice(MAX_TABS - 1) : [];
  const extraActive = extra.some((i) => location.pathname === i.href || location.pathname.startsWith(`${i.href}/`));

  useEffect(() => setMoreOpen(false), [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  function renderTab(item: NavItem) {
    const Icon = item.icon;
    const locked = isLocked(item);
    return (
      <NavLink key={item.href} to={item.href} end={item.href === '/dashboard' || item.href === '/admin'} className={`mp-tab ${item.centre ? 'mp-tab--centre' : ''}`}>
        {item.centre ? (
          <span className="mp-tab__seal">
            <Icon aria-hidden="true" />
          </span>
        ) : (
          <Icon aria-hidden="true" />
        )}
        {locked && (
          <span className="mp-tab__pip">
            <LockGlyph />
          </span>
        )}
        <span>
          {item.name}
          {locked && <span className="mp-sr-only"> ({lockReason})</span>}
        </span>
      </NavLink>
    );
  }

  return (
    <>
      <nav aria-label="Main" className="mp-tabbar" style={{ ['--mp-tab-count' as string]: visible.length + (overflow ? 1 : 0) }}>
        {visible.map(renderTab)}
        {overflow && (
          <button
            type="button"
            className="mp-tab"
            aria-expanded={moreOpen}
            aria-controls="mp-more"
            aria-current={extraActive ? 'page' : undefined}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="5" cy="12" r="1.2" />
              <circle cx="12" cy="12" r="1.2" />
              <circle cx="19" cy="12" r="1.2" />
            </svg>
            <span>More</span>
          </button>
        )}
      </nav>

      {overflow && moreOpen && (
        <>
          <div className="mp-sheet-backdrop" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div id="mp-more" className="mp-sheet mp-vault mp-on-dark uw-scroll" role="dialog" aria-label="More destinations">
            <p className="mp-eyebrow mb-3" style={{ color: 'var(--color-sage)' }}>More</p>
            <div className="grid grid-cols-3 gap-2">
              {extra.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.href} to={item.href} className="mp-rail__link flex-col !gap-2 !py-4 text-center !tracking-[0.06em]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
