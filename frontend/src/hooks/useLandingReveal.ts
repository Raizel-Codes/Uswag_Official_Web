import { type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, ensureGsapRegistered, prefersReducedMotion, EASE, DURATION, STAGGER } from '@/lib/motion';

ensureGsapRegistered();

/**
 * Landing-page reveal language (docs/design/landing-architecture.md §3.2):
 *
 * - `[data-lp-reveal]`        single upward rise + fade, batched so elements entering together
 *                             stagger 70ms in DOM order (eyebrow → heading → rule → body → media).
 * - `[data-lp-reveal="rule"]` ornament rules draw outward from the center (scaleX) instead.
 * - `[data-lp-develop]`       gets `.is-developed` once in view (archival prints lose some sepia).
 *
 * Every revealed element also receives `.is-revealed`, which CSS companions key off
 * (e.g. the mandate icons' stroke draw). Reduced motion: nothing is hidden or moved —
 * landing.css forces the final state and this hook only applies the classes.
 */
export function useLandingReveal(scope: RefObject<HTMLElement>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;

      const all = gsap.utils.toArray<HTMLElement>('[data-lp-reveal]', el);
      const develop = gsap.utils.toArray<HTMLElement>('[data-lp-develop]', el);

      if (prefersReducedMotion()) {
        all.forEach((n) => n.classList.add('is-revealed'));
        develop.forEach((n) => n.classList.add('is-developed'));
        return;
      }

      const rules = all.filter((n) => n.dataset.lpReveal === 'rule');
      const rises = all.filter((n) => n.dataset.lpReveal !== 'rule');
      const isMobile = window.matchMedia('(max-width: 767px)').matches;

      gsap.set(rises, { autoAlpha: 0, y: isMobile ? 16 : 24 });
      gsap.set(rules, { scaleX: 0 });

      ScrollTrigger.batch(rises, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          batch.forEach((n) => (n as HTMLElement).classList.add('is-revealed'));
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: DURATION.story,
            ease: EASE.house,
            stagger: STAGGER,
            overwrite: true,
          });
        },
      });

      ScrollTrigger.batch(rules, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { scaleX: 1, duration: DURATION.story, ease: EASE.house, stagger: STAGGER }),
      });

      develop.forEach((n) =>
        ScrollTrigger.create({
          trigger: n,
          start: 'top 70%',
          once: true,
          onEnter: () => n.classList.add('is-developed'),
        })
      );
    },
    // Re-run when async content (officers/events/posts) changes which elements exist.
    { scope, dependencies: deps, revertOnUpdate: true }
  );
}
