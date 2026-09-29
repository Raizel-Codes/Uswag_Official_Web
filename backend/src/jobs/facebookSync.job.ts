import cron from 'node-cron';
import { fetchRecentPagePosts, isFacebookConfigured } from '../services/facebook.service.js';
import { deleteMockSyncedPosts, upsertSyncedPost } from '../services/post.service.js';
import { logger } from '../utils/logger.js';

// In-memory sync status — a single persistent backend process (per claude.md,
// this is why Facebook sync can't run on serverless), so this is safe to hold
// in memory. Resets on process restart, which is an acceptable tradeoff for
// a "last synced" indicator rather than a durable audit record.
let lastSyncedAt: string | null = null;
let lastSyncCount: number | null = null;
let lastSyncError: string | null = null;
let isSyncing = false;

export function getSyncStatus() {
  return { lastSyncedAt, lastSyncCount, lastSyncError, isSyncing };
}

// Runs the actual sync. Shared by the cron schedule and the manual
// "Sync Now" trigger so both paths dedupe identically via upsertSyncedPost.
export async function runFacebookSync() {
  if (isSyncing) return getSyncStatus();
  isSyncing = true;
  try {
    const posts = await fetchRecentPagePosts();
    for (const post of posts) {
      await upsertSyncedPost(post.id, {
        body: post.message ?? '',
        imageUrl: post.full_picture,
        permalink: post.permalink_url,
        publishedAt: new Date(post.created_time),
      });
    }
    await deleteMockSyncedPosts();
    lastSyncedAt = new Date().toISOString();
    lastSyncCount = posts.length;
    lastSyncError = null;
    logger.info(`Facebook sync: processed ${posts.length} posts`);
  } catch (err) {
    lastSyncError = err instanceof Error ? err.message : 'Sync failed';
    logger.error('Facebook sync failed', err);
  } finally {
    isSyncing = false;
  }
  return getSyncStatus();
}

// Runs every 30 minutes. Dedup happens in post.service.ts via
// upsertSyncedPost's facebookPostId key, so re-running this is always safe.
// See claude.md "Facebook sync" — this is the only place the Graph API
// should be called from.
export function startFacebookSyncJob() {
  if (!isFacebookConfigured()) {
    // A manual "Sync Now" still reports the missing config; the schedule just doesn't spam errors.
    logger.warn('Facebook sync not scheduled: FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN are not set.');
    return;
  }
  cron.schedule('*/30 * * * *', () => {
    void runFacebookSync();
  });
}
