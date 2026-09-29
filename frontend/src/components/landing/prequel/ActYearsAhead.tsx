import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import { FOUNDED_YEAR } from '../timeline.data';
import { SECOND_BATCH_YEAR } from '../firstOfficers.data';
import { PRESENT_YEAR } from '../prequel.data';
import { Caption } from './filmKit';

const C = { x: 960, y: 470 };
const FOUNDING_R = 64;
/** One faint ring for each year between the founding and the rebirth — years that passed, nothing more is claimed. */
const QUIET = Array.from({ length: SECOND_BATCH_YEAR - FOUNDED_YEAR - 1 }, (_, i) => FOUNDING_R + 12 + i * 8);
const REBORN_R0 = (QUIET[QUIET.length - 1] ?? FOUNDING_R) + 22;
/** Solid rings from the rebirth through this year… */
const LIVED = Array.from({ length: Math.max(1, PRESENT_YEAR - SECOND_BATCH_YEAR + 1) }, (_, i) => ({
  year: SECOND_BATCH_YEAR + i,
  r: REBORN_R0 + i * 30,
}));
/** …and open, dashed rings beyond it: the years still to come. */
const AHEAD = [1, 2, 3].map((i) => (LIVED[LIVED.length - 1].r + i * 34));

/**
 * Part Two · The Years Ahead (1:22–1:30). Tree rings, one per year of the record: the
 * founding, the quiet years, every year since the rebirth — renewed each year, as Article III
 * renews membership — and the years still open. The shutters close over the name at 1:28.
 */
export default function ActYearsAhead() {
  const scope = useFilmTimeline((tl) => {
    // Rings grow by their radius (an attribute), not by an SVG transform: GSAP's SVG origin
    // maths offset circles that start from scale 0 inside the Player.
    const grow = (from: number) => ({ attr: { r: from } });
    const toRadius = (duration: number, ease: string, stagger = 0) => ({
      attr: { r: (_: number, el: Element) => Number((el as SVGCircleElement).dataset.r) },
      duration,
      ease,
      stagger,
    });

    // 0–3.2s — the rings grow outward from a seed
    tl.fromTo('.pf-seed', grow(0), toRadius(0.4, 'back.out(3)'), 0.1);
    tl.fromTo('.pf-ring--founding', grow(0), toRadius(0.6, 'power3.out'), 0.3);
    tl.fromTo('.pf-ring--quiet', { ...grow(FOUNDING_R), opacity: 0 }, { ...toRadius(0.5, 'power2.out', 0.05), opacity: 1 }, 0.7);
    tl.fromTo('.pf-ring--lived', grow(REBORN_R0 - 30), toRadius(0.7, 'power3.out', 0.25), 1.5);
    tl.fromTo('.pf-ring--ahead', { ...grow(LIVED[LIVED.length - 1].r), opacity: 0 }, { ...toRadius(0.8, 'power2.out', 0.2), opacity: 1 }, 2.2);
    tl.fromTo('.pf-ring-label', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.2 }, 1.1);
    // The open rings turn slowly — their dashes travel round
    tl.fromTo('.pf-ring--ahead', { strokeDashoffset: 0 }, { strokeDashoffset: -160, duration: 8, ease: 'none' }, 0);

    // 3.4–6s — the rings step back; the name settles over them
    tl.to('.pf-rings', { opacity: 0.3, scale: 1.12, transformOrigin: `${C.x}px ${C.y}px`, duration: 1.2, ease: 'power2.inOut' }, 3.4);
    tl.to('.pf-ring-label', { autoAlpha: 0, duration: 0.4 }, 3.4);
    tl.fromTo('.pf-lockup__name', { autoAlpha: 0, letterSpacing: '0.4em' }, { autoAlpha: 1, letterSpacing: '0.18em', duration: 1.2, ease: 'power3.out' }, 3.6);
    tl.fromTo('.pf-lockup__full, .pf-lockup__years', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.2, ease: 'power3.out' }, 4.2);
    tl.fromTo('.pf-lockup__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power3.out' }, 4.1);
    tl.set({}, {}, 8);
  });

  return (
    <div ref={scope} className="pf-scene">
      <svg className="pf-rings" viewBox="0 0 1920 1080" width="1920" height="1080">
        {AHEAD.map((r) => (
          <circle key={r} className="pf-ring pf-ring--ahead" cx={C.x} cy={C.y} r={r} data-r={r} />
        ))}
        {LIVED.map(({ year, r }) => (
          <circle key={year} className="pf-ring pf-ring--lived" cx={C.x} cy={C.y} r={r} data-r={r} />
        ))}
        {QUIET.map((r) => (
          <circle key={r} className="pf-ring pf-ring--quiet" cx={C.x} cy={C.y} r={r} data-r={r} />
        ))}
        <circle className="pf-ring pf-ring--founding" cx={C.x} cy={C.y} r={FOUNDING_R} data-r={FOUNDING_R} />
        <circle className="pf-seed" cx={C.x} cy={C.y} r={14} data-r={14} />
      </svg>

      {/* Year labels sit on the rings' right-hand side, reading outward */}
      <p className="pf-ring-label pf-ring-label--founding lp-onum" style={{ left: C.x + FOUNDING_R + 6, top: C.y - 20 }}>
        {FOUNDED_YEAR}
      </p>
      {LIVED.map(({ year, r }, i) => (
        <p
          key={year}
          className="pf-ring-label lp-onum"
          style={{ left: C.x + r * Math.cos(-0.5 - i * 0.28) + 8, top: C.y + r * Math.sin(-0.5 - i * 0.28) - 20 }}
        >
          {year}
        </p>
      ))}

      <div className="pf-lockup">
        <p className="pf-lockup__name">USWAG</p>
        <span className="pf-lockup__rule" />
        <p className="pf-lockup__full">United Students Working for Advocacy and Growth</p>
        <p className="pf-lockup__years">
          Est. <span className="lp-onum">{FOUNDED_YEAR}</span> · Reborn <span className="lp-onum">{SECOND_BATCH_YEAR}</span>
        </p>
      </div>

      <Caption from={30} to={108} face="sans" tone="light" bottom={70}>
        Every year, a new chapter of the record.
      </Caption>
    </div>
  );
}
