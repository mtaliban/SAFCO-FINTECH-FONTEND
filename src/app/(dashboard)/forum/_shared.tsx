'use client';

import Link from 'next/link';
import { CheckCircle2, MessageSquare, Eye, Pin, Lock, Tag } from 'lucide-react';
import { type ThreadSummary } from '@/lib/forum/api';

const CATEGORY_CFG: Record<string, { bg: string; text: string; border: string }> = {
  blue:    { bg: 'bg-navy-100',    text: 'text-navy-600',    border: 'border-navy-200' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};
const DEFAULT_CFG = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };

export function categoryStyle(color: string | null) {
  return CATEGORY_CFG[color ?? ''] ?? DEFAULT_CFG;
}

export function ThreadRow({ thread }: { thread: ThreadSummary }) {
  const cat = categoryStyle(thread.category.color);
  const solved = thread.has_accepted_answer;

  return (
    <Link
      href={`/forum/thread/${thread.uuid}`}
      className={`group block bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        solved ? 'border-l-4 border-l-emerald-500 border-slate-200' : 'border-slate-200 hover:border-navy-200'
      }`}
    >
      <div className="flex items-stretch">
        {/* Vote + replies column */}
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-5 bg-slate-50 border-r border-slate-100 shrink-0 min-w-[80px]">
          <div className="text-center">
            <div className={`text-xl font-black tabular-nums ${
              thread.votes_score > 0 ? 'text-navy-600' : thread.votes_score < 0 ? 'text-red-600' : 'text-slate-700'
            }`}>
              {thread.votes_score}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">votes</div>
          </div>

          <div className={`text-center px-2.5 py-1.5 rounded-lg ${
            solved ? 'bg-emerald-100' : 'bg-slate-100'
          }`}>
            <div className={`text-xl font-black tabular-nums ${solved ? 'text-emerald-700' : 'text-slate-700'}`}>
              {thread.replies_count}
            </div>
            <div className={`text-[9px] uppercase tracking-widest font-bold mt-0.5 ${solved ? 'text-emerald-600' : 'text-slate-400'}`}>
              {solved ? 'solved' : 'replies'}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-5">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {thread.is_pinned && (
              <span className="inline-flex items-center gap-0.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
            {thread.is_locked && (
              <span className="inline-flex items-center gap-0.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
            {solved && (
              <span className="inline-flex items-center gap-0.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-2.5 h-2.5" /> Answered
              </span>
            )}
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
              {thread.category.name}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-navy-600 transition-colors line-clamp-2">
            {thread.title}
          </h3>

          {/* Excerpt */}
          {thread.excerpt && (
            <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{thread.excerpt}</p>
          )}

          {/* Tags */}
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {thread.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-md bg-navy-50 text-navy-500 font-semibold border border-navy-200">
                  <Tag className="w-2.5 h-2.5" />{t}
                </span>
              ))}
            </div>
          )}

          {/* Meta footer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
            <span className="font-medium text-slate-600">
              {thread.author?.name ?? 'Unknown'}
            </span>
            {thread.created_at && <span>{timeAgo(thread.created_at)}</span>}
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3" /> {thread.views_count.toLocaleString()} views
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {thread.replies_count}
            </span>
            {thread.last_activity_at && (
              <span>active {timeAgo(thread.last_activity_at)}</span>
            )}
            {thread.course && (
              <span className="text-navy-500 font-medium truncate max-w-[160px]">
                {thread.course.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
