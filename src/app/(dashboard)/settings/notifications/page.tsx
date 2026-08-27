'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Loader2, Save, Bell, Mail, MessageCircle, Smartphone,
  MessageSquare, Lock, ArrowLeft, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsApi, type Channel, type EventPrefRow } from '@/lib/notifications/api';

const CHANNEL_CFG: Record<Channel, {
  icon: React.ElementType; label: string;
  activeBg: string; activeText: string; activeBorder: string;
}> = {
  email:    { icon: Mail,           label: 'Email',     activeBg: 'bg-blue-100',    activeText: 'text-blue-800',    activeBorder: 'ring-blue-400' },
  in_app:   { icon: Bell,           label: 'In-App',    activeBg: 'bg-indigo-100',  activeText: 'text-indigo-800',  activeBorder: 'ring-indigo-400' },
  whatsapp: { icon: MessageCircle,  label: 'WhatsApp',  activeBg: 'bg-emerald-100', activeText: 'text-emerald-800', activeBorder: 'ring-emerald-400' },
  push:     { icon: Smartphone,     label: 'Push',      activeBg: 'bg-orange-100',  activeText: 'text-orange-800',  activeBorder: 'ring-orange-400' },
  sms:      { icon: MessageSquare,  label: 'SMS',       activeBg: 'bg-teal-100',    activeText: 'text-teal-800',    activeBorder: 'ring-teal-400' },
};

export default function NotificationSettingsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsApi.preferences(),
  });

  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  const saveMut = useMutation({
    mutationFn: () => {
      const prefs = Object.entries(dirty).map(([k, enabled]) => {
        const [event_key, channel] = k.split('|');
        return { event_key, channel: channel as Channel, enabled };
      });
      return notificationsApi.savePreferences(prefs);
    },
    onSuccess: () => {
      toast.success('Preferences saved');
      setDirty({});
      refetch();
    },
    onError: () => toast.error('Failed to save'),
  });

  const events = data?.events ?? [];
  const activeChannels = data?.active_channels ?? [];
  const channels = data?.channels ?? [];
  const dirtyCount = Object.keys(dirty).length;

  const grouped = useMemo(() => {
    const m = new Map<string, EventPrefRow[]>();
    for (const e of events) {
      if (!m.has(e.category)) m.set(e.category, []);
      m.get(e.category)!.push(e);
    }
    return Array.from(m.entries());
  }, [events]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-36 animate-pulse" style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#6366f1 100%)' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const isEnabled = (row: EventPrefRow, ch: Channel) => {
    const k = `${row.key}|${ch}`;
    return k in dirty ? dirty[k] : row.channels[ch].enabled;
  };

  const toggle = (row: EventPrefRow, ch: Channel) => {
    const info = row.channels[ch];
    if (info.locked) { toast.error('This notification is required and cannot be disabled.'); return; }
    if (!info.available) { toast('This channel is coming soon.', { icon: '🔜' }); return; }
    const k = `${row.key}|${ch}`;
    const original = info.enabled;
    const next = !isEnabled(row, ch);
    setDirty((d) => {
      const copy = { ...d };
      if (next === original) delete copy[k]; else copy[k] = next;
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <Link href="/notifications"
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white font-semibold text-sm mb-4 transition">
            <ArrowLeft className="w-4 h-4" /> Notification Inbox
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-2">
                <Bell className="w-4 h-4" /> SAFCO FINTECH LMS · Notification Preferences
              </div>
              <h1 className="text-3xl font-black text-white">Notification Settings</h1>
              <p className="text-indigo-200 text-sm mt-1">
                Choose exactly what you receive on each channel. Required notifications cannot be disabled.
              </p>
            </div>
            <button
              disabled={dirtyCount === 0 || saveMut.isPending}
              onClick={() => saveMut.mutate()}
              className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold px-5 py-2.5 rounded-xl transition shadow-lg text-sm whitespace-nowrap"
            >
              {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes {dirtyCount > 0 && <span className="ml-1 opacity-70 text-xs">({dirtyCount})</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Channel legend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Available channels</div>
          <div className="flex flex-wrap gap-2">
            {channels.map((c) => {
              const cfg = CHANNEL_CFG[c];
              const active = activeChannels.includes(c);
              const Icon = cfg.icon;
              return (
                <div
                  key={c}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${
                    active
                      ? `${cfg.activeBg} ${cfg.activeText} border-current`
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cfg.label}
                  {!active && (
                    <span className="text-[9px] uppercase font-black tracking-widest bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event groups */}
        {grouped.map(([catKey, rows]) => (
          <div key={catKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="font-bold text-slate-900 text-sm">{data.categories[catKey] ?? catKey}</div>
              <div className="hidden md:flex items-center gap-3">
                {channels.map((c) => {
                  const cfg = CHANNEL_CFG[c];
                  const Icon = cfg.icon;
                  const active = activeChannels.includes(c);
                  return (
                    <div key={c} className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest w-16 justify-center ${active ? 'text-slate-600' : 'text-slate-300'}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event rows */}
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div key={row.key} className="flex items-center gap-4 px-6 py-4 flex-wrap hover:bg-slate-50/50 transition">
                  <div className="flex-1 min-w-[260px]">
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      {row.label}
                      {row.critical && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Lock className="w-2.5 h-2.5" /> Required
                        </span>
                      )}
                    </div>
                    {row.description && (
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{row.description}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {channels.map((ch) => {
                      const cfg = CHANNEL_CFG[ch];
                      const Icon = cfg.icon;
                      const info = row.channels[ch];
                      const enabled = isEnabled(row, ch);
                      const isAvailable = activeChannels.includes(ch);

                      return (
                        <button
                          key={ch}
                          onClick={() => toggle(row, ch)}
                          title={
                            info.locked ? `${cfg.label} — required, cannot disable`
                            : !info.available ? `${cfg.label} — coming soon`
                            : !isAvailable ? `${cfg.label} — not yet available`
                            : enabled ? `Disable ${cfg.label}` : `Enable ${cfg.label}`
                          }
                          className={`relative w-16 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition border ${
                            !info.available || !isAvailable
                              ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-200'
                              : enabled
                              ? `${cfg.activeBg} ${cfg.activeText} border-current ring-2 ${cfg.activeBorder}`
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className={`text-[9px] font-black uppercase leading-none ${
                            enabled && info.available && isAvailable ? cfg.activeText : 'text-slate-400'
                          }`}>
                            {enabled ? 'ON' : 'OFF'}
                          </span>
                          {info.locked && (
                            <Lock className="absolute -top-1.5 -right-1.5 w-3 h-3 text-amber-600 bg-amber-100 rounded-full p-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sticky save bar */}
        {dirtyCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
              <span className="text-sm font-semibold">{dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirty({})}
                  className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  Discard
                </button>
                <button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending}
                  className="flex items-center gap-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-lg transition"
                >
                  {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save now
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
