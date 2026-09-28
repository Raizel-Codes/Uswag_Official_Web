import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listNewsPosts } from '@/services/postService';
import type { NewsPost } from '@/types/post.types';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import PostCard from '@/components/landing/PostCard';

function PostSkeleton() {
  return (
    <li className="lp-card p-7" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="lp-skeleton h-9 w-9" />
        <div className="space-y-2 flex-1">
          <div className="lp-skeleton h-3 w-32" />
          <div className="lp-skeleton h-2.5 w-24" />
        </div>
      </div>
      <div className="lp-skeleton h-3 w-full mt-5" />
      <div className="lp-skeleton h-3 w-4/5 mt-2" />
    </li>
  );
}

export default function NewsPage() {
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLElement>(null);

  const { data: posts, isLoading, isError } = useQuery<NewsPost[]>({
    queryKey: ['posts'],
    queryFn: listNewsPosts,
    staleTime: 2 * 60 * 1000,
  });

  const filtered = (posts ?? []).filter((p) => !search || p.body.toLowerCase().includes(search.toLowerCase()));
  useLandingReveal(listRef, [isLoading, posts?.length ?? 0]);

  return (
    <PublicPage refreshKeys={[posts?.length ?? 0, search]}>
      <PageMasthead
        eyebrow="The pulse"
        title={
          <>
            News &amp; <em className="text-primary">updates.</em>
          </>
        }
        lead="Synced from our official Facebook Page, plus official announcements — catch up on events, recaps, and organization news."
      />

      <section ref={listRef} aria-labelledby="news-heading" data-era="present" className="lp-section" data-lp-era-start data-lp-era-end>
        <div className="max-w-[820px] mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading id="news-heading" eyebrow="Latest from USWAG" title="Latest posts" />
            {!isLoading && (
              <p className="lp-eyebrow lp-ink-muted lp-lnum" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? 'update' : 'updates'}
              </p>
            )}
          </div>

          <div className="relative mt-10" data-lp-reveal>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/60" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <label htmlFor="news-search" className="sr-only">Search news</label>
            <input
              id="news-search"
              type="search"
              placeholder="Search news and updates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lp-field"
            />
          </div>

          {isError && (
            <p className="lp-alert mt-10" role="alert">
              Could not load news posts. Please try again later.
            </p>
          )}

          <div className="mt-10">
            {isLoading ? (
              <ul className="space-y-6" aria-busy="true"><PostSkeleton /><PostSkeleton /><PostSkeleton /></ul>
            ) : filtered.length === 0 ? (
              <div className="lp-card p-12 text-center">
                <p className="font-display text-[1.25rem]">{search ? 'No posts match your search.' : 'No recent updates to show.'}</p>
                <p className="lp-small lp-ink-muted mt-2">
                  {search ? 'Try a different keyword.' : 'Check back later for news from USWAG.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-6">
                {filtered.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
