import { useQuery } from '@tanstack/react-query';
import { officerService } from '../../services/officerService';
import { listEvents } from '../../services/eventService';
import { listNewsPosts } from '../../services/postService';
import PublicPage from '@/components/landing/PublicPage';
import ArchivalHero from '@/components/landing/sections/ArchivalHero';
import OriginSection from '@/components/landing/sections/OriginSection';
import YearsTimeline from '@/components/landing/sections/YearsTimeline';
import PrequelSection from '@/components/landing/sections/PrequelSection';
import RebirthSection from '@/components/landing/sections/RebirthSection';import ImpactSection from '@/components/landing/sections/ImpactSection';
import LandingCTA, { MobileJoinBar } from '@/components/landing/sections/LandingCTA';

/**
 * Public landing page — "From the Record to the Present".
 * Design spec: docs/design/landing-architecture.md (supersedes prototype/landingDesktop.html for `/`).
 *
 * Narrative: archival hero → origin → the years in between → the prequel film → rebirth →
 * impact → call to action, then the chapter link on to About. The page surface travels from
 * parchment to Mist into the rebirth (useEraScroll via PublicPage), or all at once when the
 * prequel ends. Nothing is pinned: a GSAP pin fought the fixed Header in an earlier version
 * of this page.
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
      // The archive holds until the prequel's stage is behind the visitor — or until the film's
      // finale commits the present early.
      eraStart="#lp-rebirth"
      eraEnd="#lp-rebirth"
      refreshKeys={[officers.length, events.length, posts.length]}
      after={<MobileJoinBar />}
    >
      <ArchivalHero officerCount={officers.length} upcomingCount={upcoming.length} />
      <OriginSection />
      <YearsTimeline />
      <PrequelSection />
      <RebirthSection />
      <ImpactSection officers={officers} upcomingEvents={upcoming.slice(0, 3)} recentPosts={recentPosts} />
      <LandingCTA />
    </PublicPage>
  );
}
