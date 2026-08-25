'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Save, Bell, Mail, MessageCircle, Smartphone, MessageSquare, Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsApi, type Channel, type EventPrefRow, type PreferencesResponse } from '@/lib/notifications/api';

const channelIcon = (c: Channel) => {
  switch (c) {
    case 'email': return Mail;
    case 'in_app': return Bell;
    case 'whatsapp': return MessageCircle;
    case 'push': return Smartphone;
    case 'sms': return MessageSquare;
  }
};
const channelLabel: Record<Channel, string> = {
  email: 'Email',
  in_app: 'In-App',
  whatsapp: 'WhatsApp',
  push: 'Push',
  sms: 'SMS',
};

export default function NotificationSettingsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsApi.preferences(),
  });

  // Working copy of the matrix (event_key|channel -> enabled)
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
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  const isEnabled = (row: EventPrefRow, ch: Channel) => {
    const k = row.key + '|' + ch;
    if (k in dirty) return dirty[k];
    return row.channels[ch].enabled;
  };

  const toggle = (row: EventPrefRow, ch: Channel) => {
    if (row.channels[ch].locked) {
      toast.error('This notification is required and cannot be turned off.');
      return;
    }
    if (!row.channels[ch].available) {
      toast('Channel not available yet.', { icon: 'ℹ️' });
      return;
    }
    const k = row.key + '|' + ch;
    const original = row.channels[ch].enabled;
    const next = !isEnabled(row, ch);
    setDirty((d) => {
      const copy = { ...d };
      if (next === original) delete copy[k];
      else copy[k] = next;
      return copy;
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/dashboard/profile" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-brand-600" /> Notifications
          </h1>
          <p className="text-slate-600 mt-1">
            Chagua nini upate email, in-app, na channels nyingine kwa kila aina ya event.
          </p>
        </div>
        <button
          disabled={dirtyCount === 0 || saveMut.isPending}
          onClick={() => saveMut.mutate()}
          className="btn-primary"
        >
          {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes {dirtyCount > 0 && <span className="ml-1 text-xs opacity-80">({dirtyCount})</span>}
        </button>
      </header>

      {/* Channel legend */}
      <div className="card p-3 flex items-center gap-4 flex-wrap text-sm">
        <div className="text-xs uppercase font-bold text-slate-500 tracking-widest">Channels:</div>
        {data.channels.map((c) => {
          const Icon = channelIcon(c);
          const active = activeChannels.includes(c);
          return (
            <span key={c} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${active ? 'bg-slate-100' : 'bg-slate-50 text-slate-400 line-through'}`}>
              <Icon className="w-3.5 h-3.5" /> {channelLabel[c]}
              {!active && <span className="text-[10px] uppercase font-bold ml-1">soon</span>}
            </span>
          );
        })}
      </div>

      {grouped.map(([catKey, rows]) => (
        <section key={catKey} className="card p-0 overflow-hidden">
          <div className="px-5 py-3 bg-slate-100 font-semibold text-slate-800">
            {data.categories[catKey] ?? catKey}
          </div>
          <div className="divide-y divide-slate-200">
            {rows.map((row) => (
              <div key={row.key} className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    {row.label}
                    {row.critical && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Required
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">{row.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  {data.channels.map((ch) => {
                    const Icon = channelIcon(ch);
                    const chInfo = row.channels[ch];
                    const enabled = isEnabled(row, ch);
                    const disabled = chInfo.locked || !chInfo.available;
                    return (
                      <button
                        key={ch}
                        onClick={() => toggle(row, ch)}
                        disabled={disabled && !chInfo.locked}
                        title={
                          chInfo.locked ? `${channelLabel[ch]} — required`
                          : !chInfo.available ? `${channelLabel[ch]} coming soon`
                          : `${channelLabel[ch]} — click to toggle`
                        }
                        className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center transition text-[10px] font-semibold ${
                          enabled
                            ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                            : 'bg-slate-100 text-slate-400'
                        } ${!chInfo.available ? 'opacity-40 cursor-not-allowed' : ''} ${chInfo.locked ? 'cursor-default' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{enabled ? 'ON' : 'OFF'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {dirtyCount > 0 && (
        <div className="sticky bottom-4 z-10 flex justify-center">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="btn-primary shadow-xl"
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save {dirtyCount} change{dirtyCount === 1 ? '' : 's'}
          </button>
        </div>
      )}
    </div>
  );
}
