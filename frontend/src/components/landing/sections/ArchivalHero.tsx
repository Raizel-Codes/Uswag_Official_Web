import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import NewspaperClipping from '../artifacts/NewspaperClipping';
import EngravedCrest from '../artifacts/EngravedCrest';
import { FOUNDED_YEAR } from '../timeline.data';

function toRoman(n: number) {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

interface ArchivalHeroProps {
  /** Live count of serving officers; undefined/0 hides the stat. */
  officerCount?: number;
  /** Live count of upcoming events; undefined/0 hides the stat. */
  upcomingCount?: number;
}

/**
 * S1 — the archival hero, set as the front page of "The USWAG Record".
 * The LCP element is the <h1> text; nothing raster sits above the fold.
 */
export default function ArchivalHero({ officerCount, upcomingCount }: ArchivalHeroProps) {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);

  const year = new Date().getFullYear();
  const volume = toRoman(year - FOUNDED_YEAR + 1);
  const years = year - FOUNDED_YEAR;

  const stats = [
    { value: String(FOUNDED_YEAR), label: 'Founded' },
    officerCount ? { value: String(officerCount), label: officerCount === 1 ? 'Serving officer' : 'Serving officers' } : null,
    upcomingCount ? { value: String(upcomingCount), label: upcomingCount === 1 ? 'Upcoming event' : 'Upcoming events' } : null,
  ].filter((s): s is { value: string; label: string } => s !== null);

  return (
    <section
      ref={ref}
      aria-labelledby="lp-hero-heading"
      data-era="past"
      className="lp-section lp-grain -mt-[68px] md:-mt-[76px] pt-[calc(68px+2.5rem)] md:pt-[calc(76px+3rem)]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Masthead */}
        <div data-lp-reveal>
          <div className="lp-double-rule" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3.5">
            <p className="lp-eyebrow lp-ink-secondary lp-onum hidden sm:block">
              Vol. {volume} · Est. {FOUNDED_YEAR}
            </p>
            <p className="lp-nameplate text-center col-start-2">The USWAG Record</p>
            <p className="lp-eyebrow lp-ink-secondary text-right hidden sm:block">Calbayog City, Samar</p>
          </div>
          <div className="h-px bg-[var(--lp-ink)]" />
          <p className="lp-eyebrow lp-ink-secondary lp-onum text-center mt-2.5 sm:hidden">
            Vol. {volume} · Est. {FOUNDED_YEAR}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center mt-12 md:mt-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4 mb-6" data-lp-reveal>
              <EngravedCrest size={52} />
              <p className="lp-eyebrow lp-ink-secondary">
                Northwest Samar State University
                <br />
                <span className="lp-onum">Since {FOUNDED_YEAR}</span>
              </p>
            </div>

            <h1 id="lp-hero-heading" className="lp-display" data-lp-reveal>
              The record began in <span className="lp-onum">{FOUNDED_YEAR}</span>.{' '}
              <em className="text-primary">The next chapter is yours.</em>
            </h1>

            <p className="lp-body lp-ink-secondary mt-7" data-lp-reveal>
              USWAG — United Students Working for Advocacy and Growth — has stood for youth voice, mental health, and
              environmental leadership at NwSSU for <span className="lp-onum">{years}</span> years. Now it steps into a new
              era: digital, open, and built by its members.
            </p>

            <div className="flex flex-wrap gap-3 mt-9" data-lp-reveal>
              <Link to="/join" className="lp-btn lp-btn--primary">
                Become a member <span className="lp-btn__arrow" aria-hidden="true">→</span>
              </Link>
              <a href="#lp-origin" className="lp-btn lp-btn--ghost">
                Read our story <span className="lp-btn__arrow" aria-hidden="true">↓</span>
              </a>
            </div>

            <dl className="flex flex-wrap mt-12 border-t border-[rgb(20_39_24/0.2)]" data-lp-reveal>
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex flex-col-reverse pt-5 pr-6 mr-6 ${i < stats.length - 1 ? 'border-r border-[rgb(20_39_24/0.15)]' : ''}`}
                >
                  <dt className="lp-eyebrow lp-ink-secondary mt-1.5">{s.label}</dt>
                  <dd className="font-display text-[1.75rem] md:text-[2rem] font-medium leading-none lp-onum">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5 px-2 sm:px-8 lg:px-0" data-lp-reveal>
            <NewspaperClipping foundedYear={FOUNDED_YEAR} className="max-w-[440px] mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
