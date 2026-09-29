import { random, useCurrentFrame } from 'remotion';
import { useFilmTimeline } from '@/hooks/useFilmTimeline';
import RubberStamp from '../ornaments/RubberStamp';
import { FOUNDED_YEAR } from '../timeline.data';
import { Arch, Caption, Charter, Dust, Figure, Hills, WeightIcon } from './filmKit';

const DRIFTERS: { x: number; weight?: 'books' | 'road' | 'clock' }[] = [
  { x: 420, weight: 'books' },
  { x: 530 },
  { x: 640, weight: 'road' },
  { x: 750 },
  { x: 860 },
  { x: 970, weight: 'clock' },
];

/** The time-lapse: one day every DAY frames, for the first LAPSE frames of the act. */
const DAY = 40;
const LAPSE = 110;
const CLOUDS = [0, 1, 2, 3];
const STARS = Array.from({ length: 26 }, (_, i) => i);
const VINES = [
  'M0 1080 C40 1010 20 960 70 920 S140 880 120 820',
  'M40 1080 C90 1040 130 1050 170 1000 S250 980 260 930',
  'M1440 1080 C1400 1020 1420 970 1370 930 S1300 890 1320 840',
  'M1400 1080 C1350 1040 1310 1046 1270 1000 S1190 980 1180 930',
];

/**
 * Act II · The Quiet Years (0:20–0:32). Deliberately no years and no stated causes — none are
 * on record; the "real world" is only shapes: books, a road, a clock. The sky is a pure
 * function of the frame: days pass as a time-lapse, with the rains of a Samar wet season.
 */
export default function ActDisassembly() {
  const frame = useCurrentFrame();
  const scope = useFilmTimeline((tl) => {
    // 0–3.7s — the time-lapse over the arch (drawn per frame below), then it gives way
    tl.to('.pf-lapse', { autoAlpha: 0, duration: 0.4 }, 3.5);

    // 3.6–7s — the founders drift apart, each pulled away by something heavier
    tl.fromTo('.pf-drifters', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 3.6);
    tl.fromTo('.pf-weight', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.14 }, 4.0);
    tl.to('.pf-drifter', { x: (i: number) => (i - 2.5) * 210, opacity: 0.25, duration: 2.2, ease: 'sine.inOut' }, 4.3);
    tl.to('.pf-drifters', { autoAlpha: 0, duration: 0.4 }, 6.8);

    // 7–10.6s — the charter in the half-dark: it yellows and curls, grass creeps in
    tl.fromTo('.pf-aging', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 6.9);
    tl.fromTo('.pf-aging .pf-foxing', { opacity: 0 }, { opacity: 1, duration: 3, ease: 'none' }, 7.1);
    tl.fromTo('.pf-aging .pf-charter', { rotation: 0, skewY: 0 }, { rotation: -3.5, skewY: 1.5, duration: 3.2 }, 7.1);
    tl.fromTo('.pf-aging .pf-stamp', { opacity: 1 }, { opacity: 0.15, duration: 2.8 }, 7.3);
    tl.fromTo('.pf-vine', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.6, stagger: 0.2, ease: 'sine.out' }, 7.4);
    tl.fromTo('.pf-aging', { scale: 1.08 }, { scale: 1, duration: 3.6, ease: 'sine.out' }, 6.9);
    tl.fromTo('.pf-dim', { opacity: 0 }, { opacity: 0.45, duration: 3 }, 7.1);
    tl.to('.pf-aging', { autoAlpha: 0, duration: 0.5 }, 10.3);

    // 10.4–12s — the arch stands empty at dusk (the film's iris closes on it)
    tl.fromTo('.pf-dusk', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 10.4);
    tl.set({}, {}, 12);
  });

  // The time-lapse sky
  const lapse = Math.min(frame, LAPSE);
  const phase = (lapse % DAY) / DAY;
  const daylight = phase < 0.62;
  const sunAngle = Math.PI + (Math.min(phase, 0.62) / 0.62) * Math.PI;
  const night = daylight ? Math.max(0, (phase - 0.5) * 3) : Math.min(1, (phase - 0.62) * 6, (1 - phase) * 6);
  const rain = frame > 44 && frame < 96 ? Math.min(1, (frame - 44) / 8, (96 - frame) / 8) : 0;

  return (
    <div ref={scope} className="pf-scene pf-past">
      <div className="pf-lapse">
        <div className="pf-sky" />
        {daylight && <span className="pf-lapse__sun" style={{ transform: `translate(${720 + Math.cos(sunAngle) * 620}px, ${860 + Math.sin(sunAngle) * 560}px)` }} />}
        {CLOUDS.map((i) => {
          const x = ((random(`cloud-${i}`) * 1900 + frame * (14 + i * 5)) % 2100) - 330;
          return <span key={i} className="pf-cloud" style={{ transform: `translate(${x}px, ${120 + i * 90}px) scale(${0.7 + random(`cs-${i}`) * 0.6})` }} />;
        })}
        <Hills className="pf-hills--lapse" />
        <Arch className="pf-arch--lapse" />
        <div className="pf-night" style={{ opacity: night * 0.55 }} />
        <div className="pf-stars" style={{ opacity: night * 0.9 }}>
          {STARS.map((i) => (
            <span key={i} style={{ left: random(`star-x-${i}`) * 1440, top: random(`star-y-${i}`) * 520 }} />
          ))}
        </div>
        <div className="pf-rain" style={{ opacity: rain * 0.8, backgroundPosition: `${frame * -9}px ${frame * 46}px` }} />
      </div>

      <div className="pf-drifters">
        {DRIFTERS.map(({ x, weight }) => (
          <div key={x} className="pf-drifter" style={{ left: x, top: 560 }}>
            {weight && <WeightIcon kind={weight} />}
            <Figure tone="founder" style={{ left: 0, top: 96 }} />
          </div>
        ))}
      </div>

      <div className="pf-aging">
        <Charter style={{ left: 460, top: 170 }}>
          <div className="pf-stamp" style={{ right: 36, bottom: 30 }}>
            <RubberStamp ring="UNITED STUDENTS · NWSSU · " center="USWAG" sub={`EST. ${FOUNDED_YEAR}`} size={170} tilt={-9} ink="var(--lp-sepia)" />
          </div>
        </Charter>
        <svg className="pf-vines" viewBox="0 0 1440 1080" width="1440" height="1080">
          {VINES.map((d) => (
            <path key={d} className="pf-vine" pathLength={1} d={d} />
          ))}
        </svg>
        <Dust seed="settling" count={30} speed={0.2} />
      </div>

      <div className="pf-dusk">
        <Arch className="pf-arch--dusk" />
      </div>
      <div className="pf-dim" />

      <Caption from={10} to={100}>The years pass.</Caption>
      <Caption from={118} to={204}>The world asks more of them.</Caption>
      <Caption from={252} to={330}>The record goes quiet.</Caption>
    </div>
  );
}
