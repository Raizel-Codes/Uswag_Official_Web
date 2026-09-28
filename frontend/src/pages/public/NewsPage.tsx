import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listNewsPosts } from '@/services/postService';
import NewsFeedCard from '@/components/feed/NewsFeedCard';
import type { NewsPost } from '@/types/post.types';

function PostCardSkeleton() {
  return (
    <div className="mb-6 bg-white p-6 border border-forest/10 shadow-[0_2px_10px_rgba(20,39,24,0.02)] animate-pulse">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 bg-mist" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 bg-mist" />
          <div className="h-2.5 w-24 bg-mist/50" />
        </div>
      </div>
      <div className="mb-2 h-3 w-full bg-mist" />
      <div className="mb-4 h-3 w-4/5 bg-mist" />
      <div className="h-4 w-24 bg-mist" />
    </div>
  );
}

export default function NewsPage() {
  const [search, setSearch] = useState('');

  const { data: posts, isLoading, isError } = useQuery<NewsPost[]>({
    queryKey: ['posts'],
    queryFn: listNewsPosts,
    staleTime: 2 * 60 * 1000,
  });

  const filtered = (posts ?? []).filter(p =>
    !search || p.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24 min-h-screen">
      
      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              The Pulse
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              News <em className="italic text-sage">&amp;</em> Updates
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[52ch]">
              Auto-synced from our Facebook Page and official announcements. Catch up on events, recaps, and org news.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-[800px] mx-auto px-8 pt-16">
        
        {/* Search */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-forest/40">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search news and updates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-forest/15 px-11 py-3.5 text-[0.9375rem] text-forest placeholder-forest/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-[0_2px_10px_rgba(20,39,24,0.02)]"
            />
          </div>
        </div>

        {isError && (
          <div className="mb-8 border border-red-200 bg-red-50 p-5 text-[0.875rem] text-red-600 font-medium">
            Could not load news posts. Please try again later.
          </div>
        )}

        <div className="mb-4 flex items-baseline justify-between border-b border-forest/10 pb-3">
          <h2 className="font-display text-[1.25rem] font-medium text-forest">Latest Posts</h2>
          {!isLoading && <span className="text-[0.75rem] font-bold uppercase tracking-widest text-forest/40">{filtered.length} updates</span>}
        </div>

        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <div className="mb-12 bg-white p-12 text-center border border-dashed border-forest/20 shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 h-12 w-12 stroke-forest/20">
              <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
            </svg>
            <p className="font-display text-[1.125rem] text-forest/60 mb-1">
              {search ? 'No posts match your search.' : 'No recent updates to show.'}
            </p>
            <p className="text-[0.875rem] text-forest/40">
              {search ? 'Try a different keyword.' : 'Check back later for news from USWAG.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(post => (
              <NewsFeedCard key={post.id} post={post} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
