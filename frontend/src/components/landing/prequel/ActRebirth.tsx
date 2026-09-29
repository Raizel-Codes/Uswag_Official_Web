import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import RubberStamp from '../ornaments/RubberStamp';
import { FOUNDED_YEAR } from '../timeline.data';
import { SECOND_BATCH_YEAR } from '../firstOfficers.data';
import { Arch, Caption, Charter, Dust, FilmQuill, Figure, Grass, Hills, Sun, signWithQuill } from './filmKit';

const LEFT = [430, 530];
const RIGHT = [830, 930];
const STAMP_AT = { left: 399, top: 545 };
const PUFF = Array.from({ length: 12 }, (_, i) => i);

/**
 * Act III · The Return (0:32–0:50). The reveal — confirmed by the organisation, with the
 * adviser's consent (2026-09-30) — is told in silhouette: the same figure holds the quill in
 * 2010 and, today, carries it across and hands it on. The adviser is never named or drawn as
 * a likeness.
 */
export default function ActRebirth() {
  const scope = useFilmTimeline((tl, q) => {
    // 0–2.6s — dust swept off the same charter; colour returns behind the sweep
    tl.fromTo('.pf-restored', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'sine.inOut' }, 0.5);
    tl.fromTo('.pf-brush', { x: 0, autoAlpha: 1 }, { x: 520, duration: 1.6, ease: 'sine.inOut' }, 0.5);
    tl.to('.pf-brush', { autoAlpha: 0, duration: 0.2 }, 2.1);
    tl.fromTo('.pf-restore', { scale: 1.06 }, { scale: 1, duration: 2.6, ease: 'sine.out' }, 0);
    tl.to('.pf-restore', { autoAlpha: 0, duration: 0.4 }, 2.5);

    // 2.6–7.5s — morning again: the arch is drawn anew in green and a new generation walks in
    tl.fromTo('.pf-now-scene', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 2.6);
    tl.fromTo('.pf-now-scene .pf-arch .pf-draw', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.03 }, 2.7);
    tl.fromTo('.pf-now-scene .pf-sun', { y: 160, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 2.4, ease: 'sine.out' }, 2.7);
    tl.fromTo('.pf-now-scene .pf-rays', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, svgOrigin: '720 760', duration: 1 }, 3.8);
    tl.fromTo('.pf-n-left', { x: -760 }, { x: 0, duration: 1.6, stagger: 0.12, ease: 'power2.out' }, 3.1);
    tl.fromTo('.pf-n-right', { x: 760 }, { x: 0, duration: 1.6, stagger: 0.12, ease: 'power2.out' }, 3.1);
    tl.fromTo('.pf-now-scene .pf-plane-far', { x: -30 }, { x: 30, duration: 7.9, ease: 'none' }, 2.6);
    tl.fromTo('.pf-now-scene .pf-plane-near', { scale: 1.2, y: 60 }, { scale: 1, y: 0, transformOrigin: '50% 100%', duration: 4.9, ease: 'sine.out' }, 2.6);

    // 7.5–10.5s — one older figure steps forward; focus racks from the students to them
    tl.fromTo('.pf-now-scene .pf-figure--elder', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 7.5);
    tl.to('.pf-n-left, .pf-n-right', { filter: 'blur(6px)', opacity: 0.55, duration: 1.1 }, 8.0);
    tl.to('.pf-now-scene .pf-plane-back', { filter: 'blur(4px)', duration: 1.1 }, 8.0);
    tl.fromTo('.pf-now-scene .pf-plane-mid', { scale: 1 }, { scale: 1.22, transformOrigin: '50% 74%', duration: 2.6, ease: 'sine.inOut' }, 7.9);
    tl.to('.pf-now-scene', { autoAlpha: 0, duration: 0.35 }, 10.3);

    // 10.5–14.5s — the split: 2010 | today, and the quill crosses the line
    tl.fromTo('.pf-split__then', { xPercent: -100 }, { xPercent: 0, duration: 0.5, ease: 'power3.out' }, 10.5);
    tl.fromTo('.pf-split__now', { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power3.out' }, 10.5);
    tl.fromTo('.pf-split__divider', { scaleY: 0 }, { scaleY: 1, duration: 0.5 }, 10.7);
    tl.fromTo('.pf-split .pf-quill', { x: 0, y: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 11.1);
    tl.to('.pf-split .pf-quill', { keyframes: [{ x: 250, y: -90, rotation: -8, duration: 0.55 }, { x: 490, y: -30, rotation: 0, duration: 0.55 }], ease: 'sine.inOut' }, 11.6);
    tl.to('.pf-split .pf-quill', { x: 690, y: -10, duration: 0.7, ease: 'power2.inOut' }, 13.0);
    tl.to('.pf-split', { autoAlpha: 0, duration: 0.35 }, 14.3);

    // 14.6–18s — the charter again: a new student signs under the founder; a green stamp
    tl.fromTo('.pf-fresh', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 14.6);
    tl.fromTo('.pf-fresh .pf-charter-wrap', { y: 60 }, { y: 0, duration: 0.8, ease: 'power3.out' }, 14.6);
    signWithQuill(tl, q, '.pf-fresh .pf-quill', '.pf-fresh .pf-signature--new', 15.3, 1.1);
    tl.fromTo('.pf-fresh .pf-stamp', { scale: 2.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.14, ease: 'power4.in' }, 16.9);
    tl.to('.pf-fresh .pf-shake', { keyframes: [{ x: -12, y: 6, duration: 0.04 }, { x: 9, y: -4, duration: 0.05 }, { x: -5, y: 2, duration: 0.05 }, { x: 0, y: 0, duration: 0.08 }] }, 17.04);
    tl.fromTo(
      '.pf-fresh .pf-puff span',
      { x: 0, y: 0, scale: 0.4, autoAlpha: 0 },
      {
        keyframes: [
          { autoAlpha: 0.7, duration: 0.04 },
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
      17.04
    );
    tl.to('.pf-fresh .pf-shake', { scale: 1.06, transformOrigin: '75% 80%', duration: 1.2, ease: 'sine.in' }, 16.8);
    tl.set({}, {}, 18);
  });

  return (
    <div ref={scope} className="pf-scene pf-past">
      <div className="pf-restore">
        <Charter className="pf-charter--aged" style={{ left: 460, top: 170 }} />
        <Charter className="pf-restored" style={{ left: 460, top: 170 }} />
        <span className="pf-brush" style={{ left: 450, top: 150 }} />
        <Dust seed="swept" count={26} speed={1.4} />
      </div>

      <div className="pf-now-scene">
        <div className="pf-plane-back">
          <div className="pf-sky pf-sky--now" />
          <div className="pf-plane-far">
            <Sun className="pf-sunrise--now" />
            <Hills className="pf-hills--now" />
          </div>
        </div>
        <div className="pf-plane-mid">
          <Arch className="pf-arch--now" />
          {LEFT.map((x) => (
            <Figure key={x} tone="new" className="pf-n-left" style={{ left: x, top: 656 }} />
          ))}
          <Figure tone="elder" style={{ left: 668, top: 628 }} />
          {RIGHT.map((x) => (
            <Figure key={x} tone="new" className="pf-n-right" style={{ left: x, top: 656 }} />
          ))}
        </div>
        <div className="pf-plane-near">
          <Grass className="pf-grass--now" />
        </div>
      </div>

      <div className="pf-split">
        <div className="pf-split__then">
          <span className="pf-split__label lp-onum">{FOUNDED_YEAR}</span>
          <Figure tone="founder" style={{ left: 330, top: 540 }} />
        </div>
        <div className="pf-split__now">
          <span className="pf-split__label">Today</span>
          <Figure tone="elder" style={{ left: 170, top: 512 }} />
          <Figure tone="new" style={{ left: 380, top: 540 }} />
        </div>
        <span className="pf-split__divider" />
        <FilmQuill style={{ left: 392, top: 520 }} />
      </div>

      <div className="pf-fresh">
        <div className="pf-desk__glow" />
        <div className="pf-shake">
          <div className="pf-charter-wrap" style={{ left: 460, top: 170 }}>
            <Charter className="pf-charter--fresh" countersign>
              <div className="pf-stamp" style={{ right: 36, bottom: 30 }}>
                <RubberStamp ring="UNITED STUDENTS · NWSSU · " center="USWAG" sub={String(SECOND_BATCH_YEAR)} size={170} tilt={7} />
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
      </div>

      <Caption from={16} to={100} size="title" bottom={40}>
        <span className="lp-onum">{SECOND_BATCH_YEAR}</span>
      </Caption>
      <Caption from={110} to={222}>A new generation opens the record.</Caption>
      <Caption from={232} to={312}>They didn’t start from nothing.</Caption>
      <Caption from={330} to={432}>
        Founder, <span className="lp-onum">{FOUNDED_YEAR}</span> · Adviser, today
      </Caption>
    </div>
  );
}
