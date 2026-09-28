import { useQuery } from '@tanstack/react-query';
import { officerService } from '../../services/officerService';
import { listEvents } from '../../services/eventService';
import { listNewsPosts } from '../../services/postService';
import PublicPage from '@/components/landing/PublicPage';
import ArchivalHero from '@/components/landing/sections/ArchivalHero';
import OriginSection from '@/components/landing/sections/OriginSection';
import YearsTimeline from '@/components/landing/sections/YearsTimeline';
import RebirthSection from '@/components/landing/sections/RebirthSection';
import ImpactSection from '@/components/landing/sections/ImpactSection';
import LandingCTA, { MobileJoinBar } from '@/components/landing/sections/LandingCTA';

/**
 * Public landing page — "From the Record to the Present".
 * Design spec: docs/design/landing-architecture.md (supersedes prototype/landingDesktop.html for `/`).
 *
 * Narrative: archival hero → origin → the years in between → rebirth → impact → call to action,
 * then the chapter link on to About. The page surface travels from parchment to Mist between
 * the timeline and the rebirth (useEraScroll via PublicPage). Nothing is pinned: a GSAP pin
 * fought the fixed Header in an earlier version of this page.
 */
export default function HomePage() {
  const { data: officers = [] } = useQuery({ queryKey: ['publicOfficers'], queryFn: officerService.getPublicRoster });
  const { data: events = [] } = useQuery({ queryKey: ['publicEvents'], queryFn: listEvents });
  const { data: posts = [] } = useQuery({ queryKey: ['publicPosts'], queryFn: listNewsPosts });

  const upcoming = events
    .filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED' && new Date(e.startsAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const recentPosts = posts.slice(0, 2);

  return (
    <PublicPage
      eraStart="#lp-years"
      eraEnd="#lp-rebirth"
      refreshKeys={[officers.length, events.length, posts.length]}
      after={<MobileJoinBar />}
    >
      <ArchivalHero officerCount={officers.length} upcomingCount={upcoming.length} />
      <OriginSection />
      <YearsTimeline />
      <RebirthSection />
      <ImpactSection officers={officers} upcomingEvents={upcoming.slice(0, 3)} recentPosts={recentPosts} />
      <LandingCTA />
    </PublicPage>
  );
}
