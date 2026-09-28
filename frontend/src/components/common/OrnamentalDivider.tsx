interface OrnamentalDividerProps {
  /** Which token the divider renders in — sage for use on dark/forest surfaces, primary for light ones. */
  variant?: 'sage' | 'primary';
  className?: string;
}

const LEAF_D =
  'M0,-6 C0.8,-1.5 1.5,-0.8 6,0 C1.5,0.8 0.8,1.5 0,6 C-0.8,1.5 -1.5,0.8 -6,0 C-1.5,-0.8 -0.8,-1.5 0,-6 Z';
const DIAMOND_D = 'M0,-4 L4,0 L0,4 L-4,0 Z';

/**
 * The small "◇─✦─•─✦─◇" line-and-diamond flourish used under officer
 * names/titles in the design reference — for section eyebrows in explicitly
 * constitutional/institutional contexts (About's Preamble, Officers' hero).
 * Not intended for general/site-wide use.
 */
export default function OrnamentalDivider({ variant = 'sage', className = '' }: OrnamentalDividerProps) {
  const color = variant === 'primary' ? '#2E5B41' : '#98CBB0';

  return (
    <svg viewBox="0 0 200 16" className={`w-40 h-4 ${className}`} aria-hidden="true">
      <g fill={color}>
        <path d={DIAMOND_D} transform="translate(8,8)" />
        <path d={DIAMOND_D} transform="translate(192,8)" />
        <path d={LEAF_D} transform="translate(60,8) rotate(90)" />
        <path d={LEAF_D} transform="translate(140,8) rotate(90)" />
        <circle cx="100" cy="8" r="2.5" />
      </g>
      <g stroke={color} strokeWidth="1">
        <line x1="14" y1="8" x2="53" y2="8" />
        <line x1="67" y1="8" x2="93" y2="8" />
        <line x1="107" y1="8" x2="133" y2="8" />
        <line x1="147" y1="8" x2="186" y2="8" />
      </g>
    </svg>
  );
}
