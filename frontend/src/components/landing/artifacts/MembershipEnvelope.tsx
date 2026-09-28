import { forwardRef, useEffect, useId, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/motion';
import RubberStamp from '../ornaments/RubberStamp';

ensureGsapRegistered();

/** Irregular wax-blob outline, generated once (deterministic). */
const WAX_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    const r = 45 + 2.6 * Math.sin(7 * t) + 1.8 * Math.cos(11 * t + 0.6) + 1.1 * Math.sin(17 * t);
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
})();

function WaxSeal() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full block" aria-hidden="true">
      <defs>
        <radialGradient id={`wax-${uid}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#3D7455" /> {/* primary.light (tailwind.config) */}
          <stop offset="0.55" stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-deep)" />
        </radialGradient>
        <filter id={`wax-rough-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
        </filter>
      </defs>
      <g filter={`url(#wax-rough-${uid})`}>
        <path d={WAX_PATH} fill={`url(#wax-${uid})`} />
      </g>
      {/* Pressed rim + embossed crest shield and open book */}
      <circle cx="50" cy="50" r="31" fill="none" stroke="var(--color-sage)" strokeOpacity="0.7" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="27.5" fill="none" stroke="var(--color-deep)" strokeOpacity="0.5" strokeWidth="1" />
      <g transform="translate(50 50) scale(0.3) translate(-300 -238)">
        <path d="M300,168 L346,184 L346,246 Q346,286 300,308 Q254,286 254,246 L254,184 Z" fill="none" stroke="var(--color-sage)" strokeWidth="7" strokeLinejoin="round" />
        <path d="M300,235 Q286,226 270,230 L270,255 Q286,251 300,260 Z M300,235 Q314,226 330,230 L330,255 Q314,251 300,260 Z" fill="var(--color-sage)" fillOpacity="0.85" />
      </g>
      {/* Highlight glint */}
      <ellipse cx="36" cy="30" rx="10" ry="5" fill="var(--color-mist)" opacity="0.18" transform="rotate(-30 36 30)" />
    </svg>
  );
}

interface MembershipEnvelopeProps {
  /** Envelope has been opened (letter out, terms visible). */
  opened?: boolean;
  onOpen?: () => void;
  /** Closed and stamped RECEIVED — the application-submitted state. */
  received?: boolean;
  /** id of the terms region the seal button controls. */
  controlsId?: string;
}

/**
 * The membership terms, sealed. The envelope drops into place when it scrolls into view;
 * breaking the wax seal (a real <button>) swings the flap open and raises the letter. The
 * readable terms themselves live in regular HTML beside it (see ApplicationPage) — the
 * envelope is the ceremony, not the content. Reduced motion: every step is instant.
 */
const MembershipEnvelope = forwardRef<HTMLButtonElement, MembershipEnvelopeProps>(function MembershipEnvelope(
  { opened = false, onOpen, received = false, controlsId },
  sealRef
) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      gsap.from(root.current, {
        y: -80,
        rotate: -5,
        autoAlpha: 0,
        duration: 1.1,
        ease: 'back.out(1.5)',
        scrollTrigger: { trigger: root.current, start: 'top 90%', once: true },
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className={`lp-envelope ${opened ? 'is-open' : ''}`}>
      <div className="lp-envelope__back" />
      <div className="lp-envelope__letter" aria-hidden="true">
        <p className="lp-masthead" style={{ fontSize: 'clamp(0.625rem, 1.6vw, 0.8125rem)' }}>USWAG</p>
        <p className="lp-dateline lp-ink-secondary mt-1" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>
          Membership terms — read before you apply
        </p>
      </div>
      <div className="lp-envelope__pocket" />
      <svg className="lp-envelope__folds" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="rgb(90 72 50 / 0.3)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke">
          <path d="M0 100 L44 60" vectorEffect="non-scaling-stroke" />
          <path d="M100 100 L56 60" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <div className="lp-envelope__flap" />

      {received ? (
        <>
          <div className="lp-envelope__seal pointer-events-none" aria-hidden="true">
            <WaxSeal />
          </div>
          <RubberStamp ring="MEMBERSHIP APPLICATION · " center="RECEIVED" size={120} tilt={-12} className="absolute right-[4%] top-[6%] z-[7]" />
        </>
      ) : (
        <button
          ref={sealRef}
          type="button"
          className="lp-envelope__seal"
          onClick={onOpen}
          aria-expanded={opened}
          aria-controls={controlsId}
          aria-label={opened ? 'Membership terms opened' : 'Break the seal to read the membership terms'}
          disabled={opened}
        >
          <WaxSeal />
        </button>
      )}
    </div>
  );
});

export default MembershipEnvelope;

/** Moves focus to `el` once the opening animation has played (immediately under reduced motion). */
export function useFocusAfterOpen(opened: boolean, el: HTMLElement | null) {
  useEffect(() => {
    if (!opened || !el) return;
    const t = setTimeout(() => el.focus({ preventScroll: false }), prefersReducedMotion() ? 0 : 1000);
    return () => clearTimeout(t);
  }, [opened, el]);
}
