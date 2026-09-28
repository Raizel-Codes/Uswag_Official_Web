import type { Request, Response } from 'express';
import * as postService from '../services/post.service.js';
import { runFacebookSync, getSyncStatus } from '../jobs/facebookSync.job.js';
import { ok } from '../utils/response.js';

// The frontend's NewsPost type/comparisons expect lowercase 'facebook' |
// 'manual' (see types/post.types.ts), but Prisma's PostSource enum is
// uppercase. Without this mapping every post — including real
// Facebook-synced ones — silently renders as "Manual post" because
// `post.source === 'facebook'` never matches 'FACEBOOK'.
function toPostDTO(post: Awaited<ReturnType<typeof postService.listPosts>>[number]) {
  return { ...post, source: post.source.toLowerCase() };
}

export async function listPosts(_req: Request, res: Response) {
  const posts = await postService.listPosts();
  return ok(res, posts.map(toPostDTO));
}

// Scope: PRO (or Super Admin) — enforced via requireOfficerPosition('PRO') in post.routes.ts
export async function createManualPost(req: Request, res: Response) {
  const { body, imageUrl, type } = req.body;
  const post = await postService.createManualPost(req.user!.id, body, imageUrl, type);
  return ok(res, toPostDTO(post), 201);
}

// Manual "Sync Now" trigger — runs the same code path as the 30-minute
// cron job (facebookSync.job.ts), so results are identical either way.
export async function syncNow(_req: Request, res: Response) {
  const status = await runFacebookSync();
  return ok(res, status);
}

export async function syncStatus(_req: Request, res: Response) {
  return ok(res, getSyncStatus());
}
