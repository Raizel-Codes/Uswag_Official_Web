import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate, random, useCurrentFrame } from 'remotion';
import type { SceneQuery } from '@/hooks/useFilmTimeline';
import Quill, { QUILL_NIB } from '../ornaments/Quill';

/*
  Shared pieces of the prequel film. Everything here is drawn in composition pixels
  (the 4:3 gate is 1440 × 1080; the full frame 1920 × 1080) and coloured only through
  the brand/landing tokens. Movement is choreographed by each scene's GSAP timeline
  (useFilmTimeline) — these components only draw — except the few that are pure functions
  of the frame (Caption, Fade, Dust, Iris), which time themselves.
*/

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

interface CaptionProps {
  /** First and last frame (relative to the enclosing Sequence) the line is on screen. */
  from: number;
  to: number;
  children: ReactNode;
  /** serif = the archive (Lora), sans = the present (Inter). */
  face?: 'serif' | 'sans';
  tone?: 'ink' | 'light';
  size?: 'line' | 'title' | 'kicker';
  /** Distance from the bottom of the frame, in composition px. */
  bottom?: number;
  /** Anchor to the top instead (the line then wraps downward, never off the frame). */
  top?: number;
}

/** A line of on-screen text: rises in, holds, fades out. */
export function Caption({ from, to, children, face = 'serif', tone = 'ink', size = 'line', bottom = 110, top }: CaptionProps) {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    interpolate(frame, [from, from + 10], [0, 1], clamp),
    interpolate(frame, [to - 8, to], [1, 0], clamp)
  );
  const rise = interpolate(frame, [from, from + 16], [18, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (opacity <= 0) return null;
  return (
    <p
      className={`pf-caption pf-caption--${face} pf-caption--${tone} pf-caption--${size}`}
      style={{ opacity, transform: `translateY(${rise}px)`, ...(top === undefined ? { bottom } : { top }) }}
    >
      {children}
    </p>
  );
}

/** Fades a whole scene in over its first frames and out over its last (Part Two's cuts). */
export function Fade({ duration, fadeIn = 0, fadeOut = 0, children }: { duration: number; fadeIn?: number; fadeOut?: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    fadeIn ? interpolate(frame, [0, fadeIn], [0, 1], clamp) : 1,
    fadeOut ? interpolate(frame, [duration - fadeOut, duration], [1, 0], clamp) : 1
  );
  return (
    <div className="pf-fade" style={{ opacity }}>
      {children}
    </div>
  );
}

interface DustProps {
  /** Seed, so each scene's motes differ but never change between renders. */
  seed: string;
  count?: number;
  width?: number;
  height?: number;
  /** Drift per frame, in px. */
  speed?: number;
  className?: string;
}

/** Motes of dust drifting through light — deterministic, a pure function of the frame. */
export function Dust({ seed, count = 36, width = 1440, height = 1080, speed = 0.6, className = '' }: DustProps) {
  const frame = useCurrentFrame();
  return (
    <div className={`pf-dust ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const size = 3 + r('s') * 7;
        const x = (r('x') * width + frame * speed * (0.4 + r('v')) * (r('d') > 0.5 ? 1 : -1) + width * 4) % width;
        const y = (r('y') * height - frame * speed * 0.5 * r('u') + height * 4) % height;
        const twinkle = 0.25 + 0.55 * Math.abs(Math.sin(frame / (9 + r('t') * 14) + r('p') * 6));
        return <span key={i} style={{ width: size, height: size, opacity: twinkle, transform: `translate(${x}px, ${y}px)` }} />;
      })}
    </div>
  );
}

export interface IrisMove {
  /** Global frames (the film's own clock). */
  from: number;
  to: number;
  /** Radius, in gate px: 0 is shut, IRIS_OPEN clears the 1440 × 1080 gate. */
  r: [number, number];
  /** Centre of the iris, in gate px. */
  at: [number, number];
}

export const IRIS_OPEN = 920;

/** The silent-film iris: the picture closes to, or opens from, a point. */
export function Iris({ moves }: { moves: IrisMove[] }) {
  const frame = useCurrentFrame();
  const move = moves.find((m) => frame >= m.from && frame < m.to);
  if (!move) return null;
  const r = interpolate(frame, [move.from, move.to], move.r, { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (r >= IRIS_OPEN) return null;
  const [x, y] = move.at;
  const mask = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, black ${r + 2}px)`; // a mask: only its alpha counts
  return <div className="pf-iris" style={{ WebkitMaskImage: mask, maskImage: mask }} />;
}

/** A warm light leak washing across the frame between scenes (global frames). */
export function LightLeak({ from, to }: { from: number; to: number }) {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const t = (frame - from) / (to - from);
  const opacity = Math.sin(t * Math.PI) * 0.85;
  return <div className="pf-leak" style={{ opacity, transform: `translateX(${interpolate(t, [0, 1], [-420, 420])}px)` }} />;
}

export type FigureTone = 'founder' | 'new' | 'elder';

/**
 * A standing student in silhouette. founder = 2010, solid ink; new = 2025, drawn in Primary
 * line; elder = the adviser, sepia — the colour of the founding years they carry forward.
 */
export function Figure({ tone, className = '', style }: { tone: FigureTone; className?: string; style?: CSSProperties }) {
  const tall = tone === 'elder';
  return (
    <svg
      className={`pf-figure pf-figure--${tone} ${className}`}
      style={style}
      width={tall ? 104 : 92}
      height={tall ? 272 : 244}
      viewBox="0 0 60 160"
    >
      <circle cx="30" cy="19" r="13" />
      <path d="M7 160 V74 Q7 42 30 40 Q53 42 53 74 V160 Z" />
    </svg>
  );
}

/**
 * The campus arch as an engraving, drawn line by line: every `.pf-draw` stroke has
 * pathLength 1, so a timeline draws it by tweening stroke-dashoffset from 1 to 0.
 */
export function Arch({ className = '' }: { className?: string }) {
  const courses = [600, 650, 700, 750, 800, 850];
  return (
    <svg className={`pf-arch ${className}`} viewBox="0 0 1440 1080" width="1440" height="1080">
      <path className="pf-draw" pathLength={1} d="M120 900 H1320" />
      <path className="pf-draw" pathLength={1} d="M380 900 V540 A340 340 0 0 1 1060 540 V900" />
      <path className="pf-draw" pathLength={1} d="M460 900 V560 A260 260 0 0 1 980 560 V900" />
      <path className="pf-draw" pathLength={1} d="M690 200 L700 226 H740 L750 200" />
      {courses.map((y) => (
        <g key={y}>
          <path className="pf-draw" pathLength={1} d={`M380 ${y} H460`} />
          <path className="pf-draw" pathLength={1} d={`M980 ${y} H1060`} />
        </g>
      ))}
    </svg>
  );
}

/** The rising sun and its rays, for the back plane of a shot (behind the hills; the arch is drawn without its own). */
export function Sun({ className = '' }: { className?: string }) {
  return (
    <svg className={`pf-arch pf-sunrise ${className}`} viewBox="0 0 1440 1080" width="1440" height="1080">
      <circle className="pf-sun" cx="720" cy="760" r="150" />
      <g className="pf-rays">
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI + (i * Math.PI) / 10;
          return <line key={i} x1={720 + Math.cos(a) * 180} y1={760 + Math.sin(a) * 180} x2={720 + Math.cos(a) * 250} y2={760 + Math.sin(a) * 250} />;
        })}
      </g>
    </svg>
  );
}

/** Far hills along the horizon — the back plane of the multi-plane shots (wider than the gate, for parallax). */
export function Hills({ className = '' }: { className?: string }) {
  return (
    <svg className={`pf-hills ${className}`} viewBox="0 0 1800 1080" width="1800" height="1080">
      <path d="M0 880 C160 800 300 770 460 820 S760 760 900 800 S1180 740 1340 790 S1640 770 1800 830 V1080 H0 Z" />
      <path className="pf-hills__near" d="M0 900 C200 860 380 850 560 880 S900 860 1100 884 S1500 856 1800 890 V1080 H0 Z" />
    </svg>
  );
}

/** Foreground grass at the corners of the frame — the front plane, the one that moves most. */
export function Grass({ className = '' }: { className?: string }) {
  const blades = (x0: number, dir: 1 | -1) =>
    Array.from({ length: 14 }, (_, i) => {
      const x = x0 + dir * i * 22;
      const h = 150 + ((i * 53) % 110);
      const lean = dir * (18 + ((i * 37) % 40));
      return `M${x - 7} 1080 Q${x + lean * 0.4} ${1080 - h * 0.6} ${x + lean} ${1080 - h} Q${x + lean * 0.3} ${1080 - h * 0.55} ${x + 7} 1080 Z`;
    }).join(' ');
  return (
    <svg className={`pf-grass ${className}`} viewBox="0 0 1600 1080" width="1600" height="1080">
      <path d={blades(40, 1)} />
      <path d={blades(1560, -1)} />
    </svg>
  );
}

/** The founder's signature and, in Act III, the new student's beneath it. */
export const SIGNATURE_FOUNDER =
  'M8 48 C30 10 44 62 62 34 S96 16 104 44 S140 58 152 30 C160 12 170 52 186 40 S226 22 240 38 L292 34';
export const SIGNATURE_NEW = 'M10 44 C24 20 38 20 40 40 S58 60 72 34 C82 18 96 50 110 40 S136 18 150 36 C160 50 178 46 196 30 S240 34 286 40';

interface CharterProps {
  /** Something set on the page — the stamp. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Draw the second signature line (Act III: a new student signs under the founder). */
  countersign?: boolean;
}

/** The founding charter: ruled stock, a heading, signature lines that draw themselves (`.pf-signature`). */
export function Charter({ children, className = '', style, countersign = false }: CharterProps) {
  return (
    <div className={`pf-charter ${className}`} style={style}>
      <p className="pf-charter__title">Constitution &amp; By&#8209;Laws</p>
      <p className="pf-charter__sub">United Students Working for Advocacy and Growth</p>
      <div className="pf-charter__rules" />
      <svg className="pf-charter__sign" viewBox="0 0 300 70" width="300" height="70">
        <path className="pf-signature" pathLength={1} d={SIGNATURE_FOUNDER} />
      </svg>
      <span className="pf-charter__line" />
      {countersign && (
        <>
          <svg className="pf-charter__sign pf-charter__sign--new" viewBox="0 0 300 70" width="300" height="70">
            <path className="pf-signature pf-signature--new" pathLength={1} d={SIGNATURE_NEW} />
          </svg>
          <span className="pf-charter__line pf-charter__line--new" />
        </>
      )}
      <div className="pf-foxing" />
      {children}
    </div>
  );
}

/** The quill, sized for the film. A scene's timeline moves it along a `.pf-signature` with signWithQuill. */
export function FilmQuill({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <Quill className={`pf-quill ${className}`} style={style} width={96} />;
}

/**
 * The quill comes down onto a signature stroke, writes it — nib on the ink, both linear in
 * path length, so they stay together — and lifts away. `at` is when the nib touches the page.
 */
export function signWithQuill(tl: gsap.core.Timeline, q: SceneQuery, quillSelector: string, pathSelector: string, at: number, duration = 1.2) {
  const [path] = q(pathSelector);
  const quill = q(quillSelector);
  if (!path || !quill.length) return;
  const along = { path: path as SVGPathElement, align: path as SVGPathElement, alignOrigin: QUILL_NIB };
  tl.set(quill, { motionPath: { ...along, start: 0, end: 0 } }, at - 0.4);
  tl.fromTo(quill, { autoAlpha: 0, rotation: 16 }, { autoAlpha: 1, rotation: 0, duration: 0.35, ease: 'power2.out' }, at - 0.4);
  tl.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration, ease: 'none' }, at);
  tl.to(quill, { motionPath: along, duration, ease: 'none' }, at);
  tl.to(quill, { x: '+=220', y: '-=190', rotation: 22, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, at + duration + 0.05);
}

/** Small line icons for what pulls the founders apart in Act II. */
export function WeightIcon({ kind, className = '' }: { kind: 'books' | 'road' | 'clock'; className?: string }) {
  const d = {
    books: 'M8 40h48M12 40V14h10v26M24 40V8h10v32M36 40l6-28 9 2-6 26',
    road: 'M24 44 30 6M40 44 34 6M32 40v-5M32 28v-5M32 16v-4',
    clock: 'M32 8a18 18 0 1 0 0.01 0M32 16v10l7 5',
  }[kind];
  return (
    <svg className={`pf-weight ${className}`} viewBox="0 0 64 48" width="96" height="72">
      <path d={d} />
    </svg>
  );
}

/** The three advocacies (Article II), as named on the Advocacies page, with line icons in a 24px box. */
export const ADVOCACIES = [
  {
    id: 'voice',
    title: 'Youth Voice & Participation',
    focus: 'Governance & civic leadership',
    icon: 'M4 5h16v10H9l-5 4z',
  },
  {
    id: 'wellness',
    title: 'Mental Health & Wellness',
    focus: 'Literacy & peer support',
    icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  },
  {
    id: 'environment',
    title: 'Environmental Leadership',
    focus: 'Sustainability & green initiatives',
    icon: 'M5 19c0-8 6-13 14-14-1 8-6 14-14 14zM5 19l7-7',
  },
] as const;

/** A 24px line icon, drawn at any size. */
export function LineIcon({ d, size = 40, className = '' }: { d: string; size?: number; className?: string }) {
  return (
    <svg className={`pf-icon ${className}`} viewBox="0 0 24 24" width={size} height={size}>
      <path d={d} />
    </svg>
  );
}
