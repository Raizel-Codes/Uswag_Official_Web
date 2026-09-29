// Content & News — the PRO's Work module and the Super Admin's /admin/content.
// Posting and the Facebook sync status/trigger are PRO-scoped on the server
// (requireOfficerPosition('PRO') in post.routes.ts; the Super Admin always passes).
// Sync is read-only: it pulls posts the officers already made on the Page (CLAUDE.md).
// `?focus=new-post | fb-sync` jumps to a section.

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePortalToast } from '@/hooks/usePortalToast';
import { useFocusParam } from '@/hooks/useFocusParam';
import { listNewsPosts, createManualPost, getFacebookSyncStatus, triggerFacebookSync } from '@/services/postService';
import type { NewsPost } from '@/types/post.types';
import { formatRelativeDate } from '@/utils/formatters';
import { isSuperAdminEquivalent } from '@/utils/roles';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import PortalToast from '@/components/portal/PortalToast';
import { apiError } from '@/components/admin/format';

const TYPE_LABEL: Record<NewsPost['type'], string> = { NEWS: 'News', MINUTE: 'Minutes', ANNOUNCEMENT: 'Announcement' };

function FacebookSyncPanel({ onResult }: { onResult: (msg: string, tone?: 'ok' | 'error') => void }) {
  const queryClient = useQueryClient();
  const { data: status, isError } = useQuery({ queryKey: ['posts', 'sync-status'], queryFn: getFacebookSyncStatus, refetchInterval: 30_000 });
  const sync = useMutation({
    mutationFn: triggerFacebookSync,
    onSuccess: (result) => {
      queryClient.setQueryData(['posts', 'sync-status'], result);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onResult(result.lastSyncError ? `Sync finished with an error: ${result.lastSyncError}` : `Synced${result.lastSyncCount != null ? ` · ${result.lastSyncCount} new` : ''}`, result.lastSyncError ? 'error' : 'ok');
    },
    onError: (err) => onResult(apiError(err, 'Sync failed. Please try again.'), 'error'),
  });

  const syncing = status?.isSyncing || sync.isPending;
  const badge = isError
    ? { cls: 'mp-standing--neutral', text: 'Status unavailable' }
    : status?.lastSyncError
      ? { cls: 'mp-standing--rejected', text: 'Last sync failed' }
      : status?.lastSyncedAt
        ? { cls: 'mp-standing--active', text: 'Syncing' }
        : { cls: 'mp-standing--neutral', text: 'Not synced yet' };

  return (
    <Panel title="Facebook Page sync" id="fb-sync" className="scroll-mt-6" aside={<span className={`mp-standing ${badge.cls}`}>{badge.text}</span>}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="mp-seal w-12 h-12 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">USWAG Official Page</p>
          <p className="mp-muted text-[0.875rem]">
            {status?.lastSyncedAt ? `Last synced ${formatRelativeDate(status.lastSyncedAt)}` : 'Not synced yet'} · checks automatically about every 30 minutes
          </p>
          {status?.lastSyncError && <p className="mp-alert mt-2 !py-2 !text-[0.875rem]">{status.lastSyncError}</p>}
        </div>
        <button type="button" onClick={() => sync.mutate()} disabled={syncing} className="mp-btn mp-btn--primary shrink-0">
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
    </Panel>
  );
}

export default function ContentManagerPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast, show } = usePortalToast();
  const [body, setBody] = useState('');
  const { data: posts, isLoading, isError } = useQuery<NewsPost[]>({ queryKey: ['posts'], queryFn: listNewsPosts, staleTime: 2 * 60 * 1000 });
  useFocusParam(!isLoading);

  const publish = useMutation({
    mutationFn: (text: string) => createManualPost(text),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      show('Post published');
    },
    onError: (err) => show(apiError(err, 'Could not publish. Please try again.'), 'error'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (body.trim()) publish.mutate(body.trim());
  }

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow={isSuperAdminEquivalent(user) ? 'Governance · Content' : 'Work · Public Relations'}
        title="Content & news"
        lead="Write updates for members and the public News page. Facebook posts come in automatically."
      />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Panel title="New post" id="new-post" className="scroll-mt-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="post-body" className="ap-label">Update</label>
              <textarea id="post-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write an update for members…" className="ap-input" />
              <p className="ap-hint">Published to members and the public News page right away.</p>
            </div>
            <button type="submit" disabled={publish.isPending || !body.trim()} className="mp-btn mp-btn--primary">
              {publish.isPending ? 'Publishing…' : 'Publish post'}
            </button>
          </form>
        </Panel>
        <FacebookSyncPanel onResult={(m, tone) => show(m, tone)} />
      </div>

      <Panel title="Posts" aside={posts && <span className="mp-muted">{posts.length}</span>} flush>
        {isError ? (
          <p role="alert" className="m-5 mp-alert">We couldn’t load posts.</p>
        ) : isLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>
        ) : !posts?.length ? (
          <p className="p-8 mp-muted text-center">No posts yet.</p>
        ) : (
          <ul className="ap-list">
            {posts.map((p) => (
              <li key={p.id} className="ap-row items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] line-clamp-2">{p.body || (p.imageUrl ? 'Image post' : 'Empty post')}</p>
                  <p className="mp-muted text-[0.8125rem] mt-1">
                    {formatRelativeDate(p.publishedAt)}
                    {p.source === 'facebook' && ` · ${p.likeCount ?? 0} likes · ${p.commentCount ?? 0} comments`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`mp-standing ${p.source === 'facebook' ? 'mp-standing--info' : 'mp-standing--neutral'}`}>{p.source === 'facebook' ? 'Facebook' : TYPE_LABEL[p.type]}</span>
                  {p.permalink && (
                    <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="mp-link text-[0.8125rem]">
                      Open<span className="mp-sr-only"> on Facebook (new tab)</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <PortalToast toast={toast} />
    </div>
  );
}
