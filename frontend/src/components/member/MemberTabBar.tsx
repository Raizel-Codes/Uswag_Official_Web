import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { NavItem } from '@/config/navigation';

/** Tiny padlock, shown on destinations a pending / expired / rejected member can't use yet. */
export function LockGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

const MAX_TABS = 5;

/**
 * Mobile tab bar: up to five destinations, the one marked `centre` raised as a seal (like a
 * social app's create button). A "More" tab and sheet appear only when a role has more than
 * five destinations — members currently have exactly five, so it isn't shown.
 */
export default function MemberTabBar({ className = '', items, locked }: { className?: string; items: NavItem[]; locked: boolean }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const overflow = items.length > MAX_TABS;
  const visible = overflow ? items.slice(0, MAX_TABS - 1) : items;
  const extra = overflow ? items.slice(MAX_TABS - 1) : [];
  const extraActive = extra.some((i) => location.pathname.startsWith(i.href));

  useEffect(() => setMoreOpen(false), [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  function renderTab(item: NavItem) {
    const Icon = item.icon;
    const isLocked = locked && item.activeOnly;
    const pip = isLocked && (
      <span className="mp-tab__pip">
        <LockGlyph />
      </span>
    );
    return (
      <NavLink
        key={item.href}
        to={item.href}
        end={item.href === '/dashboard'}
        className={`mp-tab ${item.centre ? 'mp-tab--centre' : ''}`}
      >
        {item.centre ? (
          <span className="mp-tab__seal">
            <Icon aria-hidden="true" />
          </span>
        ) : (
          <Icon aria-hidden="true" />
        )}
        {pip}
        <span>
          {item.name}
          {isLocked && <span className="mp-sr-only"> (locked until your membership is active)</span>}
        </span>
      </NavLink>
    );
  }

  return (
    <>
      <nav aria-label="Member" className={`mp-tabbar ${className}`} style={{ ['--mp-tab-count' as string]: visible.length + (overflow ? 1 : 0) }}>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
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
          <div id="mp-more" className="mp-sheet mp-vault mp-on-dark" role="dialog" aria-label="More destinations">
            <p className="mp-eyebrow mb-3" style={{ color: 'var(--color-sage)' }}>More</p>
            <div className="grid grid-cols-3 gap-2">
              {extra.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.href} to={item.href} className="mp-rail__link flex-col !gap-2 !py-4 text-center">
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
