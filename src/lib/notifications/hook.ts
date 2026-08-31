'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type InboxItem } from './api';
import { subscribe } from '@/lib/mqtt';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

/**
 * SRS Module 15 — Real-time notification hook.
 *
 * Two-layer delivery:
 *  1. MQTT (instant): subscribes to safco/lms/notifications/{userId}
 *     When the backend InAppChannel fires, it publishes a lightweight ping here.
 *     This invalidates the TanStack Query cache immediately → badge updates without waiting.
 *
 *  2. Polling fallback (60 s): in case MQTT is temporarily disconnected,
 *     the standard refetchInterval still catches any missed notifications.
 */
export function useNotifications() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  // ── Layer 1: MQTT real-time ping ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const topic = `safco/lms/notifications/${userId}`;
    const unsub = subscribe(topic, (payload: unknown) => {
      const p = payload as { title?: string; body?: string; action_url?: string } | null;
      const title = p?.title ?? '🔔 Notification mpya';
      const body  = p?.body ? ` — ${p.body.substring(0, 80)}` : '';
      const url   = p?.action_url;

      // Show toast — clicking navigates to the action page
      const msg = `🔔 ${title}${body}`;
      if (url) {
        toast(msg, {
          duration: 6000,
          style: { cursor: 'pointer', maxWidth: 380 },
          onClick: () => { window.location.pathname = url; },
        } as Parameters<typeof toast>[1]);
      } else {
        toast(msg, { duration: 5000, style: { maxWidth: 380 } });
      }

      // Invalidate relevant queries so badges update instantly
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
      if (url?.startsWith('/admin/course-approvals'))
        qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
      if (url?.startsWith('/admin/users'))
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (url?.startsWith('/trainer/courses'))
        qc.invalidateQueries({ queryKey: ['trainer', 'courses'] });
    });

    return unsub;
  }, [userId, qc]);

  // ── Layer 2: polling fallback (60 s) ──────────────────────────────────────
  const { data } = useQuery({
    queryKey: ['notifications', 'inbox', 'unread'],
    queryFn: () => notificationsApi.inbox('unread', 50),
    refetchInterval: 60_000,   // reduced from 30 s since MQTT drives instant updates
    staleTime: 30_000,
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
