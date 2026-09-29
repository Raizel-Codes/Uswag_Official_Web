import type { NewsPost } from '@/types/post.types';

interface PostCardProps {
  post: NewsPost;
  /** Clamp long bodies (front-page teaser); the News page shows the full text. */
  clamp?: boolean;
}

/**
 * A synced Facebook / manual post in the public Record's present-day style. Used by the
 * front page's pulse and the News page. (The member portal renders posts itself, in
 * MemberDashboardPage.)
 */
export default function PostCard({ post, clamp = false }: PostCardProps) {
  const published = new Date(post.publishedAt);
  return (
    <article className="lp-card lp-lift p-6 sm:p-7" data-lp-reveal>
      <div className="flex items-center gap-3 mb-4">
        <span className="lp-seal w-10 h-10" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
            <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
          </svg>
        </span>
        <div>
          <p className="text-[0.9375rem] font-semibold leading-tight">USWAG Official Page</p>
          <p className="text-[0.75rem] lp-ink-muted font-medium">
            <time dateTime={post.publishedAt}>
              {published.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </time>
            {post.source === 'facebook' ? ' · via Facebook' : ' · Official announcement'}
          </p>
        </div>
      </div>

      <p className={`text-[1rem] leading-[1.7] whitespace-pre-wrap ${clamp ? 'line-clamp-6' : ''}`}>{post.body}</p>

      {post.imageUrl && (
        <div className="mt-5 rounded-[10px] overflow-hidden aspect-[16/10] bg-forest/5">
          <img src={post.imageUrl} alt="Photo from this post" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
      )}

      {(post.permalink || post.likeCount != null || post.commentCount != null) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-3 border-t border-[rgb(20_39_24/0.1)]">
          {post.likeCount != null && (
            <span className="lp-small lp-ink-muted lp-lnum">
              {post.likeCount} {post.likeCount === 1 ? 'reaction' : 'reactions'}
            </span>
          )}
          {post.commentCount != null && (
            <span className="lp-small lp-ink-muted lp-lnum">
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
          {post.permalink && (
            <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="lp-link sm:ml-auto">
              View on Facebook <span aria-hidden="true">↗</span>
              <span className="lp-sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
