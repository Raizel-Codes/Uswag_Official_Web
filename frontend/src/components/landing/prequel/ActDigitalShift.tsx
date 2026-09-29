import { random } from 'remotion';
import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import RubberStamp from '../ornaments/RubberStamp';
import DigitalCardFace from '../artifacts/DigitalCardFace';
import { SECOND_BATCH_YEAR } from '../firstOfficers.data';
import { ADVOCACIES, Caption, Charter, LineIcon } from './filmKit';

const PIXEL = 120; // the 4:3 page breaks into a 12 × 9 grid of these
const pixels = Array.from({ length: 12 * 9 }, (_, i) => i);

/** The stamp's centre inside the 4:3 page — where the camera closes in and the ink turns to modules. */
const STAMP = { x: 859, y: 715 };
/** A QR-*looking* module grid, decorative only (like DigitalCardFace's) — never a real or scannable code. */
const MODULES = 21;
const MODULE = 14;
const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= MODULES - 7 && y < 7) || (x < 7 && y >= MODULES - 7);
const ring = (x: number, y: number, ox: number, oy: number) => {
  const dx = x - ox;
  const dy = y - oy;
  const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
  const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
  return edge || core;
};
const modules: [number, number][] = [];
for (let y = 0; y < MODULES; y++) {
  for (let x = 0; x < MODULES; x++) {
    if (finder(x, y)) {
      const ox = x < 7 ? 0 : MODULES - 7;
      const oy = y < 7 ? 0 : MODULES - 7;
      if (ring(x, y, ox, oy)) modules.push([x, y]);
    } else if (random(`qr-${x}-${y}`) > 0.52) {
      modules.push([x, y]);
    }
  }
}

const ORBIT_ANGLES = [-90, 25, 155];
// An ellipse wide enough that the side chips clear the card (588 × 371 at scale 1.4)
const ORBIT_X = 640;
const ORBIT_Y = 330;
const TURN = 8; // degrees the advocacies drift round the card

const hLines = Array.from({ length: 11 }, (_, i) => (i + 1) * 90);
const vLines = Array.from({ length: 19 }, (_, i) => (i + 1) * 96);

/**
 * Act IV · The Turning (0:50–1:00). The camera closes in on the green stamp; its ink breaks
 * into modules, the modules into a grid, and the old 4:3 frame opens to 16:9. The act ends on
 * Deep Forest with the sage grid — the face the stage's velvet closes over at MARKS.intermission,
 * three seconds before the act does; the rest plays out behind the curtains.
 */
export default function ActDigitalShift() {
  const scope = useFilmTimeline((tl) => {
    // 0–1.4s — close in on the stamp
    tl.fromTo('.pf-gate4__camera', { scale: 1 }, { scale: 2.6, transformOrigin: `${STAMP.x}px ${STAMP.y}px`, duration: 1.4, ease: 'power2.inOut' }, 0);

    // 0.8–1.8s — its ink breaks into modules
    // (opacity, not an SVG scale — GSAP's SVG origin maths misplace shapes that start at scale 0 here)
    tl.fromTo('.pf-qr rect', { opacity: 0 }, { opacity: 1, duration: 0.12, ease: 'none', stagger: { amount: 0.8, from: 'center', grid: 'auto' } }, 0.8);
    tl.to('.pf-gate4 .pf-stamp', { autoAlpha: 0, duration: 0.5 }, 0.9);

    // 1.7–2.9s — the modules become the page: it breaks into a grid of deep green and opens to 16:9
    tl.fromTo('.pf-px', { scale: 0 }, { scale: 1.02, duration: 0.35, ease: 'power2.out', stagger: { grid: [9, 12], from: 'center', amount: 0.8 } }, 1.7);
    tl.to('.pf-gate4__camera', { scale: 1, duration: 0.9, ease: 'power2.inOut' }, 1.7);
    tl.set('.pf-gate4', { backgroundColor: 'var(--color-deep)' }, 2.6);
    tl.set('.pf-gate4__camera', { autoAlpha: 0 }, 2.6);
    tl.fromTo('.pf-gate4', { left: 240, width: 1440 }, { left: 0, width: 1920, duration: 0.7, ease: 'power3.inOut' }, 2.4);

    // 3–5s — the stamp's promise, as a digital card; the three advocacies circle it
    tl.fromTo('.pf-card', { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1.4, duration: 0.7, ease: 'power3.out' }, 3.0);
    tl.fromTo('.pf-chip', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.12 }, 3.3);
    tl.fromTo('.pf-orbit', { rotation: 0 }, { rotation: TURN, duration: 2.2, ease: 'none' }, 3.0);
    tl.fromTo('.pf-chip', { rotation: 0 }, { rotation: -TURN, duration: 2.2, ease: 'none' }, 3.0);
    tl.to('.pf-card, .pf-orbit', { autoAlpha: 0, duration: 0.4 }, 5.2);

    // 5.2–6s — the grid draws itself; the frame is now the curtains' digital face
    tl.fromTo('.pf-gridline--h', { scaleX: 0 }, { scaleX: 1, duration: 0.5, stagger: { each: 0.02, from: 'center' }, ease: 'power2.out' }, 5.2);
    tl.fromTo('.pf-gridline--v', { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: { each: 0.015, from: 'center' }, ease: 'power2.out' }, 5.3);
    tl.set({}, {}, 10);
  });

  return (
    <div ref={scope} className="pf-scene pf-digital">
      <div className="pf-gate4">
        <div className="pf-gate4__camera">
          <Charter className="pf-charter--fresh" style={{ left: 460, top: 170 }} countersign>
            <div className="pf-stamp" style={{ right: 36, bottom: 30 }}>
              <RubberStamp ring="UNITED STUDENTS · NWSSU · " center="USWAG" sub={String(SECOND_BATCH_YEAR)} size={170} tilt={7} />
            </div>
          </Charter>
          <svg
            className="pf-qr"
            viewBox={`0 0 ${MODULES * MODULE} ${MODULES * MODULE}`}
            width={MODULES * MODULE}
            height={MODULES * MODULE}
            style={{ left: STAMP.x - (MODULES * MODULE) / 2, top: STAMP.y - (MODULES * MODULE) / 2 }}
          >
            {modules.map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x * MODULE} y={y * MODULE} width={MODULE} height={MODULE} />
            ))}
          </svg>
        </div>
        {pixels.map((i) => (
          <span key={i} className="pf-px" style={{ left: (i % 12) * PIXEL, top: Math.floor(i / 12) * PIXEL, width: PIXEL, height: PIXEL }} />
        ))}
      </div>

      {hLines.map((y) => (
        <span key={`h${y}`} className="pf-gridline pf-gridline--h" style={{ top: y }} />
      ))}
      {vLines.map((x) => (
        <span key={`v${x}`} className="pf-gridline pf-gridline--v" style={{ left: x }} />
      ))}

      <div className="pf-orbit">
        {ADVOCACIES.map((a, i) => {
          const rad = (ORBIT_ANGLES[i] * Math.PI) / 180;
          return (
            <div key={a.id} className="pf-chip-anchor" style={{ left: 960 + Math.cos(rad) * ORBIT_X, top: 520 + Math.sin(rad) * ORBIT_Y }}>
              <div className="pf-chip">
                <LineIcon d={a.icon} />
                {a.title}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pf-card">
        <div className="lp-card-stage">
          <DigitalCardFace />
        </div>
      </div>

      <Caption from={96} to={160} face="sans" tone="light" bottom={70}>
        Same causes. New ways to carry them.
      </Caption>
    </div>
  );
}
