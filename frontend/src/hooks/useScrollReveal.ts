import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion, EASE, DURATION } from '@/lib/motion';

ensureGsapRegistered();

interface UseScrollRevealOptions {
  /** Extra delay (seconds) multiplied per element index, for a staggered feel across a grid/list. */
  stagger?: number;
}

/**
 * Animates every `[data-reveal]` element within the returned ref's subtree as it scrolls
 * into view, with real GSAP easing instead of a binary opacity toggle. Also still applies
 * the `.is-visible` class on the same trigger, so existing group-scoped Tailwind treatments
 * (draw-path SVG icons, growing borders, pulse-ring dots — see HomePage.tsx) keep working
 * unchanged; this only upgrades the base entrance motion, not those companion effects.
 * Elements are unaffected when the visitor prefers reduced motion (index.css already forces
 * the final state visible for [data-reveal] under that media query).
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope.current ?? undefined);
      targets.forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: DURATION.slow,
            ease: EASE.entrance,
            delay: options.stagger ? (i % 4) * options.stagger : 0,
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
              toggleClass: 'is-visible',
            },
          }
        );
      });
    },
    { scope }
  );

  return scope;
}
