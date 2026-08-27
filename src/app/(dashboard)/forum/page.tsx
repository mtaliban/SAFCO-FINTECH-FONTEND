'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  HelpCircle, Lightbulb, ClipboardList, MessagesSquare,
  Plus, ArrowRight, TrendingUp, Users, MessageSquare,
} from 'lucide-react';
import { forumApi, type ForumCategory } from '@/lib/forum/api';
import { ThreadRow } from './_shared';

const ICON_MAP: Record<string, React.ElementType> = {
  HelpCircle, Lightbulb, ClipboardList, MessagesSquare,
};
const iconFor = (icon: string | null): React.ElementType =>
  ICON_MAP[icon ?? ''] ?? MessagesSquare;

const CATEGORY_THEME: Record<string, {
  gradient: string; iconBg: string; iconText: string;
  badge: string; badgeText: string; border: string;
}> = {
  blue:    {
    gradient:  'from-navy-500 to-navy-600',
    iconBg:    'bg-navy-100/80',    iconText: 'text-navy-600',
    badge:     'bg-navy-100',       badgeText: 'text-navy-500',
    border:    'border-navy-200',
  },
  amber:   {
    gradient:  'from-amber-500 to-orange-600',
    iconBg:    'bg-amber-100/80',   iconText: 'text-amber-700',
    badge:     'bg-amber-100',      badgeText: 'text-amber-800',
    border:    'border-amber-200',
  },
  emerald: {
    gradient:  'from-emerald-600 to-orange-600',
    iconBg:    'bg-emerald-100/80', iconText: 'text-emerald-700',
    badge:     'bg-emerald-100',    badgeText: 'text-emerald-800',
    border:    'border-emerald-200',
  },
};
const defaultTheme = CATEGORY_THEME.blue;

export default function ForumHomePage() {
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => forumApi.categories(),
  });
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['forum', 'threads', 'recent'],
    queryFn: () => forumApi.threads({ sort: 'recent', per_page: 10 }),
  });

  const totalThreads = catData?.categories.reduce((s, c) => s + c.thread_count, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold uppercase tracking-widest mb-1">
            <MessagesSquare className="w-3.5 h-3.5" /> Discussion Forum
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">Knowledge begins with a question.</h1>
          <p className="text-slate-500 text-sm mt-1">Ask questions, share ideas, collaborate with peers and instructors.</p>
        </div>
        <Link
          href="/forum/new"
          className="self-start flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Start a discussion
        </Link>
      </div>

      {/* ── STATS CHIPS ── */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 flex items-center gap-3">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          <div>
            <div className="text-lg font-black text-slate-900 tabular-nums">{totalThreads.toLocaleString()}</div>
            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Discussions</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <div>
            <div className="text-lg font-black text-slate-900 tabular-nums">{recentData?.meta.total.toLocaleString() ?? '—'}</div>
            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Total threads</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 flex items-center gap-3">
          <Users className="w-4 h-4 text-orange-500" />
          <div>
            <div className="text-lg font-black text-slate-900">{catData?.categories.length ?? '—'}</div>
            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Categories</div>
          </div>
        </div>
      </div>

      <div className="space-y-8">

        {/* Category tiles */}
        {catLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Browse by category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catData?.categories.map((c: ForumCategory) => {
                const Icon = iconFor(c.icon);
                const theme = CATEGORY_THEME[c.color ?? ''] ?? defaultTheme;
                return (
                  <Link
                    key={c.slug}
                    href={`/forum/${c.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-navy-200 transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Color bar header */}
                    <div className={`bg-gradient-to-r ${theme.gradient} px-5 py-4 flex items-center gap-3`}>
                      <div className={`w-11 h-11 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-6 h-6 ${theme.iconText}`} />
                      </div>
                      <div>
                        <div className="font-black text-white text-lg leading-tight">{c.name}</div>
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme.badge} ${theme.badgeText} mt-1 inline-block`}>
                          {c.thread_count.toLocaleString()} thread{c.thread_count === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 px-5 py-4 flex flex-col justify-between">
                      <p className="text-sm text-slate-600 leading-relaxed">{c.description}</p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-bold text-navy-500 group-hover:gap-2 transition-all">
                        Browse discussions <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent activity</h2>
            <Link href="/forum/new" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
              Start a discussion →
            </Link>
          </div>
          {recentLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (recentData?.data.length ?? 0) === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <MessagesSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <div className="font-semibold text-slate-500">No discussions yet.</div>
              <div className="text-sm text-slate-400 mt-1">
                Be the first to{' '}
                <Link href="/forum/new" className="text-orange-600 font-semibold hover:underline">start a conversation</Link>.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentData?.data.map((t) => <ThreadRow key={t.uuid} thread={t} />)}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

