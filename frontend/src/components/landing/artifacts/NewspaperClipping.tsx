import { useId } from 'react';
import { deckleClipPath } from './deckle';
import RubberStamp from '../ornaments/RubberStamp';

const CLIP = deckleClipPath(2010, 1.2, 30);

interface NewspaperClippingProps {
  foundedYear: number;
  className?: string;
}

/**
 * Aged newspaper clipping — the archival hero's visual. Everything is code-generated and
 * original: a halftone-printed illustration (students gathered beneath a campus arch at
 * sunrise), a headline, and ruled bars standing in for column text.
 *
 * Decorative: the headline repeats facts stated in the hero's real HTML (name, 2010, NwSSU),
 * so the whole composition is aria-hidden.
 */
export default function NewspaperClipping({ foundedYear, className = '' }: NewspaperClippingProps) {
  const uid = useId().replace(/:/g, '');
  const dense = `ht-dense-${uid}`;
  const mid = `ht-mid-${uid}`;
  const light = `ht-light-${uid}`;

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="lp-paper-shadow" style={{ transform: 'rotate(-1.6deg)' }}>
        <div className="lp-paper px-6 pt-6 pb-8 sm:px-8 sm:pt-7" style={{ clipPath: CLIP }}>
          {/* Clipping masthead */}
          <div className="flex items-baseline justify-between gap-3 lp-ink-secondary">
            <span className="lp-eyebrow" style={{ fontSize: '0.75rem' }}>Calbayog City</span>
            <span className="lp-masthead" style={{ fontSize: '0.75rem', letterSpacing: '0.24em' }}>The USWAG Record</span>
            <span className="lp-eyebrow lp-onum" style={{ fontSize: '0.75rem' }}>{foundedYear}</span>
          </div>
          <div className="lp-clipping__rule mt-2.5 mb-4" />

          <p
            className="font-display font-semibold text-center leading-[1.05] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(1.35rem, 2.3vw, 1.85rem)' }}
          >
            Students Unite for Advocacy and Growth
          </p>
          <p className="lp-dateline text-center mt-1.5 lp-ink-secondary" style={{ fontSize: '0.9375rem' }}>
            A new organization takes root at Northwest Samar State University
          </p>

          {/* Halftone illustration */}
          <svg viewBox="0 0 320 180" className="w-full h-auto mt-4 block" style={{ color: 'var(--lp-ink)' }}>
            <defs>
              <pattern id={dense} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <circle cx="2" cy="2" r="1.55" fill="currentColor" />
              </pattern>
              <pattern id={mid} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
              <pattern id={light} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <circle cx="2" cy="2" r="0.55" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="320" height="180" fill="var(--lp-parchment)" />
            <rect width="320" height="180" fill={`url(#${light})`} opacity="0.55" />
            {/* Rising sun */}
            <circle cx="160" cy="112" r="62" fill="var(--lp-parchment)" />
            <circle cx="160" cy="112" r="62" fill={`url(#${mid})`} opacity="0.35" />
            <g stroke="currentColor" strokeWidth="0.8" opacity="0.45">
              {Array.from({ length: 11 }, (_, i) => {
                const a = Math.PI + (i * Math.PI) / 10;
                return (
                  <line
                    key={i}
                    x1={160 + Math.cos(a) * 70}
                    y1={112 + Math.sin(a) * 70}
                    x2={160 + Math.cos(a) * 92}
                    y2={112 + Math.sin(a) * 92}
                  />
                );
              })}
            </g>
            {/* Distant hills */}
            <path d="M0 118 Q60 96 118 112 T236 104 T320 114 V180 H0 Z" fill={`url(#${mid})`} />
            {/* Campus arch */}
            <g fill="currentColor">
              <rect x="112" y="84" width="96" height="8" />
              <path d="M104 84 L160 62 L216 84 Z" fill={`url(#${dense})`} />
              <path d="M104 84 L160 62 L216 84" fill="none" stroke="currentColor" strokeWidth="1.5" />
              {[118, 138, 176, 196].map((x) => (
                <rect key={x} x={x} y="92" width="6" height="36" />
              ))}
              <rect x="108" y="128" width="104" height="5" />
            </g>
            {/* Ground */}
            <path d="M0 138 Q160 128 320 138 V180 H0 Z" fill={`url(#${dense})`} />
            {/* Gathered students — heads & shoulders, some hands raised */}
            <g fill="currentColor">
              {[
                [26, 150, 0], [52, 146, 1], [80, 152, 0], [106, 147, 0], [132, 151, 1], [160, 146, 0],
                [188, 150, 0], [214, 147, 1], [240, 152, 0], [266, 148, 0], [294, 151, 1],
              ].map(([x, y, hand]) => (
                <g key={x}>
                  <circle cx={x} cy={y} r="7" />
                  <path d={`M${x - 13} 180 Q${x - 12} ${y + 9} ${x} ${y + 8} Q${x + 12} ${y + 9} ${x + 13} 180 Z`} />
                  {hand === 1 && (
                    <path
                      d={`M${x + 8} ${y + 10} L${x + 15} ${y - 14}`}
                      stroke="currentColor"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              ))}
            </g>
          </svg>
          <p className="lp-eyebrow mt-2 lp-ink-secondary" style={{ fontSize: '0.75rem', letterSpacing: '0.12em' }}>
            Illustration — a gathering on campus
          </p>

          {/* Column text */}
          <div className="grid grid-cols-2 gap-5 mt-4">
            <div className="lp-textlines" style={{ ['--lines-h' as string]: '5.6rem' }} />
            <div className="lp-textlines" style={{ ['--lines-h' as string]: '4.4rem' }} />
          </div>
        </div>
      </div>

      <RubberStamp
        ring="UNITED STUDENTS · NWSSU · "
        center="EST."
        sub={String(foundedYear)}
        size={112}
        tilt={-11}
        className="absolute -bottom-6 -right-3 sm:-right-6"
      />
    </div>
  );
}
