import { prisma } from '../config/db.js';

export function listPosts() {
  return prisma.post.findMany({ orderBy: { publishedAt: 'desc' } });
}

export function createManualPost(authorId: string, body: string, imageUrl?: string, type: string = 'NEWS') {
  return prisma.post.create({
    data: { source: 'MANUAL', authorId, body, imageUrl, type },
  });
}

// The sync used to return canned "mock_post_*" posts before the Page token existed. Once a real
// sync succeeds, drop any of those left behind so fake news never sits beside real posts.
export function deleteMockSyncedPosts() {
  return prisma.post.deleteMany({ where: { source: 'FACEBOOK', facebookPostId: { startsWith: 'mock_post_' } } });
}

// Called by jobs/facebookSync.job.ts. Upserts by Facebook's own post ID
// so re-running the sync never creates duplicates.
export function upsertSyncedPost(facebookPostId: string, data: { body: string; imageUrl?: string; permalink: string; publishedAt: Date; likeCount?: number; commentCount?: number }) {
  return prisma.post.upsert({
    where: { facebookPostId },
    update: data,
    create: { source: 'FACEBOOK', facebookPostId, ...data },
  });
}
