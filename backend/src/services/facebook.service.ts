import axios from 'axios';
import { env } from '../config/env.js';

export interface FacebookPagePost {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url: string;
  created_time: string;
}

export function isFacebookConfigured() {
  return Boolean(env.facebook.pageId && env.facebook.pageAccessToken);
}

// Read-only Graph API client. Never expose FACEBOOK_PAGE_ACCESS_TOKEN
// to the frontend — this service is only ever called from
// jobs/facebookSync.job.ts. See claude.md "Facebook sync".
export async function fetchRecentPagePosts(): Promise<FacebookPagePost[]> {
  const { pageId, pageAccessToken } = env.facebook;
  if (!isFacebookConfigured()) {
    throw new Error('Facebook sync is not configured: set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN.');
  }

  try {
    const { data } = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/posts`, {
      params: {
        fields: 'id,message,full_picture,permalink_url,created_time',
        limit: 25,
        access_token: pageAccessToken,
      },
      timeout: 15_000,
    });
    return data.data as FacebookPagePost[];
  } catch (err) {
    // Graph errors echo request details; surface Meta's message but never the token-bearing URL.
    const metaMessage = axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined;
    throw new Error(`Facebook Graph API request failed${metaMessage ? `: ${metaMessage}` : ''}`);
  }
}
