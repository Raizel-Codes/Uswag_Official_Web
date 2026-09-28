import { useMemo } from 'react';
import logoOnDark from '@/assets/images/logo-uswag-on-dark.svg';
import { academicYearLabel } from '../academicYear';

const QR_SIZE = 25;

/**
 * Deterministic QR-*looking* module grid with the three finder patterns. It is NOT a real or
 * scannable code — real member QRs are signed server-side (qr.service.ts) and only ever shown
 * to their owner in the member portal. This is illustration only.
 */
function useDecorativeQr() {
  return useMemo(() => {
    let s = 20100;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8);
    const cells: [number, number][] = [];
    for (let y = 0; y < QR_SIZE; y++) for (let x = 0; x < QR_SIZE; x++) if (!inFinder(x, y) && rand() > 0.52) cells.push([x, y]);
    return cells;
  }, []);
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" fill="var(--color-deep)" />
      <rect x="1" y="1" width="5" height="5" fill="var(--color-mist)" />
      <rect x="2" y="2" width="3" height="3" fill="var(--color-deep)" />
    </g>
  );
}

interface DigitalCardFaceProps {
  name?: string;
  className?: string;
}

/**
 * Today's digital membership card, as an illustration (decorative QR — see useDecorativeQr).
 * Absolutely fills an `.lp-card-stage`. Used by MembershipCardMorph and the Login canvas.
 */
export default function DigitalCardFace({ name = 'Your name here', className = '' }: DigitalCardFaceProps) {
  const qr = useDecorativeQr();
  const ay = academicYearLabel();
  return (
    <div className={`lp-card-face lp-card-face--digital p-5 sm:p-6 flex flex-col lp-on-dark ${className}`}>
      <span className="lp-card-label hidden lp-eyebrow mb-2" style={{ color: 'var(--color-sage)' }}>Now</span>
      <div className="flex items-center gap-3">
        <img src={logoOnDark} alt="" width={40} height={32} className="shrink-0" />
        <div>
          <p className="font-display font-semibold tracking-[0.12em] text-[0.9375rem]">USWAG</p>
          <p className="text-[0.75rem] font-medium" style={{ color: 'var(--color-sage)' }}>
            Digital membership · A.Y. {ay}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-sage)' }}>
            Member
          </p>
          <p className="font-display text-[1.125rem] font-medium leading-tight">{name}</p>
          <p className="text-[0.75rem] text-mist/80 lp-lnum">Status · Active</p>
        </div>
        <div className="lp-qr-frame p-1.5 shrink-0">
          <svg viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`} width="76" height="76" shapeRendering="crispEdges">
            <rect x="-1" y="-1" width={QR_SIZE + 2} height={QR_SIZE + 2} fill="var(--color-mist)" />
            {qr.map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--color-deep)" />
            ))}
            <Finder x={0} y={0} />
            <Finder x={QR_SIZE - 7} y={0} />
            <Finder x={0} y={QR_SIZE - 7} />
          </svg>
        </div>
      </div>
    </div>
  );
}
