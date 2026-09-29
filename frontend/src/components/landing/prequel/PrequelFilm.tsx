import { Html5Audio, Sequence, random, useCurrentFrame } from 'remotion';
import Prologue from './Prologue';
import ActFoundation from './ActFoundation';
import ActDisassembly from './ActDisassembly';
import ActRebirth from './ActRebirth';
import ActDigitalShift from './ActDigitalShift';
import ActReach from './ActReach';
import ActConnect from './ActConnect';
import ActPillars from './ActPillars';
import ActYearsAhead from './ActYearsAhead';
import { Fade, IRIS_OPEN, Iris, LightLeak, type IrisMove } from './filmKit';
import { PREQUEL_MUSIC, SCENES } from '../prequel.data';

/** Part Two runs on the present-day surface: from here the old gate is gone. */
const ARCHIVE_ENDS = SCENES.turning.from;

/** The silent-film cuts between Part One's scenes: close to a point, open from one. */
const IRIS: IrisMove[] = [
  { from: 192, to: 210, r: [IRIS_OPEN, 0], at: [720, 540] },
  { from: 210, to: 234, r: [0, IRIS_OPEN], at: [720, 640] },
  { from: 934, to: 960, r: [IRIS_OPEN, 0], at: [720, 600] },
  { from: 960, to: 986, r: [0, IRIS_OPEN], at: [720, 500] },
];

export interface PrequelFilmProps extends Record<string, unknown> {
  /**
   * The stage is phone-sized. The 1920px frame is then scaled to about a fifth, so the film
   * sets its captions larger and drops small print (landing.css, .pf--compact).
   */
  compact: boolean;
}

/**
 * "The Rebirth of USWAG" — the 90-second film in two parts, coded as a Remotion composition
 * and played in the page by @remotion/player (PrequelPlayer). Storyboard: prequel.data.ts
 * (SCENES, MARKS) and docs/design/landing-architecture.md §3.6.
 *
 * Remotion sequences the scenes and owns the clock; each scene choreographs itself with a GSAP
 * timeline seeked to the current frame (useFilmTimeline). Part One plays in an old 4:3 gate
 * on parchment — grain, flicker and a slight gate weave, iris cuts and light leaks — until
 * Act IV opens the frame to 16:9. Part Two is the present: Deep Forest with the sage grid.
 */
export default function PrequelFilm({ compact }: PrequelFilmProps) {
  const frame = useCurrentFrame();
  const archive = frame < ARCHIVE_ENDS;
  // Deterministic flicker and gate weave (Remotion's seeded random), changing every other frame
  const tick = Math.floor(frame / 2);
  const flicker = 0.02 + random(`pf-flicker-${tick}`) * 0.05;
  const weave = `translate(${(random(`pf-wx-${tick}`) - 0.5) * 3}px, ${(random(`pf-wy-${tick}`) - 0.5) * 3}px)`;

  const scene = (key: keyof typeof SCENES) => ({ from: SCENES[key].from, durationInFrames: SCENES[key].duration });

  return (
    <div className={compact ? 'pf pf--compact' : 'pf'}>
      <div className="pf-gate" hidden={!archive}>
        <div className="pf-gate__weave" style={{ transform: weave }}>
          <Sequence layout="none" {...scene('prologue')} name="Prologue">
            <Prologue />
          </Sequence>
          <Sequence layout="none" {...scene('founding')} name="Act I · The Founding">
            <ActFoundation />
          </Sequence>
          <Sequence layout="none" {...scene('quietYears')} name="Act II · The Quiet Years">
            <ActDisassembly />
          </Sequence>
          <Sequence layout="none" {...scene('return')} name="Act III · The Return">
            <ActRebirth />
          </Sequence>
        </div>
        <LightLeak from={582} to={622} />
        <LightLeak from={1262} to={1296} />
        <Iris moves={IRIS} />
        <div className="pf-grain lp-grain" />
        {archive && <div className="pf-flicker" style={{ opacity: flicker }} />}
      </div>

      <Sequence layout="none" {...scene('turning')} name="Act IV · The Turning">
        <ActDigitalShift />
      </Sequence>

      {frame >= SCENES.reach.from && <div className="pf-sequel-grid" />}
      <Sequence layout="none" {...scene('reach')} name="Part Two · Reach">
        <Fade duration={SCENES.reach.duration} fadeOut={10}>
          <ActReach />
        </Fade>
      </Sequence>
      <Sequence layout="none" {...scene('connect')} name="Part Two · Connect">
        <Fade duration={SCENES.connect.duration} fadeIn={10} fadeOut={10}>
          <ActConnect />
        </Fade>
      </Sequence>
      <Sequence layout="none" {...scene('pillars')} name="Part Two · The Three Pillars">
        <Fade duration={SCENES.pillars.duration} fadeIn={10} fadeOut={10}>
          <ActPillars />
        </Fade>
      </Sequence>
      <Sequence layout="none" {...scene('yearsAhead')} name="Part Two · The Years Ahead">
        <Fade duration={SCENES.yearsAhead.duration} fadeIn={10}>
          <ActYearsAhead />
        </Fade>
      </Sequence>

      {PREQUEL_MUSIC && <Html5Audio src={PREQUEL_MUSIC} />}
    </div>
  );
}
