import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/** Registers GSAP plugins exactly once. Call at the top of any module that uses ScrollTrigger. */
export function ensureGsapRegistered() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;

  // ScrollTrigger caches each trigger's start/end pixel positions when created. There's no
  // full page `load` event to hang a refresh off reliably in a client-rendered SPA route,
  // and web fonts (Lora/Poppins swap in after first paint) shift text layout after every
  // trigger's already measured — without this, start/end positions are calculated against
  // pre-font-swap layout and every scroll-tied animation on the site ends up misaligned.
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
  }
}

/** True when the visitor has asked the OS for reduced motion — every timeline in the site must check this. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// One shared timing/easing vocabulary so every page's motion feels like the same system
// instead of hand-tuned numbers per file.
export const EASE = {
  standard: 'power2.out',
  entrance: 'power3.out',
  smooth: 'sine.inOut',
  // Landing page house curve — GSAP twin of --lp-ease: cubic-bezier(0.22, 1, 0.36, 1)
  house: 'expo.out',
} as const;

export const DURATION = {
  fast: 0.35,
  base: 0.6,
  slow: 0.9,
  // Landing page narrative reveals — twin of --lp-dur-story
  story: 0.85,
} as const;

/** Per-item delay for staggered landing reveals (seconds). */
export const STAGGER = 0.07;

export { gsap, ScrollTrigger };
