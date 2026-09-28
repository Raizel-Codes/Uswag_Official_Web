import { type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/motion';

ensureGsapRegistered();

// Hex twins of --lp-parchment and --color-mist; GSAP needs concrete colors to interpolate.
const PARCHMENT = '#EFEADA';
const MIST = '#E7EFE4';

interface UseEraScrollOptions {
  /** Section where the parchment starts giving way (scrub begins as its top enters the viewport). */
  startSelector: string;
  /** Section where the present fully arrives (scrub ends as its center reaches mid-viewport). */
  endSelector: string;
}

/**
 * The landing page's one signature effect: the page surface travels from archival parchment
 * to the brand Mist as the visitor scrolls from the origin story into the rebirth.
 *
 * Tweens `background-color` on the page root directly — deliberately NOT a CSS custom
 * property, because an inherited variable changing every frame would force a style recalc
 * across the whole landing subtree. Nothing is pinned: a GSAP pin fought the fixed Header
 * in an earlier iteration (see git history of HomePage.tsx).
 *
 * Under prefers-reduced-motion nothing scrubs; landing.css gives each section its own
 * static era surface instead.
 */
export function useEraScroll(root: RefObject<HTMLElement>, { startSelector, endSelector }: UseEraScrollOptions) {
  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;

      gsap.fromTo(
        root.current,
        { backgroundColor: PARCHMENT },
        {
          backgroundColor: MIST,
          ease: 'none',
          scrollTrigger: {
            trigger: startSelector,
            start: 'top 75%',
            endTrigger: endSelector,
            end: 'center center',
            scrub: 0.6,
          },
        }
      );
    },
    { scope: root }
  );
}
