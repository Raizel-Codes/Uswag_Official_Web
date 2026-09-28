import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listEvents } from '@/services/eventService';
import { PILLAR_LABELS, STATUS_LABELS } from '@/types/event.types';
import type { UswagEvent } from '@/types/event.types';

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-primary/10 text-primary border-primary/20',
  DRAFT: 'bg-sage/10 text-forest border-sage/30',
  COMPLETED: 'bg-mist text-forest/60 border-forest/10',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const PILLAR_COLORS: Record<string, string> = {
  YOUTH_VOICE: 'text-primary',
  MENTAL_HEALTH: 'text-forest',
  ENVIRONMENTAL: 'text-sage',
};

function EventCardSkeleton() {
  return (
    <div className="mb-4 flex gap-5 bg-white p-5 border-l-2 border-sage border-y border-r border-forest/10 shadow-[0_2px_10px_rgba(20,39,24,0.02)] animate-pulse">
      <div className="h-[60px] w-[60px] shrink-0 bg-mist" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3 w-24 bg-mist" />
        <div className="h-4 w-3/4 bg-mist" />
        <div className="h-3 w-40 bg-mist" />
      </div>
    </div>
  );
}

function PublicEventCard({ event }: { event: UswagEvent }) {
  const dt = formatDate(event.startsAt);
  const isPast = event.status === 'COMPLETED' || event.status === 'CANCELLED';
  const isOutOfCampus = event.scope === 'OUT_OF_CAMPUS';

  return (
    <div className={`group mb-4 flex gap-5 bg-white p-5 border-y border-r border-forest/10 border-l-2 shadow-[0_2px_10px_rgba(20,39,24,0.02)] transition-all hover:shadow-[0_8px_24px_rgba(20,39,24,0.06)] hover:border-l-primary ${isOutOfCampus ? 'border-l-sage' : 'border-l-forest/20'} ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      <div className="flex h-[60px] min-w-[60px] flex-col items-center justify-center bg-mist text-primary border border-forest/5 font-display transition-colors group-hover:bg-primary/5">
        <span className="text-[1.375rem] font-medium leading-none mb-0.5">{dt.day}</span>
        <span className="text-[0.625rem] font-bold uppercase tracking-widest">{dt.month}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[0.6875rem] font-bold uppercase tracking-[0.15em] mb-1.5 ${PILLAR_COLORS[event.pillar] ?? 'text-primary'}`}>
          {PILLAR_LABELS[event.pillar]}
          {isOutOfCampus && <span className="ml-2 text-sage before:content-['·'] before:mr-2 before:text-forest/30">Out-of-Campus</span>}
          {event.limitedSlots != null && <span className="ml-2 text-sage before:content-['·'] before:mr-2 before:text-forest/30">Limited Slots</span>}
        </div>
        <h3 className="font-display text-[1.125rem] font-medium text-forest leading-[1.3] mb-1 truncate">{event.title}</h3>
        <div className="text-[0.8125rem] text-forest/60 font-medium mb-3 truncate">{event.location} <span className="mx-1.5 text-sage">·</span> {dt.time}</div>
        
        <div className="flex items-center gap-3">
          <span className={`border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider ${STATUS_COLORS[event.status] ?? 'bg-mist text-forest/50 border-forest/10'}`}>
            {STATUS_LABELS[event.status]}
          </span>
          {!isPast && (
            <Link to="/login" className="px-3.5 py-1 text-[0.75rem] font-bold text-primary hover:text-forest transition-colors flex items-center gap-1.5">
              {isOutOfCampus ? 'Apply' : 'RSVP'} <span className="text-sm leading-none">→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const PILLAR_FILTERS = [
  { key: 'ALL', label: 'All Events' },
  { key: 'YOUTH_VOICE', label: 'Youth Voice' },
  { key: 'MENTAL_HEALTH', label: 'Mental Health' },
  { key: 'ENVIRONMENTAL', label: 'Environment' },
];

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data: events, isLoading, isError } = useQuery<UswagEvent[]>({
    queryKey: ['events'],
    queryFn: listEvents,
    staleTime: 2 * 60 * 1000,
  });

  const all = events ?? [];

  const filtered = all.filter(e => {
    const matchesPillar = activeFilter === 'ALL' || e.pillar === activeFilter;
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
    return matchesPillar && matchesSearch;
  });

  const upcoming = filtered.filter(e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const outOfCampus = upcoming.filter(e => e.scope === 'OUT_OF_CAMPUS');
  const inCampus = upcoming.filter(e => e.scope === 'IN_CAMPUS');
  const past = filtered.filter(e => e.status === 'COMPLETED' || e.status === 'CANCELLED')
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24 min-h-screen">

      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              Calendar
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              Upcoming <em className="italic text-sage">Events</em>
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[52ch] mb-8">
              USWAG organizes in-campus and out-of-campus activities aligned with our three advocacy pillars. Log in to RSVP or apply for limited-slot events.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 font-sans text-[0.875rem] font-semibold text-forest bg-mist hover:bg-white transition-colors">
              Log in to RSVP
            </Link>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-[800px] mx-auto px-8 pt-16">
        
        {/* Filters & Search */}
        <div className="mb-12 space-y-5">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-2">
            {PILLAR_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`shrink-0 px-5 py-2 text-[0.8125rem] font-bold uppercase tracking-wider transition-colors border ${
                  activeFilter === f.key
                    ? 'bg-forest text-white border-forest'
                    : 'bg-white text-forest/70 border-forest/15 hover:border-forest/40 hover:text-forest'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-forest/40">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search by title or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-forest/15 px-11 py-3.5 text-[0.9375rem] text-forest placeholder-forest/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-[0_2px_10px_rgba(20,39,24,0.02)]"
            />
          </div>
        </div>

        {isError && (
          <div className="mb-8 border border-red-200 bg-red-50 p-5 text-[0.875rem] text-red-600 font-medium">
            Could not load events. Please try again later.
          </div>
        )}

        {/* In-Campus */}
        <div className="mb-4 flex items-baseline justify-between border-b border-forest/10 pb-3">
          <h2 className="font-display text-[1.25rem] font-medium text-forest">In-Campus Events</h2>
          <span className="text-[0.75rem] font-bold uppercase tracking-widest text-forest/40">{inCampus.length} upcoming</span>
        </div>
        
        {isLoading ? (
          <><EventCardSkeleton /><EventCardSkeleton /></>
        ) : inCampus.length === 0 ? (
          <div className="mb-12 bg-white p-8 text-center border border-dashed border-forest/20 text-forest/50 text-[0.9375rem]">
            No upcoming in-campus events match your filters.
          </div>
        ) : (
          <div className="mb-12 space-y-4">
            {inCampus.map(e => <PublicEventCard key={e.id} event={e} />)}
          </div>
        )}

        {/* Out-of-Campus */}
        {(isLoading || outOfCampus.length > 0) && (
          <>
            <div className="mb-4 flex items-baseline justify-between border-b border-forest/10 pb-3 mt-16">
              <h2 className="font-display text-[1.25rem] font-medium text-forest">Out-of-Campus</h2>
              <span className="text-[0.75rem] font-bold uppercase tracking-widest text-sage">Limited slots</span>
            </div>
            {isLoading ? (
               <EventCardSkeleton />
            ) : (
               <div className="mb-12 space-y-4">
                 {outOfCampus.map(e => <PublicEventCard key={e.id} event={e} />)}
               </div>
            )}
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <div className="mb-4 flex items-baseline justify-between border-b border-forest/10 pb-3 mt-16">
              <h2 className="font-display text-[1.25rem] font-medium text-forest">Past Events</h2>
            </div>
            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
               {past.slice(0, 5).map(e => <PublicEventCard key={e.id} event={e} />)}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
