import { useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/motion';
import { FOUNDED_YEAR } from '../timeline.data';

ensureGsapRegistered();

const C = 200; // SVG center (viewBox 0 0 400 400)
const ROMAN_HOURS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

function toRoman(n: number) {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Guilloché rosette — the engraved rose-engine pattern of antique dials, generated once. */
function rosette(rBase: number, amp: number, lobes: number, turns: number, phase = 0) {
  const pts: string[] = [];
  const steps = 720;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = rBase + amp * Math.cos(lobes * t + phase) + (amp / 2) * Math.cos(turns * t);
    pts.push(`${(C + r * Math.cos(t)).toFixed(2)},${(C + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}
const ROSETTES = [rosette(78, 9, 18, 3), rosette(78, 9, 18, 3, Math.PI / 18), rosette(52, 6, 12, 5)];

function ClassicFace() {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" fill="none" stroke="currentColor">
      {/* Bezel: heavy + two fine rings */}
      <circle cx={C} cy={C} r="196" strokeWidth="3" />
      <circle cx={C} cy={C} r="189" strokeWidth="1" />
      <circle cx={C} cy={C} r="183" strokeWidth="0.75" />
      {/* Railway minute track */}
      <circle cx={C} cy={C} r="176" strokeWidth="0.75" />
      <circle cx={C} cy={C} r="166" strokeWidth="0.75" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1={C}
          y1={C - 176}
          x2={C}
          y2={C - (i % 5 === 0 ? 160 : 166)}
          strokeWidth={i % 5 === 0 ? 2 : 0.9}
          transform={`rotate(${i * 6} ${C} ${C})`}
        />
      ))}
      {/* Roman numerals, set radially as on a regulator dial */}
      {ROMAN_HOURS.map((n, i) => (
        <text
          key={n}
          x={C}
          y={C - 128}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          stroke="none"
          fontFamily="Lora, serif"
          fontWeight={600}
          fontSize="22"
          letterSpacing="1"
          transform={`rotate(${i * 30} ${C} ${C})`}
        >
          {n}
        </text>
      ))}
      {/* Engraved guilloché centre */}
      {ROSETTES.map((d, i) => (
        <path key={i} d={d} strokeWidth="0.6" opacity={i === 2 ? 0.9 : 0.7} />
      ))}
      <circle cx={C} cy={C} r="96" strokeWidth="0.75" />
    </svg>
  );
}

function ModernFace() {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" fill="none">
      <circle cx={C} cy={C} r="192" stroke="currentColor" strokeWidth="1.25" />
      {Array.from({ length: 60 }, (_, i) =>
        i % 5 === 0 ? (
          <rect
            key={i}
            x={C - 2.5}
            y={C - 180}
            width="5"
            height={i % 15 === 0 ? 28 : 18}
            rx="2.5"
            fill="currentColor"
            transform={`rotate(${i * 6} ${C} ${C})`}
          />
        ) : (
          <circle key={i} cx={C} cy={C - 174} r="1.4" fill="currentColor" opacity="0.55" transform={`rotate(${i * 6} ${C} ${C})`} />
        )
      )}
    </svg>
  );
}

interface TimelineClockProps {
  /** Element whose scroll span drives the clock (the timeline list). */
  trackRef: RefObject<HTMLElement>;
}

/**
 * The background "canvas" of the years-in-between timeline: a clock that stays in view while
 * the visitor scrolls the ledger. Time sweeps forward, the engraved classical dial (Roman
 * numerals, guilloché, Breguet hands, "MMX" at centre) cross-fades into a modern dial whose
 * digital year counts from the founding year up to today.
 *
 * Purely decorative (aria-hidden). Only transform + opacity animate; nothing is pinned — the
 * stickiness is CSS `position: sticky`. Reduced motion: the classical dial rests at 10:10.
 */
export default function TimelineClock({ trackRef }: TimelineClockProps) {
  const root = useRef<HTMLDivElement>(null);
  const nowYear = new Date().getFullYear();

  useGSAP(
    () => {
      const el = root.current;
      const track = trackRef.current;
      if (!el || !track || prefersReducedMotion()) return;

      const romanEl = el.querySelector<SVGTextElement>('[data-clock-roman]');
      const yearEl = el.querySelector<HTMLElement>('[data-clock-year]');
      const span = nowYear - FOUNDED_YEAR;
      let shown = FOUNDED_YEAR;

      const tl = gsap.timeline({
        // Timeline length is 1 so positions below read as scroll progress (0 → 1).
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: {
          trigger: track,
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: 0.8,
          onUpdate: (self) => {
            const y = FOUNDED_YEAR + Math.round(self.progress * span);
            if (y === shown) return;
            shown = y;
            if (romanEl) romanEl.textContent = toRoman(y);
            if (yearEl) yearEl.textContent = String(y);
          },
        },
      });

      // Years fly by: the minute hand makes one turn per year, the hour hand a twelfth of that.
      tl.fromTo('[data-clock-minute]', { rotate: 60 }, { rotate: 60 + span * 360 }, 0)
        .fromTo('[data-clock-hour]', { rotate: -60 }, { rotate: -60 + span * 30 }, 0)
        .fromTo('[data-clock-second]', { rotate: 0 }, { rotate: span * 360 * 4 }, 0)
        // Past → present: the engraved dial gives way to the modern one mid-journey
        .fromTo('[data-clock-classic]', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 0.3)
        .fromTo('[data-clock-modern]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.38);
    },
    { scope: root, dependencies: [trackRef] }
  );

  return (
    <div ref={root} className="lp-clock-track" aria-hidden="true">
      <div className="lp-clock">
        {/* CLASSICAL — sepia ink */}
        <div data-clock-classic className="lp-clock__layer lp-clock__classic">
          <ClassicFace />
          <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
            <text
              data-clock-roman
              x={C}
              y={C + 62}
              textAnchor="middle"
              fill="currentColor"
              fontFamily="Lora, serif"
              fontWeight={600}
              fontSize="17"
              letterSpacing="3"
            >
              {toRoman(FOUNDED_YEAR)}
            </text>
          </svg>
        </div>

        {/* MODERN — Primary / Deep, Sage accent */}
        <div data-clock-modern className="lp-clock__layer lp-clock__modern">
          <ModernFace />
          <div className="lp-clock__readout">
            <span data-clock-year className="lp-clock__year">{FOUNDED_YEAR}</span>
            <span className="lp-clock__label">USWAG · since {FOUNDED_YEAR}</span>
          </div>
        </div>

        {/* Hands — both styles share one rotating element each, so they stay in sync */}
        <div data-clock-hour className="lp-clock__hand" style={{ transform: 'rotate(-60deg)' }}>
          <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
            {/* Breguet hour hand */}
            <g data-clock-classic className="lp-clock__classic" fill="currentColor">
              <path d="M198 222 L198 138 L202 138 L202 222 Z" />
              <circle cx={C} cy="126" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <path d="M200 96 L205 113 L195 113 Z" />
            </g>
            {/* Modern hour baton */}
            <rect data-clock-modern className="lp-clock__modern" x="195" y="104" width="10" height="112" rx="5" fill="currentColor" />
          </svg>
        </div>
        <div data-clock-minute className="lp-clock__hand" style={{ transform: 'rotate(60deg)' }}>
          <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
            <g data-clock-classic className="lp-clock__classic" fill="currentColor">
              <path d="M198.6 228 L198.6 78 L201.4 78 L201.4 228 Z" />
              <circle cx={C} cy="92" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M200 44 L204 70 L196 70 Z" />
            </g>
            <rect data-clock-modern className="lp-clock__modern" x="196.5" y="50" width="7" height="166" rx="3.5" fill="currentColor" />
          </svg>
        </div>
        <div data-clock-second className="lp-clock__hand lp-clock__modern" data-clock-modern>
          <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
            <rect x="199.25" y="34" width="1.5" height="196" fill="var(--color-sage)" />
            <circle cx={C} cy={C} r="5" fill="var(--color-sage)" />
          </svg>
        </div>
        {/* Centre boss */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          <circle cx={C} cy={C} r="7" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
