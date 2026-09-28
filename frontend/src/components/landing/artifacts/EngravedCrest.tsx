import { useId } from 'react';
import wreath from '@/assets/icons/laurel-wreath.svg';

interface EngravedCrestProps {
  size?: number;
  className?: string;
}

/**
 * The USWAG crest (laurel wreath, shield, open book) redrawn as a single-ink engraving for
 * the archival sections — the same geometry as assets/images/logo-uswag.svg, but Deep Forest
 * line-work and hatching on paper instead of gradients.
 *
 * The wreath reuses laurel-wreath.svg as a CSS mask filled with ink, so no geometry is
 * duplicated; the shield and book are drawn inline in the wreath's coordinate space.
 * Decorative (the organisation name is always present in adjacent text).
 */
export default function EngravedCrest({ size = 120, className = '' }: EngravedCrestProps) {
  const hatch = `crest-hatch-${useId().replace(/:/g, '')}`;
  const maskStyle = {
    WebkitMaskImage: `url(${wreath})`,
    maskImage: `url(${wreath})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  } as const;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size * (235 / 240) }}
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={{ ...maskStyle, backgroundColor: 'var(--lp-ink)' }} />
      <svg viewBox="180 135 240 235" className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--lp-ink)" strokeWidth="1.3" />
          </pattern>
        </defs>
        {/* Shield: hatched field, heavy outer line + fine inner line */}
        <path
          d="M300,168 L346,184 L346,246 Q346,286 300,308 Q254,286 254,246 L254,184 Z"
          fill={`url(#${hatch})`}
          stroke="var(--lp-ink)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M300,179 L336,192 L336,246 Q336,278 300,296 Q264,278 264,246 L264,192 Z"
          fill="none"
          stroke="var(--lp-ink)"
          strokeWidth="1.2"
        />
        {/* Open book: paper pages with ruled lines */}
        <g transform="translate(300,238)">
          <path d="M0,-3 Q-14,-12 -30,-8 L-30,17 Q-14,13 0,22 Z" fill="var(--lp-parchment)" stroke="var(--lp-ink)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M0,-3 Q14,-12 30,-8 L30,17 Q14,13 0,22 Z" fill="var(--lp-parchment)" stroke="var(--lp-ink)" strokeWidth="2" strokeLinejoin="round" />
          <g stroke="var(--lp-ink)" strokeWidth="1.1" strokeLinecap="round" opacity="0.7">
            <line x1="-24" y1="0" x2="-7" y2="-2" />
            <line x1="-24" y1="6" x2="-7" y2="4" />
            <line x1="-24" y1="12" x2="-7" y2="10" />
            <line x1="7" y1="-2" x2="24" y2="0" />
            <line x1="7" y1="4" x2="24" y2="6" />
            <line x1="7" y1="10" x2="24" y2="12" />
          </g>
        </g>
      </svg>
    </div>
  );
}
