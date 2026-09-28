import { api } from './api';
import type { NewsPost } from '@/types/post.types';

export async function listNewsPosts(): Promise<NewsPost[]> {
  const { data } = await api.get<{ success: boolean; data: NewsPost[] }>('/posts');
  return data.data;
}

export async function createManualPost(body: string, imageUrl?: string, type: 'NEWS' | 'MINUTE' | 'ANNOUNCEMENT' = 'NEWS'): Promise<NewsPost> {
  const { data } = await api.post<{ success: boolean; data: NewsPost }>('/posts', { body, imageUrl, type });
  return data.data;
}

export interface FacebookSyncStatus {
  lastSyncedAt: string | null;
  lastSyncCount: number | null;
  lastSyncError: string | null;
  isSyncing: boolean;
}

export async function getFacebookSyncStatus(): Promise<FacebookSyncStatus> {
  const { data } = await api.get<{ success: boolean; data: FacebookSyncStatus }>('/posts/sync-status');
  return data.data;
}

export async function triggerFacebookSync(): Promise<FacebookSyncStatus> {
  const { data } = await api.post<{ success: boolean; data: FacebookSyncStatus }>('/posts/sync');
  return data.data;
}
