'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type InboxItem } from './api';
import { getEcho } from '@/lib/echo';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

/**
 * SRS Module 15 — Real-time notification system.
 *
 * TWO separate hooks — this separation is critical:
 *
 * useNotificationsSubscription()
 *   → Call ONCE, at the top of DashboardLayout.
 *   → Owns the Reverb WebSocket subscription + shows toasts.
 *   → Multiple callers would create duplicate subscriptions and
 *     duplicate toasts, so this must only be mounted once.
 *
 * useNotifications()
 *   → Call anywhere: sidebar, pages, badge components.
 *   → Polling query + mutations + countForRoute helper.
 *   → No WebSocket side-effects — safe to call many times.
 */

const INBOX_KEY = ['notifications', 'inbox'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Reverb subscription — ONE instance only (DashboardLayout)
// ─────────────────────────────────────────────────────────────────────────────
export function useNotificationsSubscription() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

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
          onClick: () => { window.location.href = url; },
        } as Parameters<typeof toast>[1]);
      } else {
        toast(msg, { duration: 5000, style: { maxWidth: 380 } });
      }

      // Invalidate inbox so badge + page-specific queries refresh instantly
      qc.invalidateQueries({ queryKey: INBOX_KEY });
      if (url?.startsWith('/admin/course-approvals'))
        qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
      if (url?.startsWith('/admin/users'))
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (url?.startsWith('/trainer/courses'))
        qc.invalidateQueries({ queryKey: ['trainer', 'courses'] });
    });

    // Only stop listening — do NOT echo.leave(). Leaving the channel would
    // unsubscribe from Reverb entirely and break any other subscriber.
    // The channel stays alive as long as the Echo singleton lives (until logout).
    return () => {
      channel.stopListening('.notification.sent');
    };
  }, [userId, qc]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Data hook — safe to call from sidebar, pages, anywhere
// ─────────────────────────────────────────────────────────────────────────────
export function useNotifications() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: [...INBOX_KEY, 'unread'],
    queryFn: () => notificationsApi.inbox('unread', 50),
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: false,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INBOX_KEY }),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: INBOX_KEY }),
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
