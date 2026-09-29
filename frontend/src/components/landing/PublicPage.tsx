import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useEraScroll } from '@/hooks/useEraScroll';
import { ScrollTrigger, ensureGsapRegistered } from '@/lib/motion';
import { LandingEraContext } from '@/context/LandingEraContext';
import ChapterNav from './ChapterNav';
import '@/styles/landing.css';

ensureGsapRegistered();

interface PublicPageProps {
  children: ReactNode;
  /** Selector where the parchment starts giving way to Mist. */
  eraStart?: string;
  /** Selector where the present has fully arrived. */
  eraEnd?: string;
  /** Values whose change alters page height (async data) — triggers a ScrollTrigger re-measure. */
  refreshKeys?: unknown[];
  /** Hide the prev/next chapter links. */
  hideChapterNav?: boolean;
  /** Rendered after the chapter links (e.g. the front page's mobile sticky bar + spacer). */
  after?: ReactNode;
  /** A single fixed era for utility pages (Login): no parchment → Mist journey. */
  surface?: 'journey' | 'present';
}

/**
 * Shell for every page of the public "Record": the `.lp` scope (so landing.css applies and
 * cannot leak), the parchment → Mist era scrub, scroll-to-top on arrival, and the chapter
 * links that stitch each page to the next. Pages mark their own era boundaries with
 * `data-lp-era-start` / `data-lp-era-end` unless they pass explicit selectors.
 */
export default function PublicPage({
  children,
  eraStart = '[data-lp-era-start]',
  eraEnd = '[data-lp-era-end]',
  refreshKeys = [],
  hideChapterNav = false,
  after,
  surface = 'journey',
}: PublicPageProps) {
  const root = useRef<HTMLDivElement>(null);
  const era = useEraScroll(root, { startSelector: eraStart, endSelector: eraEnd });

  // Arriving on a new page of the record starts at its masthead, not mid-scroll from the
  // previous page (react-router keeps the old scroll position otherwise).
  useLayoutEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const timeout = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refreshKeys);

  return (
    <LandingEraContext.Provider value={era}>
      <div ref={root} className={`lp ${surface === 'present' ? 'lp--present' : ''}`}>
        {children}
        {!hideChapterNav && <ChapterNav />}
        {after}
      </div>
    </LandingEraContext.Provider>
  );
}
