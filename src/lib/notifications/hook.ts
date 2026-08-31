'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type InboxItem } from './api';
import { getEcho } from '@/lib/echo';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

/**
 * SRS Module 15 — Real-time notification hook.
 *
 * Two-layer delivery:
 *  1. Laravel Reverb WebSocket (instant): listens on private-user.{userId}
 *     Backend broadcasts InAppNotificationSent the moment a notification is
 *     saved → badge and toast appear with zero polling delay.
 *
 *  2. Polling fallback (15 s): catches any push that arrived while the
 *     WebSocket was briefly disconnected.
 */
export function useNotifications() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  // ── Layer 1: Reverb real-time ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`user.${userId}`);

    channel.listen('.notification.sent', (data: {
      id: string; event_key: string; title: string; body: string; action_url?: string;
    }) => {
      const { title, body, action_url: url } = data;
      const msg = `🔔 ${title ?? 'Notification mpya'}${body ? ` — ${body.substring(0, 80)}` : ''}`;

      if (url) {
        toast(msg, {
          duration: 6000,
          style: { cursor: 'pointer', maxWidth: 380 },
          onClick: () => { window.location.pathname = url; },
        } as Parameters<typeof toast>[1]);
      } else {
        toast(msg, { duration: 5000, style: { maxWidth: 380 } });
      }

      // Invalidate inbox + page-specific queries for instant badge refresh
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
      if (url?.startsWith('/admin/course-approvals'))
        qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
      if (url?.startsWith('/admin/users'))
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (url?.startsWith('/trainer/courses'))
        qc.invalidateQueries({ queryKey: ['trainer', 'courses'] });
    });

    return () => {
      channel.stopListening('.notification.sent');
      echo.leave(`user.${userId}`);
    };
  }, [userId, qc]);

  // ── Layer 2: polling fallback (15 s) ──────────────────────────────────────
  const { data } = useQuery({
    queryKey: ['notifications', 'inbox', 'unread'],
    queryFn: () => notificationsApi.inbox('unread', 50),
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: false,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] }),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] }),
  });

  const items: InboxItem[] = data?.items ?? [];

  function countForRoute(href: string): number {
    if (!href || items.length === 0) return 0;
    return items.filter(
      (i) => !i.read_at && i.action_url &&
        (i.action_url === href || i.action_url.startsWith(href + '/')),
    ).length;
  }

  const markReadForRoute = useCallback(
    (href: string) => {
      if (!href || items.length === 0) return;
      items
        .filter((i) => !i.read_at && i.action_url &&
          (i.action_url === href || i.action_url.startsWith(href + '/')))
        .forEach((i) => markReadMut.mutate(i.id));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  return {
    unreadCount: data?.unread_count ?? 0,
    items,
    countForRoute,
    markReadForRoute,
    markRead: (id: string) => markReadMut.mutate(id),
    markAllRead: () => markAllReadMut.mutate(),
  };
}
