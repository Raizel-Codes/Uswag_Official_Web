import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listEvents } from '@/services/eventService';
import { PILLAR_LABELS, STATUS_LABELS } from '@/types/event.types';
import type { UswagEvent } from '@/types/event.types';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('en-PH', { month: 'short' }),
    time: d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
    full: d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

// Status chips use the semantic tokens from tokens.css (success/warn/danger), never raw red/amber.
const STATUS_CLS: Record<string, string> = {
  CONFIRMED: 'bg-successBg text-forest border-success/40',
  DRAFT: 'bg-warnBg text-forest border-warn/40',
  COMPLETED: 'bg-transparent text-forest border-forest/25',
  CANCELLED: 'bg-dangerBg text-forest border-danger/40',
};

function EventRow({ event }: { event: UswagEvent }) {
  const dt = formatDate(event.startsAt);
  const isPast = event.status === 'COMPLETED' || event.status === 'CANCELLED';
  const isOutOfCampus = event.scope === 'OUT_OF_CAMPUS';

  return (
    <li className={`lp-card lp-lift flex gap-5 p-5 sm:p-6 ${isPast ? 'opacity-80' : ''}`} data-lp-reveal>
      <time
        dateTime={event.startsAt}
        className={`flex h-[68px] w-[64px] shrink-0 flex-col items-center justify-center ${
          isPast ? 'rounded-[3px] border border-forest/25' : 'lp-plate'
        }`}
      >
        <span className="font-display text-[1.5rem] leading-none font-medium lp-lnum">{dt.day}</span>
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] mt-1">{dt.month}</span>
      </time>
      <div className="flex-1 min-w-0">
        <p className="lp-eyebrow text-primary">
          {PILLAR_LABELS[event.pillar]}
          {isOutOfCampus && <span className="lp-ink-muted"> · Out-of-campus</span>}
          {event.limitedSlots != null && <span className="lp-ink-muted"> · Limited slots</span>}
        </p>
        <h3 className="font-display text-[1.1875rem] font-medium leading-snug mt-1.5">{event.title}</h3>
        <p className="lp-small lp-ink-muted mt-1">
          <span className="sr-only">{dt.full}, </span>
          {dt.time} · {event.location}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className={`border rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${STATUS_CLS[event.status] ?? 'border-forest/25'}`}>
            {STATUS_LABELS[event.status]}
          </span>
          {!isPast && (
            <Link to="/login" className="lp-link py-1.5">
              {isOutOfCampus ? 'Log in to apply' : 'Log in to RSVP'} <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className="lp-card flex gap-5 p-6" aria-hidden="true">
      <div className="lp-skeleton h-[68px] w-[64px] shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="lp-skeleton h-3 w-24" />
        <div className="lp-skeleton h-4 w-3/4" />
        <div className="lp-skeleton h-3 w-40" />
      </div>
    </li>
  );
}

const PILLAR_FILTERS = [
  { key: 'ALL', label: 'All events' },
  { key: 'YOUTH_VOICE', label: 'Youth Voice' },
  { key: 'MENTAL_HEALTH', label: 'Mental Health' },
  { key: 'ENVIRONMENTAL', label: 'Environment' },
];

function GroupHeading({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[rgb(20_39_24/0.15)] pb-3 mb-5">
      <h2 className="font-display text-[1.375rem] font-medium">{title}</h2>
      {meta && <span className="lp-eyebrow lp-ink-muted">{meta}</span>}
    </div>
  );
}

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLElement>(null);

  const { data: events, isLoading, isError } = useQuery<UswagEvent[]>({
    queryKey: ['events'],
    queryFn: listEvents,
    staleTime: 2 * 60 * 1000,
  });

  const all = events ?? [];

  const filtered = all.filter((e) => {
    const matchesPillar = activeFilter === 'ALL' || e.pillar === activeFilter;
    const matchesSearch =
      !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
    return matchesPillar && matchesSearch;
  });

  const upcoming = filtered
    .filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const outOfCampus = upcoming.filter((e) => e.scope === 'OUT_OF_CAMPUS');
  const inCampus = upcoming.filter((e) => e.scope === 'IN_CAMPUS');
  const past = filtered
    .filter((e) => e.status === 'COMPLETED' || e.status === 'CANCELLED')
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  // Re-scan only when the data arrives — re-running on every filter change or keystroke would
  // replay the reveal and make the list flicker while typing.
  useLandingReveal(listRef, [isLoading, all.length]);

  return (
    <PublicPage refreshKeys={[all.length, activeFilter, search]}>
      <PageMasthead
        eyebrow="The calendar"
        title={
          <>
            Assemblies, outreach &amp; <em className="text-primary">forums.</em>
          </>
        }
        lead="USWAG organizes in-campus and out-of-campus activities aligned with our three advocacies. Members log in to RSVP or apply for limited-slot events."
      >
        <Link to="/login" className="lp-btn lp-btn--primary">
          Log in to RSVP <span className="lp-btn__arrow" aria-hidden="true">→</span>
        </Link>
      </PageMasthead>

      <section ref={listRef} aria-labelledby="ev-heading" data-era="present" className="lp-section" data-lp-era-start data-lp-era-end>
        <div className="max-w-[880px] mx-auto px-4 sm:px-8">
          <SectionHeading id="ev-heading" eyebrow="What’s coming up" title="Upcoming events" />

          <div className="mt-10 space-y-4" data-lp-reveal>
            <div className="flex gap-2 overflow-x-auto uw-scroll-hidden pb-1" role="group" aria-label="Filter by advocacy">
              {PILLAR_FILTERS.map((f) => (
                <button key={f.key} type="button" className="lp-chip" aria-pressed={activeFilter === f.key} onClick={() => setActiveFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/60" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <label htmlFor="ev-search" className="sr-only">Search events</label>
              <input
                id="ev-search"
                type="search"
                placeholder="Search by title or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lp-field"
              />
            </div>
          </div>

          {isError && (
            <p className="lp-alert mt-10" role="alert">
              Could not load events. Please try again later.
            </p>
          )}

          <div className="mt-12">
            <GroupHeading title="In-campus events" meta={isLoading ? undefined : `${inCampus.length} upcoming`} />
            {isLoading ? (
              <ul className="space-y-4" aria-busy="true"><RowSkeleton /><RowSkeleton /></ul>
            ) : inCampus.length === 0 ? (
              <p className="lp-card p-8 text-center lp-ink-muted">No upcoming in-campus events match your filters.</p>
            ) : (
              <ul className="space-y-4">{inCampus.map((e) => <EventRow key={e.id} event={e} />)}</ul>
            )}
          </div>

          {(isLoading || outOfCampus.length > 0) && (
            <div className="mt-16">
              <GroupHeading title="Out-of-campus" meta="Limited slots" />
              {isLoading ? (
                <ul className="space-y-4" aria-busy="true"><RowSkeleton /></ul>
              ) : (
                <ul className="space-y-4">{outOfCampus.map((e) => <EventRow key={e.id} event={e} />)}</ul>
              )}
            </div>
          )}

          {past.length > 0 && (
            <div className="mt-16">
              <GroupHeading title="Past events" meta="From the record" />
              <ul className="space-y-4">{past.slice(0, 5).map((e) => <EventRow key={e.id} event={e} />)}</ul>
            </div>
          )}
        </div>
      </section>
    </PublicPage>
  );
}
