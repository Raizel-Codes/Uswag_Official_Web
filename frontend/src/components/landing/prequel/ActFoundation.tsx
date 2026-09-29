import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import RubberStamp from '../ornaments/RubberStamp';
import { FOUNDED_YEAR } from '../timeline.data';
import { Arch, Caption, Charter, Dust, FilmQuill, Figure, Grass, Hills, Sun, signWithQuill } from './filmKit';

const LEFT = [500, 590, 680];
const RIGHT = [760, 850, 940];
const ROW = [250, 400, 550, 700, 850, 1000, 1150];
/** The stamp's centre on the charter — where the dust puffs out from. */
const STAMP_AT = { left: 399, top: 545 };
const PUFF = Array.from({ length: 12 }, (_, i) => i);

/**
 * Act I · The Founding (0:07–0:20) — inside the 4:3 gate, on parchment.
 *
 * A multi-plane shot: sky, hills, the arch and the grass are separate planes that the camera
 * pushes through at different rates. Then the desk: the quill signs the charter and the
 * stamp comes down hard enough to shake the frame.
 */
export default function ActFoundation() {
  const scope = useFilmTimeline((tl, q) => {
    // 0–5.6s — dawn over the campus; the camera drifts in through the grass
    tl.fromTo('.pf-plane-far', { x: 40, scale: 1 }, { x: -40, scale: 1.04, duration: 5.6, ease: 'sine.inOut' }, 0);
    tl.fromTo('.pf-plane-mid', { scale: 0.95 }, { scale: 1.06, transformOrigin: '50% 72%', duration: 5.6, ease: 'sine.inOut' }, 0);
    tl.fromTo('.pf-plane-near', { scale: 1, y: 0 }, { scale: 1.45, y: 140, transformOrigin: '50% 100%', duration: 5.6, ease: 'sine.in' }, 0);
    tl.fromTo('.pf-sky__dawn', { opacity: 0 }, { opacity: 1, duration: 3.2, ease: 'sine.out' }, 0);

    tl.fromTo('.pf-plane-mid .pf-arch .pf-draw', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.04 }, 0.3);
    tl.fromTo('.pf-sunrise .pf-sun', { y: 160, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 2.8, ease: 'sine.out' }, 0.3);
    tl.fromTo('.pf-sunrise .pf-rays', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, svgOrigin: '720 760', duration: 1.2 }, 1.8);

    // 2.6–4.6s — students walk in from both sides and close ranks under the arch
    tl.fromTo('.pf-f-left', { x: -760 }, { x: 0, duration: 1.6, stagger: 0.12, ease: 'power2.out' }, 2.6);
    tl.fromTo('.pf-f-right', { x: 760 }, { x: 0, duration: 1.6, stagger: 0.12, ease: 'power2.out' }, 2.6);
    tl.fromTo('.pf-bond', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7 }, 4.1);

    // 5.4–6.2s — to the desk: the landscape dissolves as the charter is laid down
    tl.to('.pf-landscape', { autoAlpha: 0, duration: 0.5 }, 5.4);
    tl.fromTo('.pf-desk', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 5.4);
    tl.fromTo('.pf-charter-wrap', { y: 900, rotation: 4 }, { y: 0, rotation: 0, duration: 0.8, ease: 'power3.out' }, 5.5);

    // 6.6–8s — the quill signs
    signWithQuill(tl, q, '.pf-desk .pf-quill', '.pf-charter-wrap .pf-signature', 6.7, 1.2);

    // 8.2s — the stamp comes down: the frame jolts, dust puffs out from under it
    tl.fromTo('.pf-stamp', { scale: 2.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.14, ease: 'power4.in' }, 8.2);
    tl.to('.pf-shake', { keyframes: [{ x: -12, y: 6, duration: 0.04 }, { x: 9, y: -4, duration: 0.05 }, { x: -5, y: 2, duration: 0.05 }, { x: 0, y: 0, duration: 0.08 }] }, 8.34);
    tl.fromTo(
      '.pf-puff span',
      { x: 0, y: 0, scale: 0.4, autoAlpha: 0 },
      {
        keyframes: [
          { autoAlpha: 0.8, duration: 0.04 },
          {
            x: (i: number) => Math.cos((i / PUFF.length) * Math.PI * 2) * (130 + (i % 3) * 40),
            y: (i: number) => Math.sin((i / PUFF.length) * Math.PI * 2) * (90 + (i % 4) * 26),
            scale: 1.6,
            autoAlpha: 0,
            duration: 0.86,
            ease: 'power2.out',
          },
        ],
      },
      8.34
    );

    // 9.6–13s — they stand in front of the ruled pages of their charter
    tl.to('.pf-charter-wrap', { scale: 0.6, y: -40, duration: 0.9 }, 9.6);
    tl.fromTo(
      '.pf-page-back',
      { autoAlpha: 0, x: 0, rotation: 0 },
      { autoAlpha: 1, x: (i: number) => [-360, -180, 180, 360][i], rotation: (i: number) => [-5, -2.5, 2.5, 5][i], duration: 0.9, stagger: 0.05 },
      9.65
    );
    tl.fromTo('.pf-row .pf-figure', { y: 320, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 9.9);
    tl.to('.pf-desk', { scale: 1.05, duration: 3.4, ease: 'none', transformOrigin: '50% 60%' }, 9.6);
    tl.set({}, {}, 13);
  });

  return (
    <div ref={scope} className="pf-scene pf-past">
      <div className="pf-landscape">
        <div className="pf-sky">
          <div className="pf-sky__dawn" />
        </div>
        <div className="pf-plane-far">
          <Sun />
          <Hills />
        </div>
        <div className="pf-plane-mid">
          <Arch />
          <svg className="pf-bond" viewBox="0 0 1440 1080" width="1440" height="1080">
            <ellipse cx="720" cy="890" rx="330" ry="46" pathLength={1} />
          </svg>
          {LEFT.map((x) => (
            <Figure key={x} tone="founder" className="pf-f-left" style={{ left: x, top: 656 }} />
          ))}
          {RIGHT.map((x) => (
            <Figure key={x} tone="founder" className="pf-f-right" style={{ left: x, top: 656 }} />
          ))}
        </div>
        <Dust seed="dawn" count={30} speed={0.4} className="pf-dust--sun" />
        <div className="pf-plane-near">
          <Grass />
        </div>
      </div>

      <div className="pf-desk">
        <div className="pf-desk__glow" />
        <div className="pf-shake">
          <div className="pf-charter-wrap" style={{ left: 460, top: 170 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="pf-page-back pf-charter" />
            ))}
            <Charter>
              <div className="pf-stamp" style={{ right: 36, bottom: 30 }}>
                <RubberStamp ring="UNITED STUDENTS · NWSSU · " center="USWAG" sub={`EST. ${FOUNDED_YEAR}`} size={170} tilt={-9} ink="var(--lp-sepia)" />
              </div>
              <div className="pf-puff" style={STAMP_AT}>
                {PUFF.map((i) => (
                  <span key={i} />
                ))}
              </div>
            </Charter>
          </div>
        </div>
        <FilmQuill />
        <div className="pf-row">
          {ROW.map((x) => (
            <Figure key={x} tone="founder" style={{ left: x, top: 790 }} />
          ))}
        </div>
        <Dust seed="desk" count={18} speed={0.25} />
      </div>

      <Caption from={24} to={110}>
        Northwest Samar State University · <span className="lp-onum">{FOUNDED_YEAR}</span>
      </Caption>
      <Caption from={250} to={300}>They called it USWAG.</Caption>
      <Caption from={304} to={384} top={50}>
        To speak for the student body — and stand by its rules.
      </Caption>
    </div>
  );
}
