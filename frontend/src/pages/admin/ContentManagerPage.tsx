import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { listNewsPosts, createManualPost, getFacebookSyncStatus, triggerFacebookSync } from '@/services/postService';
import type { NewsPost } from '@/types/post.types';
import { formatRelativeDate } from '@/utils/formatters';
import { isSuperAdminEquivalent } from '@/utils/roles';

// ---------------------------------------------------------------------------
// Facebook sync status panel — shared between mobile and desktop layouts.
// Backed by real status from GET /posts/sync-status and a real manual
// trigger via POST /posts/sync (both hit the same code path as the
// 30-minute cron job in facebookSync.job.ts).
// ---------------------------------------------------------------------------
function FacebookSyncPanel({ desktop }: { desktop?: boolean }) {
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['posts', 'sync-status'],
    queryFn: getFacebookSyncStatus,
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: triggerFacebookSync,
    onSuccess: (result) => {
      queryClient.setQueryData(['posts', 'sync-status'], result);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const isSyncing = status?.isSyncing || syncMutation.isPending;
  const lastSyncedLabel = status?.lastSyncedAt
    ? `Last synced ${formatRelativeDate(status.lastSyncedAt)}`
    : 'Not synced yet';

  if (desktop) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-heading font-bold text-[14.5px] text-forest">Facebook Page Sync</h3>
          <span className="bg-successBg text-success font-bold px-2.5 py-1 rounded-full text-[11px]">Connected</span>
        </div>
        <div className="flex items-center gap-3.5 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1877F2]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
              <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[13.5px] text-forest">USWAG Official Page</div>
            <div className="text-[11.5px] text-gray-500 mt-0.5">
              {lastSyncedLabel} · auto-checks roughly every 30 minutes
              {status?.lastSyncError && <span className="text-red-500"> · Last attempt failed: {status.lastSyncError}</span>}
            </div>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={isSyncing}
            className="shrink-0 rounded-xl bg-primary text-white font-bold text-[12.5px] px-4 py-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSyncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm mb-2.5">
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#1877F2]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
          <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-heading text-[13px] font-bold text-forest">USWAG Official Page</h4>
        <div className="text-[11px] text-gray-500 mt-0.5 truncate">{lastSyncedLabel}</div>
      </div>
      <button
        onClick={() => syncMutation.mutate()}
        disabled={isSyncing}
        className="shrink-0 bg-primary text-white font-bold px-3 py-1.5 rounded-full text-[10.5px] whitespace-nowrap disabled:opacity-50 transition-colors"
      >
        {isSyncing ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  );
}

const SOURCE_BADGE: Record<NewsPost['source'], string> = {
  facebook: 'bg-gray-100 text-gray-600',
  manual: 'bg-amber-50 text-amber-600',
};

function engagementLabel(post: NewsPost) {
  if (post.source !== 'facebook') return '—';
  return `${post.likeCount ?? 0} ❤ · ${post.commentCount ?? 0} 💬`;
}

export default function ContentManagerPage() {
  const { user } = useAuth();
  const isDesktop = isSuperAdminEquivalent(user);
  const queryClient = useQueryClient();
  const [newPostBody, setNewPostBody] = useState('');

  const { data: posts, isLoading, isError } = useQuery<NewsPost[]>({
    queryKey: ['posts'],
    queryFn: listNewsPosts,
    staleTime: 2 * 60 * 1000,
  });

  const createPostMutation = useMutation({
    mutationFn: (body: string) => createManualPost(body),
    onSuccess: () => {
      setNewPostBody('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Ideally we'd use a real toast here, falling back to alert for MVP
      alert('Post published');
    },
  });

  const handlePublish = () => {
    if (!newPostBody.trim()) return;
    createPostMutation.mutate(newPostBody);
  };

  // -------------------------------------------------------------------------
  // Desktop (Super Admin) — table layout matching prototype/super-admin.html
  // #view-content: sync panel + Source/Engagement/Status table.
  // -------------------------------------------------------------------------
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-mist px-6 md:px-8 py-6 pb-16">
        <div className="mb-6">
          <h1 className="font-heading text-[22px] font-bold text-forest">Content &amp; News</h1>
          <div className="text-[13px] text-gray-500 mt-1">Facebook sync status and manual posts</div>
        </div>

        <FacebookSyncPanel desktop />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-[14.5px] text-forest">Manual Post</h3>
          </div>
          <div className="p-5">
            <textarea
              placeholder="Write an update for members..."
              value={newPostBody}
              onChange={(e) => setNewPostBody(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-[13px] bg-gray-50 outline-none text-forest min-h-[80px] resize-y mb-3 focus:border-primary/50 focus:bg-white transition-colors"
            />
            <button
              onClick={handlePublish}
              disabled={createPostMutation.isPending || !newPostBody.trim()}
              className="rounded-xl bg-primary text-white font-bold text-[13px] px-5 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createPostMutation.isPending ? 'Publishing…' : 'Publish Post'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-[14.5px] text-forest">Synced &amp; Manual Posts</h3>
          </div>

          {isError ? (
            <div className="p-6 text-[12.5px] text-red-600">Failed to load posts.</div>
          ) : isLoading ? (
            <div className="p-5 space-y-2.5">
              {[1, 2, 3].map((n) => <div key={n} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : posts?.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No posts available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Post</th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Source</th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Date</th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Engagement</th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts?.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-[13px] font-bold text-forest max-w-[320px] truncate">
                        {post.body || (post.imageUrl ? '[Image Post]' : '[Empty Post]')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${SOURCE_BADGE[post.source]}`}>
                          {post.source}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] text-gray-600">{formatRelativeDate(post.publishedAt)}</td>
                      <td className="px-5 py-3.5 text-[12.5px] text-gray-600">{engagementLabel(post)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-successBg text-success">Published</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Mobile (PRO / Officer Admin) — card list, unchanged.
  // -------------------------------------------------------------------------
  return (
    <div className="px-5 pb-8">
      <div className="mb-4">
        <label className="block text-[11.5px] font-bold mb-1.5 text-forest">New Post</label>
        <textarea
          placeholder="Write an update for members..."
          value={newPostBody}
          onChange={(e) => setNewPostBody(e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-100 text-[13px] bg-white shadow-sm outline-none text-forest min-h-[70px] resize-y mb-3 focus:border-primary/50 transition-colors"
        />
        <button
          onClick={handlePublish}
          disabled={createPostMutation.isPending || !newPostBody.trim()}
          className="w-full p-3.5 rounded-xl bg-primary text-white font-bold text-[13px] hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {createPostMutation.isPending ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>

      <div className="flex items-center justify-between my-5">
        <h3 className="font-heading text-[14.5px] font-bold text-forest">Facebook Sync</h3>
      </div>
      <FacebookSyncPanel />

      <div className="flex items-center justify-between my-5">
        <h3 className="font-heading text-[14.5px] font-bold text-forest">Recent Posts</h3>
      </div>

      {isError && (
        <div className="text-[12.5px] text-red-500 bg-red-50 p-4 rounded-2xl border border-red-200 mb-2.5">
          Failed to load posts.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm animate-pulse mb-2.5">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-gray-200" />
            <div className="h-2 w-1/2 rounded bg-gray-100" />
          </div>
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-[12.5px] text-gray-500 bg-white p-4 rounded-2xl shadow-sm text-center border border-gray-100">
          No posts available.
        </div>
      ) : (
        posts?.map((post) => (
          <div key={post.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm mb-2.5">
            <div className="flex-1 min-w-0">
              <h4 className="font-heading text-[13px] font-bold text-forest truncate">
                {post.body || (post.imageUrl ? '[Image Post]' : '[Empty Post]')}
              </h4>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {post.source === 'facebook'
                  ? `${post.likeCount ?? 0} ❤ · ${post.commentCount ?? 0} 💬 · Facebook`
                  : `Manual post · ${formatRelativeDate(post.publishedAt)}`}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
