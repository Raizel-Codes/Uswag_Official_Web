import { useMemo, useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion, EASE } from '@/lib/motion';

ensureGsapRegistered();

// Hex twins of --lp-parchment and --color-mist; GSAP needs concrete colors to interpolate.
const PARCHMENT = '#EFEADA';
const MIST = '#E7EFE4';

/** How long an explicit commit/release takes to carry the whole page across (seconds). */
const COMMIT_DURATION = 1.2;

interface UseEraScrollOptions {
  /** Section where the parchment starts giving way (scrub begins as its top enters the viewport). */
  startSelector: string;
  /** Section where the present fully arrives (scrub ends as its center reaches mid-viewport). */
  endSelector: string;
}

export interface EraControls {
  /** Carry the page fully into the present now, whatever the scroll position (the prequel ended). */
  commit: () => void;
  /** Hand the surface back to scroll position alone (the visitor scrolled back above the prequel). */
  release: () => void;
}

/**
 * The landing page's one signature effect: the page surface travels from archival parchment
 * to the brand Mist as the visitor scrolls from the origin story into the rebirth.
 *
 * Two inputs drive one era value (0 = past, 1 = present), and the page shows whichever is
 * further along: the scroll scrub, and an explicit commit — the prequel film ending carries
 * the page into the present before the visitor has scrolled there. Releasing the commit lets
 * the scrub take over again, so scrolling back up still returns the page to parchment.
 *
 * Tweens `background-color` on the page root directly — deliberately NOT a CSS custom
 * property, because an inherited variable changing every frame would force a style recalc
 * across the whole landing subtree. Nothing is pinned: a GSAP pin fought the fixed Header
 * in an earlier iteration (see git history of HomePage.tsx).
 *
 * Under prefers-reduced-motion nothing scrubs and commit/release do nothing; landing.css
 * gives each section its own static era surface instead.
 */
export function useEraScroll(root: RefObject<HTMLElement>, { startSelector, endSelector }: UseEraScrollOptions): EraControls {
  const era = useRef({ scroll: 0, committed: 0 });
  const paint = useRef<(() => void) | null>(null);
  const commitTween = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      // Pages without era markers (e.g. Login) have a fixed surface — nothing to scrub.
      if (!el.querySelector(startSelector) || !el.querySelector(endSelector)) return;

      const mix = gsap.utils.interpolate(PARCHMENT, MIST);
      const apply = () => gsap.set(el, { backgroundColor: mix(Math.max(era.current.scroll, era.current.committed)) });
      paint.current = apply;
      apply();

      gsap.fromTo(
        era.current,
        { scroll: 0 },
        {
          scroll: 1,
          ease: 'none',
          onUpdate: apply,
          scrollTrigger: {
            trigger: startSelector,
            start: 'top 75%',
            endTrigger: endSelector,
            end: 'center center',
            scrub: 0.6,
          },
        }
      );

      return () => {
        paint.current = null;
        commitTween.current?.kill();
        era.current.committed = 0;
      };
    },
    { scope: root, dependencies: [startSelector, endSelector], revertOnUpdate: true }
  );

  return useMemo(() => {
    const tweenTo = (committed: number) => {
      if (!paint.current) return;
      commitTween.current?.kill();
      commitTween.current = gsap.to(era.current, {
        committed,
        duration: COMMIT_DURATION,
        ease: EASE.smooth,
        onUpdate: () => paint.current?.(),
      });
    };
    return { commit: () => tweenTo(1), release: () => tweenTo(0) };
  }, []);
}
