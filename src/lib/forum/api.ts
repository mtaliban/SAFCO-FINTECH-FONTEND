import { apiRequest } from '@/lib/api';

/** SRS Module 14 — Discussion Forum API client. */

export type CategorySlug = 'questions' | 'ideas' | 'assignments';

export interface ForumCategory {
  slug: CategorySlug;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  supports_accepted_answer: boolean;
  requires_course_context: boolean;
  thread_count: number;
}

export interface AuthorSummary {
  uuid: string;
  name: string;
  avatar: string | null;
}

export interface ThreadSummary {
  uuid: string;
  title: string;
  excerpt: string;
  author: AuthorSummary | null;
  category: { slug: string; name: string; color: string | null; supports_accepted_answer: boolean };
  course: { uuid: string; title: string; slug: string } | null;
  tags: string[];
  replies_count: number;
  votes_score: number;
  views_count: number;
  has_accepted_answer: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string | null;
  last_activity_at: string | null;
}

export interface ThreadDetail extends ThreadSummary {
  body: string;
  assignment: { uuid: string; title: string } | null;
  my_vote: -1 | 0 | 1;
}

export interface PostView {
  uuid: string;
  body: string;
  author: AuthorSummary | null;
  created_at: string | null;
  edited_at: string | null;
  parent_post_id: number | null;
  is_accepted_answer: boolean;
  votes_score: number;
  my_vote: -1 | 0 | 1;
  can_edit: boolean;
}

export interface ThreadShowResponse {
  thread: ThreadDetail;
  posts: PostView[];
  permissions: {
    can_reply: boolean;
    can_edit_thread: boolean;
    can_accept_answer: boolean;
    can_moderate: boolean;
  };
}

export interface ThreadListQuery {
  category?: CategorySlug;
  course_id?: number;
  course_uuid?: string;
  assignment_id?: number;
  assignment_uuid?: string;
  unanswered?: boolean;
  q?: string;
  sort?: 'recent' | 'top' | 'unanswered';
  page?: number;
  per_page?: number;
}

export interface ForumNotification {
  id: string;
  type: 'reply' | 'mention' | 'answer_accepted' | 'subscription';
  thread_uuid: string;
  thread_title: string;
  post_uuid: string | null;
  actor_name: string | null;
  excerpt: string | null;
  read_at: string | null;
  created_at: string | null;
}

const qs = (q: ThreadListQuery = {}): string => {
  const p = new URLSearchParams();
  if (q.category) p.set('category', q.category);
  if (q.course_id) p.set('course_id', String(q.course_id));
  if (q.course_uuid) p.set('course_uuid', q.course_uuid);
  if (q.assignment_id) p.set('assignment_id', String(q.assignment_id));
  if (q.assignment_uuid) p.set('assignment_uuid', q.assignment_uuid);
  if (q.unanswered) p.set('unanswered', '1');
  if (q.q) p.set('q', q.q);
  if (q.sort) p.set('sort', q.sort);
  if (q.page) p.set('page', String(q.page));
  if (q.per_page) p.set('per_page', String(q.per_page));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const forumApi = {
  // Public read
  categories: () =>
    apiRequest.get<{ categories: ForumCategory[] }>('/forum/categories'),
  threads: (q?: ThreadListQuery) =>
    apiRequest.get<{
      data: ThreadSummary[];
      meta: { current_page: number; last_page: number; per_page: number; total: number };
    }>(`/forum/threads${qs(q)}`),
  show: (uuid: string) => apiRequest.get<ThreadShowResponse>(`/forum/threads/${uuid}`),

  // Authenticated write
  createThread: (body: {
    category: CategorySlug;
    title: string;
    body: string;
    course_id?: number;
    course_uuid?: string;
    assignment_id?: number;
    assignment_uuid?: string;
    tags?: string[];
  }) => apiRequest.post<{ uuid: string }>('/forum/threads', body),

  updateThread: (uuid: string, patch: { title?: string; body?: string; tags?: string[] | null }) =>
    apiRequest.patch<null>(`/forum/threads/${uuid}`, patch),

  deleteThread: (uuid: string) => apiRequest.delete<null>(`/forum/threads/${uuid}`),

  moderateThread: (uuid: string, patch: {
    is_pinned?: boolean; is_locked?: boolean; is_hidden?: boolean; moderation_note?: string | null;
  }) => apiRequest.patch<null>(`/forum/threads/${uuid}/moderate`, patch),

  voteThread: (uuid: string, value: -1 | 0 | 1) =>
    apiRequest.post<{ votes_score: number }>(`/forum/threads/${uuid}/vote`, { value }),

  acceptAnswer: (threadUuid: string, postUuid: string) =>
    apiRequest.post<null>(`/forum/threads/${threadUuid}/accept/${postUuid}`),

  subscribe: (uuid: string) => apiRequest.post<null>(`/forum/threads/${uuid}/subscribe`),
  unsubscribe: (uuid: string) => apiRequest.delete<null>(`/forum/threads/${uuid}/subscribe`),

  reply: (threadUuid: string, body: string, parent_post_id?: number) =>
    apiRequest.post<{ uuid: string }>(`/forum/threads/${threadUuid}/posts`,
      { body, parent_post_id: parent_post_id ?? null }),

  updatePost: (uuid: string, body: string) => apiRequest.patch<null>(`/forum/posts/${uuid}`, { body }),
  deletePost: (uuid: string) => apiRequest.delete<null>(`/forum/posts/${uuid}`),
  votePost: (uuid: string, value: -1 | 0 | 1) =>
    apiRequest.post<{ votes_score: number }>(`/forum/posts/${uuid}/vote`, { value }),

  report: (body: {
    target_type: 'thread' | 'post';
    target_uuid: string;
    reason: 'spam' | 'offensive' | 'off_topic' | 'other';
    note?: string;
  }) => apiRequest.post<{ uuid: string }>('/forum/reports', body),

  // Notifications
  notifications: (filter: 'unread' | 'all' = 'unread') =>
    apiRequest.get<{ unread_count: number; data: ForumNotification[] }>(
      `/forum/notifications?filter=${filter}`
    ),
  markNotificationRead: (id: string) =>
    apiRequest.post<null>(`/forum/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    apiRequest.post<null>('/forum/notifications/read-all'),
};
