import { apiRequest } from '@/lib/api';

/** SRS Module 15 — Notifications API client. */

export type Channel = 'email' | 'in_app' | 'whatsapp' | 'push' | 'sms';

export interface EventPrefRow {
  key: string;
  label: string;
  description: string;
  category: string;
  critical: boolean;
  channels: Record<Channel, {
    enabled: boolean;
    available: boolean;
    locked: boolean;
  }>;
}

export interface PreferencesResponse {
  categories: Record<string, string>;
  channels: Channel[];
  active_channels: Channel[];
  events: EventPrefRow[];
}

export interface InboxItem {
  id: string;
  event_key: string | null;
  title: string | null;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string | null;
}

export const notificationsApi = {
  preferences: () => apiRequest.get<PreferencesResponse>('/notifications/preferences'),
  savePreferences: (prefs: Array<{ event_key: string; channel: Channel; enabled: boolean }>) =>
    apiRequest.put<{ updated: number }>('/notifications/preferences', { prefs }),

  inbox: (filter: 'unread' | 'all' = 'unread', limit = 30) =>
    apiRequest.get<{ unread_count: number; items: InboxItem[] }>(
      `/notifications/inbox?filter=${filter}&limit=${limit}`
    ),
  markRead: (id: string) => apiRequest.post<null>(`/notifications/inbox/${id}/read`),
  markAllRead: () => apiRequest.post<null>('/notifications/inbox/read-all'),
  destroy: (id: string) => apiRequest.delete<null>(`/notifications/inbox/${id}`),
};
