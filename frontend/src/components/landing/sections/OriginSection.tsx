import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import EngravedRule from '../ornaments/EngravedRule';
import FoundingFlyer from '../artifacts/FoundingFlyer';
import { FOUNDED_YEAR } from '../timeline.data';

// The organisation's own mark (confirmed 2026-09-28) — shown as an archival print.
const HERITAGE_LOGO_SRC = '/images/hero-cover.jpg';

/**
 * S2 — where it began. The Preamble is quoted verbatim from
 * docs/01 - USWAG Constitution and Bylaws.pdf; keep it in sync if the Constitution is amended.
 */
export default function OriginSection() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);

  return (
    <section id="lp-origin" ref={ref} aria-labelledby="lp-origin-heading" data-era="past" className="lp-section lp-grain">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-14 lg:gap-12 items-start">
        <div className="lg:col-span-7">
          <p className="lp-eyebrow lp-ink-caption lp-onum" data-lp-reveal>
            Chapter I · {FOUNDED_YEAR}
          </p>
          <h2 id="lp-origin-heading" className="lp-h2 mt-4" data-lp-reveal>
            Where it began
          </h2>
          <EngravedRule className="mt-7 max-w-[260px]" />

          <figure className="mt-9" data-lp-reveal>
            <blockquote
              className="lp-body lp-dropcap font-display"
              style={{ fontSize: '1.125rem', lineHeight: 1.8 }}
              cite="/bylaws"
            >
              We, the members of USWAG — United Students Working for Advocacy and Growth, bound by our collective desire
              to uphold youth voice, promote mental health and wellness, and lead environmental advocacy, hereby establish
              this Constitution and By-Laws. Inspired by our duty as student leaders and changemakers, we dedicate
              ourselves to creating inclusive spaces, raising awareness, and fostering sustainable and participatory
              leadership for the betterment of the student body and our communities.
            </blockquote>
            <figcaption className="lp-eyebrow lp-ink-secondary mt-6 flex items-center gap-3">
              <span className="h-px w-8 bg-current" aria-hidden="true" />
              Preamble, USWAG Constitution &amp; By-Laws
            </figcaption>
          </figure>

          <div className="mt-8" data-lp-reveal>
            <Link to="/bylaws" className="lp-link">
              Read the full Constitution <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Archive: founding-era flyer with the USWAG mark pinned over it */}
        <div className="lg:col-span-5 relative pb-16 sm:pb-10 lg:pt-10" data-lp-reveal>
          <FoundingFlyer foundedYear={FOUNDED_YEAR} className="max-w-[270px] sm:max-w-[330px] ml-0 sm:ml-6" />

          <figure
            className="lp-print absolute right-0 sm:right-4 lg:-right-2 bottom-0 w-[160px] sm:w-[230px]"
            style={{ transform: 'rotate(4deg)' }}
            data-lp-develop
            tabIndex={0}
          >
            <span className="lp-print__corner left-0 top-0" aria-hidden="true" />
            <img
              src={HERITAGE_LOGO_SRC}
              alt="The USWAG graffiti-style wordmark in green"
              width={900}
              height={860}
              loading="lazy"
              decoding="async"
            />
            <figcaption className="lp-dateline lp-ink-secondary mt-2.5" style={{ fontSize: '0.875rem', lineHeight: 1.3 }}>
              The mark we wear — the USWAG logo
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
