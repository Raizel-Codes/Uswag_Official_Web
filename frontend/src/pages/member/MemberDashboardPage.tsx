// Member portal — Home. The present-day Record as an app: a Deep Forest vault with the
// member's standing, their own numbers, what's next, and the advocacies they signed up for.
// Pending / expired / rejected members see the same page with the card and sign-ups locked
// and explained (the server enforces it too: member.controller getMyQr, event.controller rsvp).
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listEvents } from '@/services/eventService';
import { listNewsPosts } from '@/services/postService';
import { getMyAttendance } from '@/services/attendanceService';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyRsvps } from '@/hooks/useMyRsvps';
import type { UswagEvent, MemberAttendanceHistory } from '@/types/event.types';
import type { NewsPost } from '@/types/post.types';
import NotificationBell from '@/components/pwa/NotificationBell';
import PageHeader from '@/components/member/PageHeader';
import StandingNote from '@/components/member/StandingNote';
import EventRow from '@/components/member/EventRow';
import { STANDING_LABEL, isActive, errorMessage } from '@/components/member/standing';

const PILLARS = [
  {
    key: 'YOUTH_VOICE',
    label: 'Youth Voice & Participation',
    sub: 'Governance and civic leadership',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    key: 'MENTAL_HEALTH',
    label: 'Mental Health & Wellness',
    sub: 'Literacy and peer support',
    icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  },
  {
    key: 'ENVIRONMENTAL',
    label: 'Environmental Leadership',
    sub: 'Sustainability initiatives',
    icon: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 11 13 11 11" />
      </>
    ),
  },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] ?? '';
}

function relativeDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export default function MemberDashboardPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useMyProfile();
  const active = isActive(profile?.status);
  const { byEvent, rsvp, data: myRsvps } = useMyRsvps(active);

  const { data: events, isLoading: eventsLoading } = useQuery<UswagEvent[]>({
    queryKey: ['events'],
    queryFn: listEvents,
    staleTime: 2 * 60 * 1000,
  });
  const { data: attendance } = useQuery<MemberAttendanceHistory>({
    queryKey: ['member', 'attendance'],
    queryFn: getMyAttendance,
    staleTime: 60 * 1000,
  });
  const { data: posts } = useQuery<NewsPost[]>({
    queryKey: ['posts'],
    queryFn: listNewsPosts,
    staleTime: 2 * 60 * 1000,
  });

  const now = Date.now();
  const upcoming = (events ?? [])
    .filter((e) => (e.status === 'CONFIRMED' || e.status === 'DRAFT') && new Date(e.startsAt).getTime() >= now - 6 * 3600_000)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .slice(0, 3);
  const latestPosts = (posts ?? []).slice(0, 2);

  const stats = [
    { label: 'Events joined', value: active ? (myRsvps ? String(myRsvps.length) : '…') : '—' },
    { label: 'Present at', value: attendance ? String(attendance.validScans) : '…' },
    { label: 'Attendance', value: profile ? `${profile.attendanceRate}%` : '…' },
  ];

  return (
    <div className="mp-page space-y-10">
      <PageHeader
        eyebrow={profile ? `Member portal · A.Y. ${profile.academicYear.replace('-', '–')}` : 'Member portal'}
        title={profileLoading ? greeting() : `${greeting()}, ${firstName(profile?.name)}.`}
        actions={<NotificationBell />}
      />

      {/* ---- The vault: standing + the one thing to do next ---- */}
      <section aria-label="Your membership" className="mp-vault mp-vault--framed mp-vault--panel mp-on-dark p-6 sm:p-9">
        <span className="mp-outline-num absolute right-8 top-2 text-[9rem] select-none hidden md:block" aria-hidden="true">
          {new Date().getFullYear()}
        </span>
        {profileLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="mp-skeleton h-6 w-40" />
            <div className="mp-skeleton h-8 w-64" />
            <div className="mp-skeleton h-11 w-48" />
          </div>
        ) : profileError || !profile ? (
          <p>We couldn’t load your membership right now. Refresh the page, or try again in a moment.</p>
        ) : (
          <div className="relative max-w-[46ch]">
            <span className={`mp-standing mp-standing--${profile.status}`}>{STANDING_LABEL[profile.status]}</span>
            <p className="font-heading font-semibold text-[1.375rem] sm:text-[1.625rem] leading-tight mt-4 text-mist">
              {active
                ? 'Your card is ready for the next event.'
                : profile.status === 'pending'
                  ? 'Your application is with the Secretary.'
                  : profile.status === 'expired'
                    ? 'Time to renew for this academic year.'
                    : 'Your application wasn’t approved.'}
            </p>
            <p className="mp-muted mt-2 text-[0.9375rem]">
              {profile.collegeOrDept}
              {profile.yearLevel ? ` · ${profile.yearLevel}` : ''}
              {active && profile.serialNumber ? ` · ${profile.serialNumber}` : ''}
            </p>
            {!active && profile.standingNote && <p className="mt-4 text-[0.9375rem] leading-relaxed text-mist">{profile.standingNote}</p>}
            <div className="flex flex-wrap gap-3 mt-6">
              {active ? (
                <>
                  <Link to="/dashboard/qr" className="mp-btn mp-btn--light">Show my card</Link>
                  <Link to="/dashboard/events" className="mp-btn mp-btn--ghost !text-mist !border-[rgb(231_239_228/0.4)] hover:!border-mist">Browse events</Link>
                </>
              ) : profile.status === 'pending' ? (
                <Link to="/dashboard/qr" className="mp-btn mp-btn--light">See what happens next</Link>
              ) : (
                <Link to="/contact" className="mp-btn mp-btn--light">Contact the Secretary</Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ---- Your numbers ---- */}
      <section aria-labelledby="home-numbers">
        <h2 id="home-numbers" className="mp-h2">Your record</h2>
        <dl className="grid grid-cols-3 gap-3 mt-4">
          {stats.map((s) => (
            <div key={s.label} className="mp-card p-3 sm:p-5 min-w-0">
              <dt className="mp-eyebrow !tracking-[0.06em] sm:!tracking-[0.16em]" style={{ fontSize: '0.6875rem' }}>{s.label}</dt>
              <dd className="mp-stat mt-2 text-primary">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- What's next ---- */}
      <section aria-labelledby="home-upcoming">
        <div className="flex items-center gap-4">
          <h2 id="home-upcoming" className="mp-h2 flex-1">Coming up</h2>
          <Link to="/dashboard/events" className="mp-link text-[0.875rem]">All events</Link>
        </div>
        {profile && !active && <div className="mt-4"><StandingNote profile={profile} what="Event sign-ups are for active members" /></div>}
        {eventsLoading ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            <div className="mp-skeleton h-24" />
            <div className="mp-skeleton h-24" />
          </div>
        ) : upcoming.length === 0 ? (
          <p className="mp-card p-6 mt-4 text-center mp-muted">No upcoming events yet. New ones appear here as soon as the officers post them.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                rsvp={byEvent.get(e.id)}
                locked={!active}
                busy={rsvp.isPending && rsvp.variables === e.id}
                // Out-of-campus events need the limited-slots confirmation on the Events page
                onAction={(ev) => (ev.scope === 'OUT_OF_CAMPUS' ? navigate('/dashboard/events', { state: { apply: ev.id } }) : rsvp.mutate(ev.id))}
              />
            ))}
          </ul>
        )}
        {rsvp.isError && <p role="alert" className="mp-alert mt-3">{errorMessage(rsvp.error, 'Could not save your RSVP. Please try again.')}</p>}
      </section>

      {/* ---- The advocacies ---- */}
      <section aria-labelledby="home-pillars">
        <h2 id="home-pillars" className="mp-h2">Our advocacies</h2>
        <ul className="grid sm:grid-cols-3 gap-3 mt-4">
          {PILLARS.map((p) => (
            <li key={p.key} className="mp-card p-5 flex items-start gap-4">
              <span className="mp-seal w-11 h-11" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  {p.icon}
                </svg>
              </span>
              <div>
                <h3 className="mp-h3">{p.label}</h3>
                <p className="mp-muted text-[0.875rem] mt-1">{p.sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- From the page ---- */}
      {latestPosts.length > 0 && (
        <section aria-labelledby="home-news">
          <h2 id="home-news" className="mp-h2">From the USWAG page</h2>
          <ul className="grid md:grid-cols-2 gap-3 mt-4">
            {latestPosts.map((post) => (
              <li key={post.id} className="mp-card p-5 flex flex-col">
                <p className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>
                  {relativeDate(post.publishedAt)} · {post.source === 'facebook' ? 'Facebook' : 'Announcement'}
                </p>
                <p className="text-[0.9375rem] leading-relaxed mt-2 line-clamp-4 whitespace-pre-line">{post.body}</p>
                {post.permalink && (
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="mp-link text-[0.875rem] mt-3 self-start">
                    Read on Facebook<span className="mp-sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
