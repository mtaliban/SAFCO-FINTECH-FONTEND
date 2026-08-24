'use client';

import Link from 'next/link';
import { type ThreadSummary } from '@/lib/forum/api';

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
