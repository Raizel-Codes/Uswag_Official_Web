import type { NewsPost } from '@/types/post.types';
import { formatRelativeDate } from '@/utils/formatters';

interface NewsFeedCardProps {
  post: NewsPost;
}

export default function NewsFeedCard({ post }: NewsFeedCardProps) {
  return (
    <div className="bg-white p-6 md:p-8 border border-forest/10 shadow-[0_2px_10px_rgba(20,39,24,0.02)] transition-shadow hover:shadow-[0_8px_24px_rgba(20,39,24,0.05)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#1877F2]">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
            <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
          </svg>
        </div>
        <div>
          <div className="text-[0.9375rem] font-bold text-forest leading-tight">USWAG Official Page</div>
          <div className="text-[0.75rem] text-forest/60 font-medium mt-0.5">
            {formatRelativeDate(post.publishedAt)}
            {post.source === 'facebook' ? ' · via Facebook' : ' · via Manual post'}
          </div>
        </div>
      </div>
      
      <p className="mb-5 text-[1.0625rem] leading-[1.65] text-forest/80 whitespace-pre-line">
        {post.body}
      </p>
      
      {post.imageUrl && (
        <div className="mb-5 relative w-full pt-[56.25%] bg-mist border border-forest/5 overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post media"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="flex gap-6 text-[0.8125rem] font-semibold text-forest/50 border-t border-forest/5 pt-4 mt-2">
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-rose-500">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          {post.likeCount ?? 0}
        </span>
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {post.commentCount ?? 0}
        </span>
        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:text-forest transition-colors ml-auto"
          >
            Read full post <span className="text-lg leading-none">→</span>
          </a>
        )}
      </div>
    </div>
  );
}
