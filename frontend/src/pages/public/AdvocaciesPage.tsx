import { useRef } from 'react';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import LandingCTA from '@/components/landing/sections/LandingCTA';

const ADVOCACIES = [
  {
    id: 'youth',
    num: '01',
    icon: 'M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z',
    title: 'Youth Voice & Participation',
    subtitle: 'Governance & Civic Leadership',
    // Art. II §2(a), verbatim
    article: 'Promoting meaningful student involvement in decision-making, governance, and civic leadership.',
    desc: 'We push for meaningful student involvement in decision-making, governance, and civic leadership — not token representation, but a real seat at the table for how this university is run. Every student has a stake in NwSSU’s direction, and USWAG ensures that stake is recognized.',
    programs: ['Student Leaders’ Forums', 'Voter Education Campaigns', 'Policy Dialogues with Admin', 'Parliamentary Training', 'Youth Leadership Workshops', 'Civic Rights Orientations'],
    stat: { value: '4+', label: 'Forums per semester' },
  },
  {
    id: 'wellness',
    num: '02',
    icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    title: 'Mental Health & Wellness',
    subtitle: 'Peer Support & Literacy',
    // Art. II §2(b), verbatim
    article: 'Advancing mental health literacy, peer support systems, and wellness campaigns across the university.',
    desc: 'We build mental health literacy and peer support systems across campus, so wellness conversations happen before a crisis does — not after. Mental health is as integral to academic success as any course requirement.',
    programs: ['Peer Support Training', 'Wellness Fairs & Workshops', 'Stress De-briefing Sessions', 'Safe Space Circles', 'Mental Health Awareness Month', 'Campus Counselor Partnerships'],
    stat: { value: '200+', label: 'Students reached per semester' },
  },
  {
    id: 'environment',
    num: '03',
    icon: 'M12 3v18m0-18c-3 0-8 2-8 8s5 8 8 8m0-16c3 0 8 2 8 8s-5 8-8 8',
    title: 'Environmental Leadership',
    subtitle: 'Sustainability & Stewardship',
    // Art. II §2(c), verbatim
    article: 'Leading sustainability efforts and environmental stewardship initiatives among the student body.',
    desc: 'We lead sustainability efforts and hands-on environmental programs, treating stewardship of our campus and coastline as a student responsibility, not someone else’s job. From barangay to coastline, we show up.',
    programs: ['Coastal Cleanup Drives', 'Tree Planting Initiatives', 'Zero-Waste Campus Campaigns', 'Upcycling Workshops', 'Environmental Awareness Talks', 'Campus Greening Projects'],
    stat: { value: '500+', label: 'Seedlings planted this year' },
  },
];

function Mandates() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);

  return (
    <section ref={ref} aria-labelledby="adv-mandates" data-era="mid" className="lp-section" data-lp-era-start>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <SectionHeading
          id="adv-mandates"
          tone="past"
          eyebrow="Article II, Section 2"
          title="Three causes. Every program answers to them."
          lead="Every USWAG program, fund disbursement, and event must answer to at least one of them."
        />

        <div className="mt-20 space-y-24 lg:space-y-32">
          {ADVOCACIES.map((a, idx) => {
            const flip = idx % 2 === 1;
            return (
              <article
                key={a.id}
                id={a.id}
                aria-labelledby={`${a.id}-title`}
                className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start scroll-mt-28"
                data-lp-era-end={idx === ADVOCACIES.length - 1 ? '' : undefined}
              >
                {/* Title side */}
                <div className={`lg:col-span-5 relative ${flip ? 'lg:order-2 lg:col-start-8' : ''}`} data-lp-reveal>
                  <span
                    className="absolute -top-10 -left-2 text-[8rem] sm:text-[10rem] lp-outline-num lp-outline-num--light"
                    aria-hidden="true"
                  >
                    {a.num}
                  </span>
                  <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.1" className="lp-draw text-primary relative" aria-hidden="true">
                    <path d={a.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="lp-eyebrow text-primary mt-6 relative lp-lnum">
                    Advocacy {a.num} · {a.subtitle}
                  </p>
                  <h3 id={`${a.id}-title`} className="lp-h2 mt-3 relative" style={{ fontSize: 'clamp(1.875rem, 3.2vw, 2.75rem)' }}>
                    {a.title}
                  </h3>
                  <figure className="lp-doc mt-7 relative">
                    <blockquote className="font-display italic text-[1.0625rem] leading-[1.6]">“{a.article}”</blockquote>
                    <figcaption className="lp-eyebrow lp-ink-secondary mt-3">Constitution, Art. II §2</figcaption>
                  </figure>
                </div>

                {/* Content side */}
                <div className={`lg:col-span-6 ${flip ? 'lg:order-1' : 'lg:col-start-7'}`}>
                  <p className="lp-body lp-ink-muted" style={{ fontSize: '1.125rem', lineHeight: 1.8 }} data-lp-reveal>
                    {a.desc}
                  </p>

                  <div className="lp-card p-6 sm:p-7 mt-8" data-lp-reveal>
                    <h4 className="lp-eyebrow text-primary">Key initiatives &amp; programs</h4>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-5">
                      {a.programs.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-[0.9375rem] font-medium">
                          <span className="mt-[0.45rem] w-2 h-2 rotate-45 bg-primary shrink-0" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-baseline gap-4 mt-8 pl-5 border-l-2 border-primary" data-lp-reveal>
                    <span className="font-display text-[2.5rem] leading-none font-medium lp-lnum">{a.stat.value}</span>
                    <span className="lp-eyebrow lp-ink-muted">{a.stat.label}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function AdvocaciesPage() {
  return (
    <PublicPage>
      <PageMasthead
        eyebrow="Our mandates"
        title={
          <>
            Three pillars of <em className="text-primary">action.</em>
          </>
        }
        lead="As defined by Article II of the USWAG Constitution, every organizational program and initiative must align with one of our three core advocacies."
      >
        <nav aria-label="Jump to an advocacy" className="flex flex-wrap gap-2">
          {ADVOCACIES.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="lp-chip inline-flex items-center">
              {a.num} · {a.title}
            </a>
          ))}
        </nav>
      </PageMasthead>
      <Mandates />
      <LandingCTA
        id="adv-cta"
        eyebrow="Turn a cause into action"
        title="Ready to step up?"
        body="Join USWAG and put your time behind the causes you care about. Membership is open to all NwSSU students."
        secondary={{ to: '/events', label: 'See upcoming events' }}
      />
    </PublicPage>
  );
}
