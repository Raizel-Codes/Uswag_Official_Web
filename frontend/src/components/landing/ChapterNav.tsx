import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import EngravedRule from './ornaments/EngravedRule';
import { chapterFor } from './chapters';

/**
 * "Continue the record" — previous / next page links at the foot of every public page, in
 * Header nav order, so the site reads as one continuous document instead of separate tabs.
 */
export default function ChapterNav() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  const { pathname } = useLocation();
  const { prev, next } = chapterFor(pathname);
  if (!prev && !next) return null;

  return (
    <nav ref={ref} aria-label="Continue reading" data-era="present" className="lp-section pt-4">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <EngravedRule className="max-w-[320px] mx-auto text-primary" />
        <p className="lp-eyebrow text-center text-primary mt-5" data-lp-reveal>
          Continue the record
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {prev ? (
            <Link to={prev.path} className="lp-chapter-link group" data-lp-reveal>
              <span className="lp-eyebrow lp-ink-muted">
                <span aria-hidden="true">← </span>
                Previous{prev.numeral && <> · Section {prev.numeral}</>}
              </span>
              <span className="font-display text-[1.5rem] leading-tight mt-2 block">{prev.title}</span>
              <span className="lp-small lp-ink-muted mt-1 block" style={{ fontWeight: 400 }}>{prev.teaser}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next && (
            <Link to={next.path} className="lp-chapter-link lp-chapter-link--next group sm:text-right" data-lp-reveal>
              <span className="lp-eyebrow text-primary">
                Next · Section {next.numeral}
                <span aria-hidden="true"> →</span>
              </span>
              <span className="font-display text-[1.5rem] leading-tight mt-2 block">{next.title}</span>
              <span className="lp-small lp-ink-muted mt-1 block" style={{ fontWeight: 400 }}>{next.teaser}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
