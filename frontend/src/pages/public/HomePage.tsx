import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { officerService } from '../../services/officerService';
import { listEvents } from '../../services/eventService';
import { listNewsPosts } from '../../services/postService';
import { useEraScroll } from '@/hooks/useEraScroll';
import { ScrollTrigger, ensureGsapRegistered } from '@/lib/motion';
import ArchivalHero from '@/components/landing/sections/ArchivalHero';
import OriginSection from '@/components/landing/sections/OriginSection';
import YearsTimeline from '@/components/landing/sections/YearsTimeline';
import RebirthSection from '@/components/landing/sections/RebirthSection';
import ImpactSection from '@/components/landing/sections/ImpactSection';
import LandingCTA from '@/components/landing/sections/LandingCTA';
// Landing-only styles, scoped under `.lp` — see the header comment in the file.
import '@/styles/landing.css';

ensureGsapRegistered();

/**
 * Public landing page — "From the Record to the Present".
 * Design spec: docs/design/landing-architecture.md (supersedes prototype/landingDesktop.html for `/`).
 *
 * Narrative: archival hero → origin → the years in between → rebirth → impact → call to action.
 * The page surface travels from parchment to Mist as you scroll (useEraScroll). Nothing is
 * pinned: a GSAP pin fought the fixed Header in an earlier version of this page.
 */
export default function HomePage() {
  const { data: officers = [] } = useQuery({ queryKey: ['publicOfficers'], queryFn: officerService.getPublicRoster });
  const { data: events = [] } = useQuery({ queryKey: ['publicEvents'], queryFn: listEvents });
  const { data: posts = [] } = useQuery({ queryKey: ['publicPosts'], queryFn: listNewsPosts });

  const upcoming = events
    .filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED' && new Date(e.startsAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const recentPosts = posts.slice(0, 2);

  const root = useRef<HTMLDivElement>(null);
  useEraScroll(root, { startSelector: '#lp-years', endSelector: '#lp-rebirth' });

  // ScrollTrigger caches trigger positions at creation; this page keeps changing height as the
  // officers/events/posts queries resolve and web fonts swap in, so re-measure when they do.
  useEffect(() => {
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const timeout = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [officers.length, events.length, posts.length]);

  return (
    <div ref={root} className="lp">
      <ArchivalHero officerCount={officers.length} upcomingCount={upcoming.length} />
      <OriginSection />
      <YearsTimeline />
      <RebirthSection />
      <ImpactSection officers={officers} upcomingEvents={upcoming.slice(0, 3)} recentPosts={recentPosts} />
      <LandingCTA />
    </div>
  );
}
