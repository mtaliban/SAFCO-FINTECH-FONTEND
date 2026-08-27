'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, CheckCheck, Trash2, BookOpen, Zap, Award, MessagesSquare,
  CreditCard, ShieldCheck, ClipboardList, Settings, ArrowRight,
  Loader2, ExternalLink,
} from 'lucide-react';
import { notificationsApi, type InboxItem } from '@/lib/notifications/api';

function iconForEvent(key: string | null): React.ElementType {
  if (!key) return Bell;
  if (key.startsWith('course'))      return BookOpen;
  if (key.startsWith('enrollment'))  return BookOpen;
  if (key.startsWith('forum'))       return MessagesSquare;
  if (key.startsWith('quiz') || key.startsWith('attempt')) return Zap;
  if (key.startsWith('certificate')) return Award;
  if (key.startsWith('payment') || key.startsWith('invoice')) return CreditCard;
  if (key.startsWith('trainer'))     return ShieldCheck;
  if (key.startsWith('assignment'))  return ClipboardList;
  return Bell;
}

function colorForEvent(key: string | null): string {
  if (!key) return 'bg-slate-100 text-slate-600';
  if (key.startsWith('course') || key.startsWith('enrollment')) return 'bg-navy-100 text-navy-600';
  if (key.startsWith('forum'))       return 'bg-navy-100 text-navy-600';
  if (key.startsWith('quiz') || key.startsWith('attempt')) return 'bg-orange-100 text-orange-700';
  if (key.startsWith('certificate')) return 'bg-amber-100 text-amber-700';
  if (key.startsWith('payment') || key.startsWith('invoice')) return 'bg-emerald-100 text-emerald-700';
  if (key.startsWith('trainer'))     return 'bg-orange-100 text-orange-700';
  if (key.startsWith('assignment'))  return 'bg-navy-100 text-navy-600';
  return 'bg-slate-100 text-slate-600';
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)      return 'just now';
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsInboxPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', 'inbox', 'all'],
    queryFn: () => notificationsApi.inbox('all', 60),
    staleTime: 0,
  });

  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
      refetch();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => notificationsApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
      refetch();
    },
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
    },
  });

  // Mark all as read when the page opens — badge disappears
  useEffect(() => {
    const timer = setTimeout(() => markAllMut.mutate(), 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const all = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const displayed = filter === 'unread' ? all.filter((i) => !i.read_at) : all;

  function handleItemClick(item: InboxItem) {
    if (!item.read_at) markReadMut.mutate(item.id);
    if (item.action_url) router.push(item.action_url);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 md:py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-navy-500 text-[11px] font-bold uppercase tracking-widest mb-3">
                <Bell className="w-4 h-4" /> SAFCO FINTECH LMS · Notification Centre
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Notifications</h1>
              <p className="text-navy-500 text-sm mt-1">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'All caught up — no new notifications'}
              </p>
            </div>
            <Link
              href="/settings/notifications"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <Settings className="w-4 h-4" /> Preferences
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3">
              <div className="text-2xl font-black text-white tabular-nums">{all.length}</div>
              <div className="text-[10px] uppercase text-navy-500 font-bold tracking-widest mt-0.5">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3">
              <div className="text-2xl font-black text-white tabular-nums">{unreadCount}</div>
              <div className="text-[10px] uppercase text-navy-500 font-bold tracking-widest mt-0.5">Unread</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition capitalize ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllMut.mutate()}
              disabled={markAllMut.isPending}
              className="flex items-center gap-1.5 text-xs font-bold text-navy-500 hover:text-navy-500 px-3 py-2 rounded-lg hover:bg-navy-50 transition"
            >
              {markAllMut.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCheck className="w-3.5 h-3.5" />}
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
            <Bell className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <div className="font-bold text-slate-600 text-lg">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {filter === 'unread'
                ? 'All caught up! Switch to "All" to see past notifications.'
                : 'Notifications for course updates, forum replies, and more will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((item) => {
              const Icon = iconForEvent(item.event_key);
              const iconCls = colorForEvent(item.event_key);
              const isUnread = !item.read_at;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden group transition-all hover:shadow-md ${
                    isUnread ? 'border-navy-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Unread indicator */}
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconCls}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {isUnread && (
                          <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-navy-500" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm leading-snug ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>
                            {item.title ?? 'Notification'}
                          </div>
                          {item.body && (
                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {item.body}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] text-slate-400">{timeAgo(item.created_at)}</span>
                            {item.action_url && (
                              <button
                                onClick={() => handleItemClick(item)}
                                className="inline-flex items-center gap-1 text-[11px] text-navy-500 hover:text-navy-500 font-bold transition"
                              >
                                View details <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      {item.action_url && (
                        <button
                          onClick={() => handleItemClick(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-navy-500 hover:bg-navy-50 transition"
                          title="Open"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMut.mutate(item.id)}
                        disabled={deleteMut.isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Preferences link */}
        <div className="text-center pt-4">
          <Link
            href="/settings/notifications"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-500 font-semibold transition"
          >
            <Settings className="w-4 h-4" /> Manage notification preferences
          </Link>
        </div>

      </div>
    </div>
  );
}
