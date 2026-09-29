import { useCurrentFrame } from 'remotion';
import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import { Dust } from './filmKit';

/** Where the countdown starts, and how long each number holds (frames). */
const LEADER_AT = 66;
const COUNT = 22;
const TITLE_AT = LEADER_AT + 3 * COUNT;

/**
 * Prologue (0:00–0:07) — inside the 4:3 gate. The lamp warms up behind the signature on the
 * page (PrequelSection's iris opens onto it), the leader counts down, and the title card is
 * engraved. The film-level iris closes it onto Act I.
 */
export default function Prologue() {
  const frame = useCurrentFrame();
  const scope = useFilmTimeline((tl) => {
    // 0–2.2s — the projector lamp strikes and steadies
    tl.fromTo(
      '.pf-lamp',
      { opacity: 0 },
      {
        keyframes: [
          { opacity: 0.35, duration: 0.25 },
          { opacity: 0.08, duration: 0.12 },
          { opacity: 0.6, duration: 0.3 },
          { opacity: 0.3, duration: 0.1 },
          { opacity: 1, duration: 0.9 },
        ],
        ease: 'none',
      },
      0.1
    );

    // 4.4–7s — the title card: the border engraves itself, then the words
    tl.fromTo('.pf-titlecard', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, TITLE_AT / 30);
    tl.fromTo('.pf-titlecard .pf-draw', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, stagger: 0.08, ease: 'power2.out' }, TITLE_AT / 30);
    tl.fromTo('.pf-titlecard__kicker', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, TITLE_AT / 30 + 0.25);
    tl.fromTo(
      '.pf-titlecard__title',
      { autoAlpha: 0, letterSpacing: '0.2em', filter: 'blur(6px)' },
      { autoAlpha: 1, letterSpacing: '0.04em', filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' },
      TITLE_AT / 30 + 0.35
    );
    tl.fromTo('.pf-titlecard__part', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, TITLE_AT / 30 + 1.0);
    tl.to('.pf-titlecard', { scale: 1.04, duration: 2.6, ease: 'none' }, TITLE_AT / 30);
    tl.set({}, {}, 7);
  });

  const inLeader = frame >= LEADER_AT && frame < TITLE_AT;
  const count = 3 - Math.floor((frame - LEADER_AT) / COUNT);
  const within = (frame - LEADER_AT) % COUNT;
  const sweep = (within / COUNT) * 360;

  return (
    <div ref={scope} className="pf-scene pf-prologue">
      <div className="pf-lamp" />
      <Dust seed="prologue" count={44} speed={0.5} />

      {inLeader && (
        <div className="pf-leader" style={{ opacity: within < 2 ? 0.75 : 1 }}>
          <div className="pf-leader__sweep" style={{ background: `conic-gradient(var(--lp-sepia) ${sweep}deg, transparent ${sweep}deg)` }} />
          <svg viewBox="0 0 1440 1080" width="1440" height="1080">
            <circle cx="720" cy="540" r="330" />
            <circle cx="720" cy="540" r="290" />
            <line x1="720" y1="120" x2="720" y2="960" />
            <line x1="260" y1="540" x2="1180" y2="540" />
          </svg>
          <span className="pf-leader__count">{count}</span>
        </div>
      )}

      <div className="pf-titlecard">
        <svg className="pf-titlecard__frame" viewBox="0 0 1100 620" width="1100" height="620">
          <rect className="pf-draw" pathLength={1} x="6" y="6" width="1088" height="608" />
          <rect className="pf-draw" pathLength={1} x="26" y="26" width="1048" height="568" />
          {/* Engraved corner flourishes */}
          {[
            [26, 26, 1, 1],
            [1074, 26, -1, 1],
            [26, 594, 1, -1],
            [1074, 594, -1, -1],
          ].map(([x, y, sx, sy]) => (
            <path
              key={`${x}-${y}`}
              className="pf-draw"
              pathLength={1}
              d={`M${x} ${y + sy * 70} C${x + sx * 10} ${y + sy * 30} ${x + sx * 30} ${y + sy * 10} ${x + sx * 70} ${y} M${x + sx * 22} ${y + sy * 22} m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0`}
            />
          ))}
          <path className="pf-draw" pathLength={1} d="M430 548 H670 M530 548 L550 536 L570 548 L550 560 Z" />
        </svg>
        <p className="pf-titlecard__kicker">United Students Working for Advocacy and Growth</p>
        <p className="pf-titlecard__title">The Rebirth of USWAG</p>
        <p className="pf-titlecard__part">Part One · The Record</p>
      </div>
    </div>
  );
}
