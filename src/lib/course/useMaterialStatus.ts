'use client';

import { useEffect, useState } from 'react';
import { subscribe } from '@/lib/mqtt';
import { api } from '@/lib/api';

export type MaterialStatus = {
  status: 'pending' | 'processing' | 'ready' | 'failed';
  progress: number;
  error?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  page_count?: number | null;
};

/**
 * Subscribes to real-time material processing status via MQTT.
 * Falls back to a single HTTP status fetch on mount so we always
 * start with a known state (in case the event was published before
 * the component mounted).
 */
export function useMaterialStatus(
  materialUuid: string | undefined,
  initial?: Partial<MaterialStatus>
): MaterialStatus {
  const [state, setState] = useState<MaterialStatus>({
    status: (initial?.status as MaterialStatus['status']) ?? 'ready',
    progress: initial?.progress ?? 100,
    error: initial?.error ?? null,
    thumbnail_url: initial?.thumbnail_url ?? null,
    duration_seconds: initial?.duration_seconds ?? null,
    page_count: initial?.page_count ?? null,
  });

  useEffect(() => {
    if (!materialUuid) return;

    // Initial fetch — settles any race with MQTT
    let cancelled = false;
    api.get(`/materials/${materialUuid}/status`)
      .then((r) => {
        if (cancelled) return;
        const d = r.data.data;
        setState((s) => ({ ...s, ...d, progress: Number(d.progress ?? 0) }));
      })
      .catch(() => { /* ignore, MQTT will fill in */ });

    // Subscribe for live updates
    const unsub = subscribe(`safco/lms/material/${materialUuid}/status`, (payload) => {
      if (typeof payload !== 'object' || payload === null) return;
      const p = payload as Partial<MaterialStatus>;
      setState((s) => ({ ...s, ...p, progress: Number(p.progress ?? s.progress) }));
    });

    return () => { cancelled = true; unsub(); };
  }, [materialUuid]);

  return state;
}
