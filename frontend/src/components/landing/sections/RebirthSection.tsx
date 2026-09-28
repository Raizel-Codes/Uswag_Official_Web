import { useRef } from 'react';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import EngravedRule from '../ornaments/EngravedRule';
import MembershipCardMorph from '../artifacts/MembershipCardMorph';
import { FOUNDED_YEAR } from '../timeline.data';

const FEATURES = [
  {
    title: 'A signed digital membership card',
    body: 'Every approved member gets a QR card that can’t be copied or edited to pass as someone else.',
    icon: 'M4 5h16v14H4z M8 9h3v3H8z M13 9h3 M13 12h3 M8 15h8',
  },
  {
    title: 'Check-in by scan at every event',
    body: 'Officers scan cards at the door, so attendance is recorded fairly and in real time.',
    icon: 'M4 8V5h3 M17 5h3v3 M20 16v3h-3 M7 19H4v-3 M7 12h10',
  },
  {
    title: 'One home for news and events',
    body: 'Updates from our Facebook Page, the event calendar, and your own record — in one app you can install.',
    icon: 'M4 6h16 M4 12h16 M4 18h10',
  },
];

/** S4 — the hinge of the page: the archive resolves into the digital present. */
export default function RebirthSection() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);

  return (
    <section id="lp-rebirth" ref={ref} aria-labelledby="lp-rebirth-heading" data-era="present" className="lp-section">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-14 lg:gap-12 items-center">
        <div className="lg:col-span-6">
          <p className="lp-eyebrow text-primary" data-lp-reveal>
            Chapter III · The rebirth
          </p>
          <h2 id="lp-rebirth-heading" className="lp-h2 mt-4" data-lp-reveal>
            Reborn for the digital era.
          </h2>
          <EngravedRule className="mt-7 max-w-[220px] text-primary" />
          <p className="lp-body lp-ink-muted mt-7" data-lp-reveal>
            The causes haven’t changed since <span className="lp-lnum">{FOUNDED_YEAR}</span>. The way we organize around
            them has. USWAG now runs on tools built for how students actually live — on their phones.
          </p>
          <ul className="mt-9 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4" data-lp-reveal>
                <span className="shrink-0 w-11 h-11 rounded-[10px] bg-primary text-mist flex items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </span>
                <div>
                  <h3 className="font-display font-semibold text-[1.125rem] leading-snug">{f.title}</h3>
                  <p className="lp-small lp-ink-muted mt-1 max-w-[46ch]" style={{ fontWeight: 400, fontSize: '0.9375rem' }}>
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6" data-lp-reveal>
          <MembershipCardMorph foundedYear={FOUNDED_YEAR} />
        </div>
      </div>
    </section>
  );
}
