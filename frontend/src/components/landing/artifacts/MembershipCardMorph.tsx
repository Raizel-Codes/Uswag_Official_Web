import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/motion';
import RubberStamp from '../ornaments/RubberStamp';
import DigitalCardFace from './DigitalCardFace';

ensureGsapRegistered();

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
        <DigitalCardFace />
      </div>
      <p className="lp-small lp-ink-muted text-center mt-4" aria-hidden="true">
        Illustration — real member QR codes are signed and shown only in the member portal.
      </p>
    </div>
  );
}
