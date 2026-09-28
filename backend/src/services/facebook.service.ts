import axios from 'axios';
import { env } from '../config/env.js';

// Read-only Graph API client. Never expose FACEBOOK_PAGE_ACCESS_TOKEN
// to the frontend — this service is only ever called from
// jobs/facebookSync.job.ts. See claude.md "Facebook sync".
export async function fetchRecentPagePosts() {
  // TODO: Restore the real Graph API call below once the Facebook Page Access Token is available.
  // const { pageId, pageAccessToken } = env.facebook;
  // const url = `https://graph.facebook.com/v19.0/${pageId}/posts`;
  // const { data } = await axios.get(url, {
  //   params: {
  //     fields: 'id,message,full_picture,permalink_url,created_time',
  //     access_token: pageAccessToken,
  //   },
  // });
  // return data.data as Array<{ id: string; message?: string; full_picture?: string; permalink_url: string; created_time: string }>;

  console.log('[Mock] fetchRecentPagePosts: Returning mock Facebook posts data.');
  return [
    {
      id: 'mock_post_1',
      message: 'USWAG kicks off the new academic year with our first general assembly! 🚀 #USWAG2026',
      full_picture: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800',
      permalink_url: 'https://facebook.com/uswag/posts/mock_post_1',
      created_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: 'mock_post_2',
      message: 'Join us for a mental health awareness seminar this Friday at the Main Hall. Free snacks provided!',
      full_picture: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800',
      permalink_url: 'https://facebook.com/uswag/posts/mock_post_2',
      created_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
    {
      id: 'mock_post_3',
      message: 'Reminder: Membership renewal forms are due by the end of the week.',
      // No full_picture for this one to test optional fields
      permalink_url: 'https://facebook.com/uswag/posts/mock_post_3',
      created_time: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    }
  ] as Array<{ id: string; message?: string; full_picture?: string; permalink_url: string; created_time: string }>;
}
