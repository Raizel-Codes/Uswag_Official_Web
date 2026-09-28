import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import EngravedRule from '../ornaments/EngravedRule';

/** S6 — the closing invitation, plus the homepage-only mobile sticky join bar. */
export default function LandingCTA() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);

  return (
    <>
      <section ref={ref} aria-labelledby="lp-cta-heading" data-era="present" className="lp-section pt-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div
            className="lp-on-dark relative overflow-hidden rounded-[12px] bg-primary text-mist p-[clamp(2rem,6vw,5rem)] grid md:grid-cols-[1.4fr_1fr] gap-10 md:gap-16 items-center"
            data-lp-reveal
          >
            {/* Concentric arcs echo the timeline's diamonds — decorative */}
            <svg className="absolute -top-24 -right-24 w-[340px] h-[340px] text-sage/25 pointer-events-none" viewBox="0 0 340 340" fill="none" aria-hidden="true">
              <circle cx="170" cy="170" r="168" stroke="currentColor" />
              <circle cx="170" cy="170" r="120" stroke="currentColor" />
              <circle cx="170" cy="170" r="72" stroke="currentColor" />
            </svg>

            <div className="relative">
              {/* Mist on Primary 6.64:1 — Sage on Primary (4.28) fails for small text */}
              <p className="lp-eyebrow text-mist">Membership · Open to every NwSSU student</p>
              <h2 id="lp-cta-heading" className="lp-h2 mt-4 text-mist">
                Write the next chapter.
              </h2>
              <EngravedRule className="mt-7 max-w-[200px] text-sage" reveal={false} />
              <p className="lp-body mt-7 text-mist">
                The record so far was written by students who kept showing up. Add your name to it — and help decide what
                USWAG stands for next.
              </p>
            </div>

            <div className="relative flex flex-col items-start md:items-end gap-4">
              <Link to="/join" className="lp-btn lp-btn--light w-full md:w-auto">
                Apply for membership <span className="lp-btn__arrow" aria-hidden="true">→</span>
              </Link>
              <Link to="/bylaws" className="lp-link lp-link--light">
                Read the Constitution <span aria-hidden="true">→</span>
              </Link>
              <p className="lp-small text-mist">A valid NwSSU student ID is required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky bar — homepage only (this component renders only on /) */}
      <div className="lp-sticky md:hidden fixed bottom-0 inset-x-0 z-40">
        <Link to="/join" className="lp-btn lp-btn--primary w-full rounded-[12px]">
          Join USWAG
        </Link>
      </div>
      <div className="md:hidden h-[76px]" aria-hidden="true" />
    </>
  );
}
