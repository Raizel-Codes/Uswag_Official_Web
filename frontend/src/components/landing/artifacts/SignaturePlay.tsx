import { useEffect, useRef, type SyntheticEvent } from 'react';
import { useGSAP } from '@gsap/react';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { gsap, prefersReducedMotion } from '@/lib/motion';
import Quill, { QUILL_NIB } from '../ornaments/Quill';
import RubberStamp from '../ornaments/RubberStamp';

gsap.registerPlugin(MotionPathPlugin);

/** "USWAG", signed in one stroke — a looped capital hand ending in a long underline flourish. */
const SIGNATURE =
  'M20 30 C18 62 24 88 44 88 C64 88 72 62 70 30 C70 58 70 82 82 86 C96 80 116 44 108 30 C100 18 82 26 88 42 C94 58 122 62 116 80 C110 94 86 92 82 84 C100 76 120 40 128 30 C132 52 138 76 144 88 C150 72 156 56 162 44 C168 58 174 76 180 88 C186 66 192 46 198 28 C200 60 204 88 216 88 C226 70 236 40 244 24 C250 44 256 72 262 90 C252 74 236 64 224 68 C240 64 258 62 274 64 C296 60 316 36 318 32 C300 22 276 36 276 60 C276 84 296 94 314 88 C326 84 330 72 328 62 L310 64 C336 66 366 64 384 76 C400 90 330 106 250 104 C170 102 100 108 40 114';

/** How long the hand takes to sign (s). */
const WRITE = 1.3;

interface SignaturePlayProps {
  /** The ritual has begun: sign, stamp, then open onto the film. */
  signing: boolean;
  /** The film's code is still arriving: the ritual holds, sealed, until it has. */
  loading: boolean;
  /** Pressed: the parent starts the film from this same gesture (so a score may play on iOS). */
  onSign: (e: SyntheticEvent) => void;
  /** The iris has opened; the overlay can go. */
  onOpened: () => void;
  lengthLabel: string;
}

/**
 * The prequel's play button, designed as a signing: a quill rests on a signature line. Pressed,
 * it signs "USWAG" across the line and a green stamp seals it; the seal then opens like a lens
 * — the silent-film iris — onto the film, which has been playing its projector warm-up behind.
 *
 * The film is started by the click itself (onSign), not after the flourish, because iOS only
 * lets a gesture start audio. The film's first two seconds are dark for exactly this reason.
 */
export default function SignaturePlay({ signing, loading, onSign, onOpened, lengthLabel }: SignaturePlayProps) {
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;

  useGSAP(
    () => {
      if (!signing || !root.current) return;
      const el = root.current;
      const path = el.querySelector<SVGPathElement>('.lp-sign__ink');
      const quill = el.querySelector('.lp-quill');
      const seal = el.querySelector('.lp-sign__seal');
      if (!path || !quill || !seal) return;

      const iris = { r: 0 };
      const paintIris = () => {
        const box = el.getBoundingClientRect();
        const s = seal.getBoundingClientRect();
        const x = s.left + s.width / 2 - box.left;
        const y = s.top + s.height / 2 - box.top;
        const mask = `radial-gradient(circle at ${x}px ${y}px, transparent ${iris.r}px, black ${iris.r + 1.5}px)`;
        el.style.webkitMaskImage = mask;
        el.style.maskImage = mask;
      };
      const reach = () => {
        const box = el.getBoundingClientRect();
        return Math.hypot(box.width, box.height) + 40;
      };

      const tl = gsap.timeline({ onComplete: () => onOpenedRef.current() });
      timeline.current = tl;

      if (prefersReducedMotion()) {
        // No writing hand, no iris: the signature and seal appear, then the page fades to the film.
        tl.set(path, { strokeDashoffset: 0 });
        tl.to('.lp-sign__label, .lp-quill', { autoAlpha: 0, duration: 0.2 }, 0);
        tl.to(seal, { autoAlpha: 1, duration: 0.3 }, 0.1);
        tl.addLabel('open', 0.9);
        tl.call(() => { if (loadingRef.current) tl.pause(); }, [], 'open');
        tl.to(el, { autoAlpha: 0, duration: 0.5 }, 'open');
        return;
      }

      const along = { path, align: path, alignOrigin: QUILL_NIB };
      tl.to('.lp-sign__label', { autoAlpha: 0, y: 6, duration: 0.2 }, 0);
      tl.to(quill, { motionPath: { ...along, start: 0, end: 0 }, rotation: 0, duration: 0.2, ease: 'power2.out' }, 0);
      tl.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: WRITE, ease: 'power1.inOut' }, 0.22);
      tl.to(quill, { motionPath: along, duration: WRITE, ease: 'power1.inOut' }, 0.22);
      tl.to(quill, { x: '+=140', y: '-=120', rotation: 24, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0.22 + WRITE);

      // The seal comes down beside the signature — the mark it leaves
      tl.fromTo(seal, { scale: 2.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.16, ease: 'power4.in' }, 0.35 + WRITE);
      tl.to('.lp-sign__sheet', { keyframes: [{ x: -4, y: 2, duration: 0.04 }, { x: 3, y: -1, duration: 0.05 }, { x: 0, y: 0, duration: 0.07 }] }, 0.51 + WRITE);

      // …and opens like a lens onto the film
      tl.addLabel('open', 0.85 + WRITE);
      tl.call(() => { if (loadingRef.current) tl.pause(); }, [], 'open');
      tl.to(iris, { r: reach, duration: 0.95, ease: 'power2.in', onUpdate: paintIris }, 'open');
    },
    { scope: root, dependencies: [signing] }
  );

  // Held at the seal while the film's code arrived: go on now it has.
  useEffect(() => {
    const tl = timeline.current;
    if (!loading && tl && tl.paused() && tl.progress() < 1) tl.play();
  }, [loading]);

  // A keyboard press starts the signing; keep focus somewhere sensible as the button goes.
  useEffect(() => {
    if (signing) button.current?.blur();
  }, [signing]);

  return (
    <div ref={root} className="lp-sign" data-signing={signing}>
      <div className="lp-sign__sheet">
        <p className="lp-sign__kicker">Sign the record to begin</p>
        <p className="lp-sign__title">The Rebirth of USWAG</p>

        <button
          ref={button}
          type="button"
          className="lp-sign__button"
          onClick={onSign}
          disabled={signing}
          aria-label={`Watch the prequel, ${lengthLabel.replace(':', ' minute ')} seconds`}
        >
          <svg className="lp-sign__svg" viewBox="0 0 420 130" aria-hidden="true">
            <path className="lp-sign__ink" pathLength={1} d={SIGNATURE} />
            <path className="lp-sign__line" d="M14 100 H406" />
            <path className="lp-sign__cross" d="M4 84 l10 10 M14 84 l-10 10" />
          </svg>
          <Quill className="lp-sign__quill" />
          <span className="lp-sign__label">
            Watch the prequel <span className="lp-lnum">· {lengthLabel}</span>
          </span>
          <span className="lp-sign__seal">
            <RubberStamp ring="UNITED STUDENTS · NWSSU · " center="USWAG" sub="PREQUEL" size={96} tilt={-10} />
          </span>
        </button>

        {signing && loading && <p className="lp-sign__wait">Loading the prequel…</p>}
      </div>
    </div>
  );
}
