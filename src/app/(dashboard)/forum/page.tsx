'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { HelpCircle, Lightbulb, ClipboardList, MessagesSquare, Plus, Loader2, ArrowRight } from 'lucide-react';
import { forumApi, type ForumCategory, type ThreadSummary } from '@/lib/forum/api';

const iconFor = (icon: string | null) => {
  switch (icon) {
    case 'HelpCircle': return HelpCircle;
    case 'Lightbulb': return Lightbulb;
    case 'ClipboardList': return ClipboardList;
    default: return MessagesSquare;
  }
};

const colorFor = (c: string | null) => {
  switch (c) {
    case 'blue': return 'bg-blue-100 text-blue-700 ring-blue-200';
    case 'amber': return 'bg-amber-100 text-amber-800 ring-amber-200';
    case 'emerald': return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
    default: return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
};

export default function ForumHomePage() {
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => forumApi.categories(),
  });
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['forum', 'threads', 'recent'],
    queryFn: () => forumApi.threads({ sort: 'recent', per_page: 10 }),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <MessagesSquare className="w-7 h-7 text-brand-600" /> Discussion Forum
          </h1>
          <p className="text-slate-600 mt-1">
            Ask questions, share ideas, and discuss assignments with your peers and instructors.
          </p>
        </div>
        <Link href="/forum/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New discussion
        </Link>
      </header>

      {/* Category tiles */}
      {catLoading ? (
        <div className="text-center p-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" /></div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {catData?.categories.map((c: ForumCategory) => {
            const Icon = iconFor(c.icon);
            return (
              <Link
                key={c.slug}
                href={`/forum/${c.slug}`}
                className={`card p-5 ring-1 hover:shadow-lg transition group ${colorFor(c.color)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-white/70 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{c.name}</div>
                    <div className="text-xs opacity-80">{c.thread_count} thread{c.thread_count === 1 ? '' : 's'}</div>
                  </div>
                </div>
                <p className="text-sm mt-3 opacity-90">{c.description}</p>
                <div className="mt-4 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Browse <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* Recent activity */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Recent activity</h2>
        {recentLoading ? (
          <div className="text-center p-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600" /></div>
        ) : recentData?.data.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            No discussions yet. Be the first to <Link href="/forum/new" className="text-brand-600 font-semibold underline">start one</Link>.
          </div>
        ) : (
          <div className="space-y-2">
            {recentData?.data.map((t) => <ThreadRow key={t.uuid} thread={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export function ThreadRow({ thread }: { thread: ThreadSummary }) {
  return (
    <Link href={`/forum/thread/${thread.uuid}`} className="card p-4 flex items-start gap-4 hover:bg-slate-50 transition">
      <div className="w-14 flex-shrink-0 flex flex-col items-center text-center">
        <div className="text-2xl font-bold text-slate-800">{thread.votes_score}</div>
        <div className="text-[10px] uppercase text-slate-500 tracking-widest">votes</div>
      </div>
      <div className="w-14 flex-shrink-0 flex flex-col items-center text-center">
        <div className={`text-2xl font-bold ${thread.has_accepted_answer ? 'text-emerald-700' : 'text-slate-800'}`}>
          {thread.replies_count}
        </div>
        <div className="text-[10px] uppercase text-slate-500 tracking-widest">
          {thread.has_accepted_answer ? 'solved' : 'replies'}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {thread.is_pinned && <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Pinned</span>}
          {thread.is_locked && <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">Locked</span>}
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${colorForCategory(thread.category.color)}`}>
            {thread.category.name}
          </span>
        </div>
        <div className="font-semibold text-slate-900 mt-1 truncate">{thread.title}</div>
        <div className="text-sm text-slate-600 mt-1 line-clamp-2">{thread.excerpt}</div>
        <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span>by {thread.author?.name ?? 'Unknown'}</span>
          <span>· {thread.views_count} views</span>
          {thread.last_activity_at && <span>· active {timeAgo(thread.last_activity_at)}</span>}
          {thread.course && <span>· in <span className="font-medium">{thread.course.title}</span></span>}
        </div>
      </div>
    </Link>
  );
}

function colorForCategory(c: string | null): string {
  switch (c) {
    case 'blue': return 'bg-blue-100 text-blue-700';
    case 'amber': return 'bg-amber-100 text-amber-800';
    case 'emerald': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-slate-100 text-slate-700';
  }
}

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
