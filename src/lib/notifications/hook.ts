'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type InboxItem } from './api';
import { subscribe } from '@/lib/mqtt';
import { useAuthStore } from '@/store/auth';

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
    const unsub = subscribe(topic, () => {
      // New notification arrived — invalidate both the badge query and the
      // full inbox so every component that calls this hook refreshes at once.
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
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
