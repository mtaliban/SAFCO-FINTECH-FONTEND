'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, Plus, Search, ArrowLeft, X, CheckCircle2,
  SortAsc, Filter, HelpCircle, Lightbulb, ClipboardList, MessagesSquare,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { forumApi, type CategorySlug, type ThreadListQuery } from '@/lib/forum/api';
import { ThreadRow, categoryStyle } from '../_shared';

const ICON_MAP: Record<string, React.ElementType> = {
  HelpCircle, Lightbulb, ClipboardList, MessagesSquare,
};

const GRADIENT_MAP: Record<string, string> = {
  blue:    'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
  amber:   'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
  emerald: 'linear-gradient(135deg, #064e3b 0%, #0d9488 100%)',
};

export default function CategoryThreadsPage() {
  const params = useParams();
  const slug = params?.category as CategorySlug;
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [inputQ, setInputQ] = useState(q);
  const [sort, setSort] = useState<'recent' | 'top' | 'unanswered'>(
    (searchParams.get('sort') as 'recent' | 'top' | 'unanswered') ?? 'recent',
  );
  const [unanswered, setUnanswered] = useState(searchParams.get('unanswered') === '1');
  const [page, setPage] = useState(1);

  const query: ThreadListQuery = useMemo(() => ({
    category: slug, q: q || undefined, sort,
    unanswered: unanswered || undefined, page,
  }), [slug, q, sort, unanswered, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['forum', 'threads', query],
    queryFn: () => forumApi.threads(query),
  });
  const catMeta = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => forumApi.categories(),
  });
  const category = catMeta.data?.categories.find((c) => c.slug === slug);
  const Icon = ICON_MAP[category?.icon ?? ''] ?? MessagesSquare;
  const style = categoryStyle(category?.color ?? null);
  const heroBg = GRADIENT_MAP[category?.color ?? ''] ?? GRADIENT_MAP.blue;

  const applySearch = () => { setQ(inputQ.trim()); setPage(1); };
  const clearSearch = () => { setInputQ(''); setQ(''); setPage(1); };

  const newLabel = slug === 'questions' ? 'Ask a question'
    : slug === 'ideas' ? 'Share an idea'
    : 'Start a discussion';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <div style={{ background: heroBg }}>
        <div className="max-w-6xl mx-auto px-8 py-10">
          <Link href="/forum"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-semibold text-sm mb-5 transition">
            <ArrowLeft className="w-4 h-4" /> Discussion Forum
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">{category?.name ?? slug}</h1>
                {category?.description && (
                  <p className="text-white/70 text-sm mt-0.5">{category.description}</p>
                )}
              </div>
            </div>
            <Link href={`/forum/new?category=${slug}`}
              className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-5 py-2.5 rounded-xl transition shadow-lg text-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> {newLabel}
            </Link>
          </div>

          {/* Stats */}
          {data && (
            <div className="mt-5 flex items-center gap-2 text-white/60 text-xs">
              <span className="text-white font-bold">{data.meta.total.toLocaleString()}</span> threads
              {q && <> · results for <span className="text-white font-bold">"{q}"</span></>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 space-y-4">

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder={`Search ${category?.name ?? 'threads'}…`}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm"
            />
            {inputQ && (
              <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <SortAsc className="w-3.5 h-3.5" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
              className="rounded-lg border border-slate-200 py-2 px-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="recent">Most recent</option>
              <option value="top">Highest voted</option>
              <option value="unanswered">Newest first</option>
            </select>
          </div>

          {category?.supports_accepted_answer && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 transition">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                unanswered ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
              }`}>
                {unanswered && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <input type="checkbox" checked={unanswered}
                onChange={(e) => { setUnanswered(e.target.checked); setPage(1); }}
                className="sr-only" />
              <span className="font-semibold text-slate-700">Unanswered only</span>
            </label>
          )}

          {q && (
            <button onClick={clearSearch}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Thread list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (data?.data.length ?? 0) === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-14 text-center">
            <MessagesSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <div className="font-semibold text-slate-600">
              {q ? `No threads found for "${q}"` : 'Nothing here yet.'}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              <Link href={`/forum/new?category=${slug}`} className="text-indigo-600 font-semibold hover:underline">
                {newLabel}
              </Link>{' '}to get the conversation going.
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data?.data.map((t) => <ThreadRow key={t.uuid} thread={t} />)}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 px-3">
              Page <strong>{data.meta.current_page}</strong> of {data.meta.last_page}
            </span>
            <button
              disabled={page >= data.meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
