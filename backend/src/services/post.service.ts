import { prisma } from '../config/db.js';

export function listPosts() {
  return prisma.post.findMany({ orderBy: { publishedAt: 'desc' } });
}

export function createManualPost(authorId: string, body: string, imageUrl?: string, type: string = 'NEWS') {
  return prisma.post.create({
    data: { source: 'MANUAL', authorId, body, imageUrl, type },
  });
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
