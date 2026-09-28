import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/motion';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import EngravedRule from '../ornaments/EngravedRule';
import { TIMELINE } from '../timeline.data';

ensureGsapRegistered();

/**
 * S3 — the years in between. A ledger timeline whose spine fills from sepia to Primary as the
 * visitor scrolls through it (transform: scaleY only). Placeholder entries are clearly badged
 * until the adviser confirms them — see timeline.data.ts.
 */
export default function YearsTimeline({ eyebrow = 'Chapter II' }: { eyebrow?: string }) {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        '.lp-timeline__progress',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.lp-timeline', start: 'top 70%', end: 'bottom 55%', scrub: 0.5 },
        }
      );
    },
    { scope: ref }
  );

  return (
    <section id="lp-years" ref={ref} aria-labelledby="lp-years-heading" data-era="mid" className="lp-section lp-grain lp-grain--fade">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12">
        <header className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <p className="lp-eyebrow lp-ink-caption" data-lp-reveal>
            {eyebrow}
          </p>
          <h2 id="lp-years-heading" className="lp-h2 mt-4" data-lp-reveal>
            The years in between
          </h2>
          <EngravedRule className="mt-7 max-w-[220px]" />
          <p className="lp-body lp-ink-secondary mt-7" data-lp-reveal>
            Every officer term, campaign, and member added a page. This is the ledger of how USWAG carried its causes
            forward.
          </p>
        </header>

        <div className="lp-timeline lg:col-span-7 lg:col-start-6">
          <span className="lp-timeline__spine" aria-hidden="true" />
          <span className="lp-timeline__progress" aria-hidden="true" />
          <ol className="space-y-8">
          {TIMELINE.map((entry) => (
            <li
              key={entry.id}
              className={`relative ${entry.confirmed ? 'lp-timeline__item--confirmed' : 'lp-timeline__item--pending'}`}
              data-lp-reveal
            >
              <span className="lp-timeline__marker" aria-hidden="true" />
              <div className="lp-timeline__card p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {entry.dateTime ? (
                    <time dateTime={entry.dateTime} className="font-display text-[2rem] leading-none font-medium lp-onum text-primary">
                      {entry.label}
                    </time>
                  ) : (
                    <span className="font-display text-[2rem] leading-none font-medium lp-onum lp-ink-caption">{entry.label}</span>
                  )}
                  {!entry.confirmed && <span className="lp-badge-pending">Pending confirmation</span>}
                </div>
                <h3 className="lp-h3">{entry.title}</h3>
                <p className="lp-body lp-ink-secondary mt-2" style={{ fontSize: '1rem' }}>{entry.body}</p>
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
