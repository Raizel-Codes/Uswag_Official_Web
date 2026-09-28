import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import type { OfficerPublic } from '@/services/officerService';
import type { UswagEvent } from '@/types/event.types';
import type { NewsPost } from '@/types/post.types';
import EngravedRule from '../ornaments/EngravedRule';
import PostCard from '../PostCard';

// The three purposes of Art. II §1 of the Constitution.
const MANDATES = [
  {
    num: '01',
    title: 'Youth Voice & Participation',
    desc: 'Meaningful student involvement in decision-making, governance, and civic leadership — a real seat at the table, not token representation.',
    icon: 'M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z',
  },
  {
    num: '02',
    title: 'Mental Health & Wellness',
    desc: 'Mental health literacy and peer support across campus, so wellness conversations happen before a crisis does — not after.',
    icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  },
  {
    num: '03',
    title: 'Environmental Leadership',
    desc: 'Sustainability efforts and hands-on environmental programs, treating stewardship of our campus and coastline as a student responsibility.',
    icon: 'M12 3v18m0-18c-3 0-8 2-8 8s5 8 8 8m0-16c3 0 8 2 8 8s-5 8-8 8',
  },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);
}

function positionLabel(p: string) {
  return p.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ImpactSectionProps {
  officers: OfficerPublic[];
  upcomingEvents: UswagEvent[];
  recentPosts: NewsPost[];
}

/** S5 — the present: mandates, today's stewards, and the live pulse (all live data). */
export default function ImpactSection({ officers, upcomingEvents, recentPosts }: ImpactSectionProps) {
  const mandatesRef = useRef<HTMLElement>(null);
  const liveRef = useRef<HTMLElement>(null);
  useLandingReveal(mandatesRef);
  // Live content arrives after mount — re-scan only this subtree when it does.
  useLandingReveal(liveRef, [officers.length, upcomingEvents.length, recentPosts.length]);

  return (
    <>
      {/* ---- Mandates (Deep Forest) ---- */}
      <section
        id="lp-mandates"
        ref={mandatesRef}
        aria-labelledby="lp-mandates-heading"
        data-era="present-dark"
        className="lp-section lp-vault"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="max-w-[640px]">
            <p className="lp-eyebrow text-sage" data-lp-reveal>
              Chapter IV · Today
            </p>
            <h2 id="lp-mandates-heading" className="lp-h2 mt-4 text-mist" data-lp-reveal>
              Three mandates. One organization.
            </h2>
            <EngravedRule className="mt-7 max-w-[220px] text-sage" />
            <p className="lp-body mt-7 text-mist/80" data-lp-reveal>
              Every USWAG program traces back to one of the three core causes set out in our Constitution.
            </p>
          </div>

          <ul className="grid grid-cols-1 lg:grid-cols-3 mt-16 border-t border-sage/20 lg:border-t-0">
            {MANDATES.map((m) => (
              <li
                key={m.num}
                className="relative py-10 lg:py-4 lg:px-10 first:lg:pl-0 border-b border-sage/20 lg:border-b-0 lg:border-l lg:first:border-l-0"
                data-lp-reveal
              >
                <span
                  className="absolute top-4 right-0 lg:right-8 text-[7rem] lp-outline-num"
                  aria-hidden="true"
                >
                  {m.num}
                </span>
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.1" className="lp-draw text-sage" aria-hidden="true">
                  <path d={m.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="lp-eyebrow text-sage mt-7 lp-lnum">Advocacy {m.num}</p>
                <h3 className="font-display text-[1.375rem] leading-tight text-mist mt-3">{m.title}</h3>
                <p className="text-[0.9375rem] leading-[1.7] text-mist/80 mt-3 max-w-[40ch]">{m.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Stewards + Pulse (Mist) ---- */}
      <section ref={liveRef} aria-labelledby="lp-pulse-heading" data-era="present" className="lp-section">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          {officers.length > 0 && (
            <div className="mb-24">
              <div className="flex flex-wrap items-end justify-between gap-4" data-lp-reveal>
                <div>
                  <p className="lp-eyebrow text-primary">Today’s stewards</p>
                  <h2 className="lp-h2 mt-3" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                    Led by students, for students.
                  </h2>
                </div>
                <Link to="/officers" className="lp-link">
                  Meet the officers <span aria-hidden="true">→</span>
                </Link>
              </div>
              <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                {officers.slice(0, 7).map((o) => (
                  <li key={o.id} className="lp-card lp-lift p-5 text-center" data-lp-reveal>
                    <div className="lp-cameo w-16 h-16 mx-auto flex items-center justify-center font-display text-[1.125rem] text-primary">
                      {o.photoUrl ? (
                        <img src={o.photoUrl} alt="" loading="lazy" decoding="async" width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <span aria-hidden="true">{initials(o.name)}</span>
                      )}
                    </div>
                    <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-primary mt-3 leading-tight">
                      {positionLabel(o.officerPosition)}
                    </p>
                    <p className="font-display text-[1rem] font-medium leading-tight mt-1">{o.name}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-16 lg:gap-24 items-start">
            {/* Upcoming events */}
            <div className="lg:sticky lg:top-28">
              <p className="lp-eyebrow text-primary" data-lp-reveal>
                The pulse
              </p>
              <h2 id="lp-pulse-heading" className="lp-h2 mt-3" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }} data-lp-reveal>
                Upcoming actions
              </h2>
              {upcomingEvents.length > 0 ? (
                <ol className="mt-10 border-l-2 border-sage pl-7 space-y-9">
                  {upcomingEvents.map((evt) => {
                    const d = new Date(evt.startsAt);
                    return (
                      <li key={evt.id} className="relative" data-lp-reveal>
                        <span className="absolute -left-[2.2rem] top-2 w-3 h-3 rotate-45 bg-mist border-2 border-primary" aria-hidden="true" />
                        <time dateTime={evt.startsAt} className="flex items-baseline gap-2">
                          <span className="font-display text-[2rem] leading-none font-medium text-primary lp-lnum">{d.getDate()}</span>
                          <span className="lp-eyebrow lp-ink-muted">{d.toLocaleString('en-PH', { month: 'short' })}</span>
                        </time>
                        <h3 className="font-display text-[1.1875rem] font-medium mt-2">{evt.title}</h3>
                        <p className="lp-small lp-ink-muted mt-1">
                          {d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })} · {evt.location}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="lp-small lp-ink-muted mt-8" data-lp-reveal>
                  No upcoming events right now — check back soon.
                </p>
              )}
              <Link to="/events" className="lp-link mt-6" data-lp-reveal>
                See the full calendar <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Latest posts (synced server-side from the Facebook Page) */}
            <div>
              <p className="lp-eyebrow text-primary" data-lp-reveal>
                Latest updates
              </p>
              {recentPosts.length > 0 ? (
                <div className="space-y-6 mt-6">
                  {recentPosts.map((post) => (
                    <PostCard key={post.id} post={post} clamp />
                  ))}
                </div>
              ) : (
                <p className="lp-small lp-ink-muted mt-6" data-lp-reveal>
                  No recent posts from our Facebook Page yet.
                </p>
              )}
              <Link to="/news" className="lp-link mt-5" data-lp-reveal>
                Read more news <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
