import type { CSSProperties } from 'react';

/**
 * A feather quill, nib at the bottom left. Used by the prequel's signature play button
 * (PrequelSection) and inside the film (prequel/filmKit), so the pen that signs on the page
 * is the pen that signs on screen.
 *
 * The nib tip sits at (8, 236) of the 120 × 240 box — QUILL_NIB, as fractions of the box, is
 * what GSAP's motionPath `alignOrigin` needs to put the tip on a stroke.
 */
export const QUILL_NIB: [number, number] = [8 / 120, 236 / 240];

export default function Quill({ className = '', style, width = 60 }: { className?: string; style?: CSSProperties; width?: number }) {
  return (
    <svg className={`lp-quill ${className}`} style={style} viewBox="0 0 120 240" width={width} height={width * 2} aria-hidden="true">
      {/* Vane: a long feather leaning right, with a notch or two where the barbs have split */}
      <path
        className="lp-quill__vane"
        d="M22 196 C6 150 20 92 52 52 C70 30 92 14 112 4 C110 30 104 58 92 84 L84 86 L90 94 C78 124 60 160 34 190 Z"
      />
      <path className="lp-quill__barbs" d="M40 150 L66 120 M48 124 L78 94 M58 98 L88 66 M70 74 L98 40 M30 176 L52 152" />
      <path className="lp-quill__shaft" d="M8 236 C40 160 72 84 112 4" />
      <path className="lp-quill__nib" d="M8 236 L12 214 L22 208 L20 220 Z" />
    </svg>
  );
}
