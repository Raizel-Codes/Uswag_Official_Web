import { useMemo, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/motion';
import logoOnDark from '@/assets/images/logo-uswag-on-dark.svg';
import RubberStamp from '../ornaments/RubberStamp';

ensureGsapRegistered();

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

/** Academic year label for "today", e.g. "2026–2027" (NwSSU A.Y. starts around August). */
function currentAcademicYear(now = new Date()) {
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}–${start + 1}`;
}

interface MembershipCardMorphProps {
  foundedYear: number;
  className?: string;
}

/**
 * The page's hinge: a typewritten paper membership card wipes away as you scroll, revealing the
 * signed-QR digital card underneath (clip-path on one promoted layer; nothing is pinned).
 * Reduced motion: landing.css lays both faces out side by side, labelled Then / Now.
 *
 * Both faces are aria-hidden; the visually-hidden description states what the picture shows.
 */
export default function MembershipCardMorph({ foundedYear, className = '' }: MembershipCardMorphProps) {
  const root = useRef<HTMLDivElement>(null);
  const qr = useDecorativeQr();
  const ay = currentAcademicYear();

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const paper = root.current.querySelector('.lp-card-face--paper');
      const digital = root.current.querySelector('.lp-card-face--digital');
      const tl = gsap.timeline({
        // Starts once the whole paper card is visible and completes while the card sits
        // mid-screen, so visitors actually see both states rather than a half-wiped card.
        scrollTrigger: { trigger: root.current, start: 'center 72%', end: 'center 42%', scrub: 0.6 },
      });
      tl.fromTo(paper, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', ease: 'none' }, 0).fromTo(
        digital,
        { scale: 0.96, rotate: -1.5 },
        { scale: 1, rotate: 0, ease: 'none' },
        0
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} className={`lp-card-morph ${className}`}>
      <p className="lp-sr-only">
        Illustration: a paper USWAG membership card from {foundedYear} transforming into today&apos;s digital
        membership card with a signed QR code.
      </p>
      <div className="lp-card-stage mx-auto" aria-hidden="true">
        {/* THEN — paper card */}
        <div className="lp-card-face lp-card-face--paper lp-paper p-5 sm:p-6 flex flex-col">
          <span className="lp-card-label hidden lp-eyebrow lp-ink-secondary mb-2">Then</span>
          <div className="flex items-start justify-between">
            <div>
              <p className="lp-masthead" style={{ fontSize: '0.8125rem' }}>USWAG</p>
              <p className="lp-eyebrow lp-ink-secondary mt-1.5">Membership card</p>
            </div>
            <p className="lp-dateline lp-onum lp-ink-secondary" style={{ fontSize: '0.9375rem' }}>No. ____</p>
          </div>
          <div className="mt-auto space-y-3 pr-24">
            {['Name', 'College', 'School year'].map((f) => (
              <div key={f} className="flex items-end gap-2">
                <span className="lp-dateline lp-ink-secondary shrink-0" style={{ fontSize: '0.875rem' }}>
                  {f}
                </span>
                <span className="flex-1 border-b border-dotted" style={{ borderColor: 'var(--lp-sepia)' }} />
              </div>
            ))}
          </div>
          <RubberStamp ring="UNITED STUDENTS · NWSSU · " center="MEMBER" sub={String(foundedYear)} size={96} tilt={9} className="absolute right-4 bottom-4" />
        </div>

        {/* NOW — digital card */}
        <div className="lp-card-face lp-card-face--digital p-5 sm:p-6 flex flex-col lp-on-dark">
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
              <p className="font-display text-[1.125rem] font-medium leading-tight">Your name here</p>
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
      </div>
      <p className="lp-small lp-ink-muted text-center mt-4" aria-hidden="true">
        Illustration — real member QR codes are signed and shown only in the member portal.
      </p>
    </div>
  );
}
