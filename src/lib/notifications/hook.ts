'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type InboxItem } from './api';

export function useNotifications() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', 'inbox', 'unread'],
    queryFn: () => notificationsApi.inbox('unread', 50),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
    },
  });

  const items: InboxItem[] = data?.items ?? [];

  /** Count unread items whose action_url starts with the given route prefix. */
  function countForRoute(href: string): number {
    if (!href || items.length === 0) return 0;
    return items.filter(
      (i) =>
        !i.read_at &&
        i.action_url &&
        (i.action_url === href || i.action_url.startsWith(href + '/')),
    ).length;
  }

  return {
    unreadCount: data?.unread_count ?? 0,
    items,
    countForRoute,
    markRead: (id: string) => markReadMut.mutate(id),
    markAllRead: () => markAllReadMut.mutate(),
  };
}
