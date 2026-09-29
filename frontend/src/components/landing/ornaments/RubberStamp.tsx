import { useId } from 'react';

interface RubberStampProps {
  /** Text set around the ring (keep it short — about 28 characters). */
  ring: string;
  /** Large center word. */
  center: string;
  /** Small line under the center word. */
  sub?: string;
  size?: number;
  /** Static tilt in degrees — stamps are never applied perfectly straight. */
  tilt?: number;
  className?: string;
  /** Ink colour; Primary Green unless the stamp belongs to the archive (the prequel's 2010 stamp is sepia). */
  ink?: string;
}

/**
 * Inked rubber stamp in Primary Green (6.49:1 on parchment), roughened with a light
 * displacement filter so the edges look pressed rather than vector-perfect. Decorative:
 * whatever it says must also exist in the surrounding real text.
 */
export default function RubberStamp({
  ring,
  center,
  sub,
  size = 132,
  tilt = -8,
  className = '',
  ink = 'var(--color-primary)',
}: RubberStampProps) {
  const uid = useId().replace(/:/g, '');
  const ringPath = `stamp-ring-${uid}`;
  const rough = `stamp-rough-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      className={className}
      style={{ transform: `rotate(${tilt}deg)`, color: ink }}
      aria-hidden="true"
    >
      <defs>
        <path id={ringPath} d="M70,70 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0" />
        <filter id={rough} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
        </filter>
      </defs>
      <g filter={`url(#${rough})`} fill="none" stroke="currentColor" opacity="0.88">
        <circle cx="70" cy="70" r="64" strokeWidth="3" />
        <circle cx="70" cy="70" r="58" strokeWidth="1" />
        <circle cx="70" cy="70" r="37" strokeWidth="1" />
        <text
          fill="currentColor"
          stroke="none"
          fontFamily="Lora, serif"
          fontWeight={600}
          fontSize="10.5"
          letterSpacing="2.4"
        >
          <textPath href={`#${ringPath}`} startOffset="0">
            {ring}
          </textPath>
        </text>
        <text
          x="70"
          y={sub ? 73 : 76}
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontFamily="Lora, serif"
          fontWeight={600}
          fontSize="17"
          letterSpacing="2"
        >
          {center}
        </text>
        {sub && (
          <text
            x="70"
            y="88"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontFamily="Inter, sans-serif"
            fontWeight={600}
            fontSize="8"
            letterSpacing="1.6"
          >
            {sub}
          </text>
        )}
      </g>
    </svg>
  );
}
