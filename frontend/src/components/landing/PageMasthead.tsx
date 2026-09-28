import { useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import EngravedCrest from './artifacts/EngravedCrest';
import { FOUNDED_YEAR } from './timeline.data';
import { chapterFor } from './chapters';

interface PageMastheadProps {
  /** Short line above the headline. */
  eyebrow: string;
  /** Headline; may contain an <em> for the italic Primary accent, as on the front page. */
  title: ReactNode;
  lead?: ReactNode;
  /** Actions or an aside rendered under the lead. */
  children?: ReactNode;
  /** Overrides the "Section N" label for pages outside the numbered chapters (e.g. "Appendix"). */
  sectionLabel?: string;
}

/**
 * The archival page-head shared by every inner public page: the same "The USWAG Record"
 * nameplate as the front page, carrying this page's section numeral, on grained parchment.
 * It slides under the fixed Header exactly like the front-page hero so there's no Mist strip.
 */
export default function PageMasthead({ eyebrow, title, lead, children, sectionLabel }: PageMastheadProps) {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  const { pathname } = useLocation();
  const { chapter } = chapterFor(pathname);
  const label = sectionLabel ?? (chapter?.numeral ? `Section ${chapter.numeral}` : '');

  return (
    <header
      ref={ref}
      data-era="past"
      className="lp-section lp-grain -mt-[68px] md:-mt-[76px] pt-[calc(68px+2rem)] md:pt-[calc(76px+2.5rem)]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div data-lp-reveal>
          <div className="lp-double-rule" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3">
            <p className="lp-eyebrow lp-ink-secondary lp-onum hidden sm:block">Est. {FOUNDED_YEAR}</p>
            <p className="lp-masthead text-center col-start-2">The USWAG Record</p>
            <p className="lp-eyebrow lp-ink-secondary text-right hidden sm:block">{label}</p>
          </div>
          <div className="h-px bg-[var(--lp-ink)]" />
          {label && <p className="lp-eyebrow lp-ink-secondary text-center mt-2.5 sm:hidden">{label}</p>}
        </div>

        <div className="mt-12 md:mt-14 grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-9">
            <div className="flex items-center gap-3 mb-5" data-lp-reveal>
              <EngravedCrest size={40} />
              <p className="lp-eyebrow lp-ink-secondary">{eyebrow}</p>
            </div>
            <h1 className="lp-display" style={{ fontSize: 'clamp(2.5rem, 5.2vw, 4.5rem)' }} data-lp-reveal>
              {title}
            </h1>
            {lead && (
              <p className="lp-body lp-ink-secondary mt-6" data-lp-reveal>
                {lead}
              </p>
            )}
            {children && (
              <div className="mt-8" data-lp-reveal>
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
