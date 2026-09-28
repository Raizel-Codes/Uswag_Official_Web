type Corner = 'tl' | 'tr' | 'bl' | 'br';

interface CornerFrameProps {
  variant?: 'sage' | 'primary';
  corners?: Corner[];
  size?: number;
  className?: string;
}

const POSITION: Record<Corner, string> = {
  tl: 'top-0 left-0',
  tr: 'top-0 right-0',
  bl: 'bottom-0 left-0',
  br: 'bottom-0 right-0',
};

const ROTATION: Record<Corner, number> = { tl: 0, tr: 90, br: 180, bl: 270 };

/**
 * Corner-bracket frame accent (the therecord.institute-style viewfinder-corner motif) —
 * absolutely positioned on a `relative` parent, drawn from one L-shaped path rotated per
 * corner. Used selectively on card/quote elements, not as a site-wide border replacement.
 */
export default function CornerFrame({
  variant = 'sage',
  corners = ['tl', 'br'],
  size = 20,
  className = '',
}: CornerFrameProps) {
  const color = variant === 'primary' ? '#2E5B41' : '#98CBB0';

  return (
    <>
      {corners.map((corner) => (
        <svg
          key={corner}
          viewBox="0 0 20 20"
          width={size}
          height={size}
          className={`absolute pointer-events-none ${POSITION[corner]} ${className}`}
          style={{ transform: `rotate(${ROTATION[corner]}deg)` }}
          aria-hidden="true"
        >
          <path d="M1,10 L1,3 Q1,1 3,1 L10,1" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ))}
    </>
  );
}
