import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyProfile } from '@/services/memberService';
import { listEvents, rsvpToEvent } from '@/services/eventService';
import { listNewsPosts } from '@/services/postService';
import type { UswagEvent } from '@/types/event.types';
import type { NewsPost } from '@/types/post.types';
import type { MemberProfile } from '@/types/member.types';
import NewsFeedCard from '@/components/feed/NewsFeedCard';
import NotificationBell from '@/components/pwa/NotificationBell';

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------
function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 ${className}`}
      style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
    />
  );
}

function HeroCardSkeleton() {
  return (
    <div className="mb-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-primary to-forest p-[22px]">
      <SkeletonBox className="mb-2 h-3 w-24 bg-white/20" />
      <SkeletonBox className="mb-1 h-7 w-40 bg-white/20" />
      <SkeletonBox className="mb-4 h-3 w-48 bg-white/20" />
      <SkeletonBox className="h-7 w-36 rounded-full bg-white/20" />
    </div>
  );
}

function StatRowSkeleton() {
  return (
    <div className="mb-5 grid grid-cols-3 gap-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl bg-white p-3.5 text-center shadow-sm">
          <SkeletonBox className="mx-auto mb-1.5 h-6 w-10" />
          <SkeletonBox className="mx-auto h-2.5 w-14" />
        </div>
      ))}
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-2xl border-l-4 border-sage bg-white p-3 shadow-sm">
      <SkeletonBox className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBox className="h-2.5 w-20" />
        <SkeletonBox className="h-3.5 w-40" />
        <SkeletonBox className="h-2.5 w-32" />
      </div>
      <SkeletonBox className="h-7 w-14 shrink-0 rounded-full" />
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="mb-2.5 rounded-2xl bg-white p-3.5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <SkeletonBox className="h-7 w-7 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-1">
          <SkeletonBox className="h-3 w-32" />
          <SkeletonBox className="h-2.5 w-24" />
        </div>
      </div>
      <SkeletonBox className="mb-1.5 h-3 w-full" />
      <SkeletonBox className="mb-3 h-3 w-4/5" />
      <div className="flex gap-4">
        <SkeletonBox className="h-3 w-12" />
        <SkeletonBox className="h-3 w-12" />
        <SkeletonBox className="h-3 w-12" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pillar data (static per USWAG charter)
// ---------------------------------------------------------------------------
const PILLARS = [
  {
    key: 'youth_voice',
    label: 'Youth Voice & Participation',
    sub: 'Governance & civic leadership',
    bg: '#eaf3ee',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#2e5b41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'mental_health',
    label: 'Mental Health & Wellness',
    sub: 'Literacy & peer support',
    bg: '#eaf3ee',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#2e5b41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    key: 'environmental',
    label: 'Environmental Leadership',
    sub: 'Sustainability initiatives',
    bg: '#eaf3ee',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#2e5b41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 11 13 11 11" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
function formatAcademicYear(raw: string): string {
  return raw.replace('-', '\u2013');
}

function getFirstName(fullName: string): string {
  return fullName?.trim().split(' ')[0] ?? '';
}

function formatPillarLabel(pillar: string): string {
  const map: Record<string, string> = {
    youth_voice: 'Youth Voice',
    mental_health: 'Mental Health',
    environmental: 'Environmental',
  };
  return map[pillar] ?? pillar.replace('_', ' ');
}



// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MemberDashboardPage() {
  const queryClient = useQueryClient();
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } =
    useQuery<MemberProfile>({
      queryKey: ['member', 'profile'],
      queryFn: getMyProfile,
      staleTime: 5 * 60 * 1000,
    });

  const { data: events, isLoading: isEventsLoading } = useQuery<UswagEvent[]>({
    queryKey: ['events'],
    queryFn: listEvents,
    staleTime: 2 * 60 * 1000,
  });

  const { data: posts, isLoading: isPostsLoading } = useQuery<NewsPost[]>({
    queryKey: ['posts'],
    queryFn: listNewsPosts,
    staleTime: 2 * 60 * 1000,
  });

  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => rsvpToEvent(eventId),
    onSuccess: (_data, eventId) => {
      setRsvpedIds((prev) => new Set(prev).add(eventId));
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const upcomingEvents = (events ?? [])
    .filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 2);

  const latestPosts = (posts ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-mist pb-24 md:pb-8">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Appbar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-forest font-heading font-extrabold text-white text-sm shadow-md select-none">
            UW
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight text-forest">USWAG</div>
            <div className="text-[11px] font-medium text-gray-500">NwSSU Main Campus</div>
          </div>
        </div>
        <NotificationBell />
      </div>

      <div className="px-5">
        {/* Hero Card */}
        {isProfileLoading ? (
          <HeroCardSkeleton />
        ) : isProfileError || !profile ? (
          <div className="mb-5 rounded-[22px] bg-gradient-to-br from-primary to-forest p-[22px] text-white">
            <div className="text-[11px] font-bold uppercase tracking-widest text-sage">Welcome back</div>
            <div className="mt-1 font-heading text-[22px] font-bold">Hi there 👋</div>
            <div className="mt-1 text-[12.5px] text-white/60">Could not load your profile right now.</div>
          </div>
        ) : (
          <div className="relative mb-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-primary to-forest p-[22px] text-white">
            <div className="pointer-events-none absolute -top-10 -right-10 h-[150px] w-[150px] rounded-full bg-sage/20" />
            <div className="pointer-events-none absolute -bottom-16 right-8 h-[110px] w-[110px] rounded-full bg-sage/10" />
            <div className="text-[11px] font-bold uppercase tracking-widest text-sage">Welcome back</div>
            <div className="mt-1 font-heading text-[22px] font-bold">
              Hi, {getFirstName(profile.name)} 👋
            </div>
            <div className="mt-1 text-[12.5px] text-white/75">
              {profile.collegeOrDept}{profile.yearLevel ? ` · ${profile.yearLevel}` : ''}
            </div>
            <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_0_3px_rgba(126,230,168,0.25)] ${profile.status === 'active' ? 'bg-[#7ee6a8]' : 'bg-yellow-400'}`} />
              {profile.status === 'active' ? 'Active Member' : 'Pending Member'}
              {' · A.Y. '}{formatAcademicYear(profile.academicYear)}
            </div>
          </div>
        )}

        {/* Stat Row */}
        {isProfileLoading ? (
          <StatRowSkeleton />
        ) : (
          <div className="mb-5 grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-white p-3.5 text-center shadow-sm">
              <div className="font-heading text-xl font-extrabold text-primary">
                {events
                  ? upcomingEvents.length + events.filter((e) => e.status === 'COMPLETED').length
                  : '—'}
              </div>
              <div className="mt-0.5 text-[10.5px] font-semibold text-gray-500">Events Joined</div>
            </div>
            <div className="rounded-2xl bg-white p-3.5 text-center shadow-sm">
              <div className="font-heading text-xl font-extrabold text-primary">
                {profile ? `${profile.attendanceRate}%` : ''}
              </div>
              <div className="mt-0.5 text-[10.5px] font-semibold text-gray-500">Attendance</div>
            </div>
            <div className="rounded-2xl bg-white p-3.5 text-center shadow-sm">
              <div className="font-heading text-xl font-extrabold text-primary"></div>
              <div className="mt-0.5 text-[10.5px] font-semibold text-gray-500">Badges</div>
            </div>
          </div>
        )}

        {/* Advocacy Pillars */}
        <div className="my-5 flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold text-forest">Our Advocacies</h3>
        </div>
        <div className="-mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {PILLARS.map((p) => (
            <div
              key={p.key}
              className="min-w-[130px] snap-center rounded-2xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: p.bg }}
              >
                {p.icon}
              </div>
              <h4 className="font-heading text-[12.5px] font-bold leading-tight text-forest">{p.label}</h4>
              <p className="mt-1 text-[10.5px] text-gray-500">{p.sub}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className="my-5 flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold text-forest">Upcoming Events</h3>
          <Link to="/dashboard/events" className="text-xs font-semibold text-primary hover:underline">
            See all
          </Link>
        </div>

        {isEventsLoading ? (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        ) : upcomingEvents.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 h-8 w-8 stroke-gray-300">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-[12.5px] font-medium text-gray-500">No upcoming events right now.</p>
            <p className="mt-0.5 text-[11px] text-gray-400">Check back soon for new activities!</p>
          </div>
        ) : (
          upcomingEvents.map((event: UswagEvent) => {
            const date = new Date(event.startsAt);
            const isGoing = rsvpedIds.has(event.id);
            const isPending = rsvpMutation.isPending && rsvpMutation.variables === event.id;
            return (
              <div
                key={event.id}
                className="mb-2.5 flex items-center gap-3 rounded-2xl border-l-4 border-sage bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 min-w-12 flex-col items-center justify-center rounded-xl bg-mist font-heading text-primary">
                  <span className="text-[17px] font-extrabold leading-none">{date.getDate()}</span>
                  <span className="text-[9.5px] font-bold uppercase tracking-wide">
                    {date.toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9.5px] font-bold uppercase tracking-wide text-primary">
                    {formatPillarLabel(event.pillar)}
                  </div>
                  <h4 className="font-heading mt-0.5 truncate text-[13.5px] font-bold text-forest">{event.title}</h4>
                  <div className="mt-0.5 truncate text-[11.5px] text-gray-500">
                    {event.location} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  id={`btn-rsvp-${event.id}`}
                  disabled={isGoing || isPending}
                  onClick={() => rsvpMutation.mutate(event.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    isGoing
                      ? 'bg-primary text-white cursor-default'
                      : isPending
                      ? 'bg-mist text-primary/50 cursor-wait'
                      : 'bg-mist text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {isGoing ? 'Going \u2713' : isPending ? '\u2026' : 'RSVP'}
                </button>
              </div>
            );
          })
        )}

        {/* Latest from Facebook */}
        <div className="my-5 flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold text-forest">Latest from Facebook</h3>
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View page
          </a>
        </div>

        {isPostsLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : latestPosts.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 h-8 w-8 stroke-gray-300">
              <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
            </svg>
            <p className="text-[12.5px] font-medium text-gray-500">No recent updates to show.</p>
            <p className="mt-0.5 text-[11px] text-gray-400">Check back later for news from USWAG.</p>
          </div>
        ) : (
          latestPosts.map((post: NewsPost) => (
            <NewsFeedCard key={post.id} post={post} />
          ))
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
