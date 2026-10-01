export type PostSource = 'facebook' | 'manual';

export type PostType = 'NEWS' | 'MINUTE' | 'ANNOUNCEMENT';

export interface NewsPost {
  id: string;
  source: PostSource;
  type: PostType;
  body: string;
  imageUrl?: string;
  permalink?: string; // present for Facebook-synced posts
  publishedAt: string;
  likeCount?: number;
  commentCount?: number;
}

export interface AnnouncementNotification {
  id: string;
  /** What it's about: picks the icon. */
  kind: 'announcement' | 'event' | 'membership' | string;
  /** In-app path it opens, e.g. "/dashboard/events". */
  url: string | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}
