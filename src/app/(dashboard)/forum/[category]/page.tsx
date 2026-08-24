'use client';

import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Search, ArrowLeft, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { forumApi, type CategorySlug, type ThreadListQuery } from '@/lib/forum/api';
import { ThreadRow } from '../page';

export default function CategoryThreadsPage() {
  const params = useParams();
  const slug = params?.category as CategorySlug;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [sort, setSort] = useState<'recent' | 'top' | 'unanswered'>(
    (searchParams.get('sort') as any) ?? 'recent',
  );
  const [unanswered, setUnanswered] = useState(searchParams.get('unanswered') === '1');

  const query: ThreadListQuery = useMemo(() => ({
    category: slug,
    q: q || undefined,
    sort,
    unanswered: unanswered || undefined,
  }), [slug, q, sort, unanswered]);

  const { data, isLoading } = useQuery({
    queryKey: ['forum', 'threads', query],
    queryFn: () => forumApi.threads(query),
  });

  const catMeta = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => forumApi.categories(),
  });
  const category = catMeta.data?.categories.find((c) => c.slug === slug);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Link href="/forum" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to forum
      </Link>

      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{category?.name ?? slug}</h1>
          {category?.description && (
            <p className="text-slate-600 mt-1">{category.description}</p>
          )}
        </div>
        <Link href={`/forum/new?category=${slug}`} className="btn-primary">
          <Plus className="w-4 h-4" /> New {slug === 'questions' ? 'question' : slug === 'ideas' ? 'idea' : 'discussion'}
        </Link>
      </header>

      {/* Filter bar */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search threads..."
            className="w-full pl-9 pr-3 py-2 rounded border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded border border-slate-200 py-2 px-3 text-sm"
        >
          <option value="recent">Most recent activity</option>
          <option value="top">Highest voted</option>
          <option value="unanswered">Newest first</option>
        </select>
        {category?.supports_accepted_answer && (
          <label className="flex items-center gap-2 text-sm px-3">
            <input
              type="checkbox"
              checked={unanswered}
              onChange={(e) => setUnanswered(e.target.checked)}
            /> Unanswered only
          </label>
        )}
      </div>

      {/* Thread list */}
      {isLoading ? (
        <div className="text-center p-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" /></div>
      ) : data?.data.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          Nothing here yet. <Link href={`/forum/new?category=${slug}`} className="text-brand-600 font-semibold underline">Start the conversation</Link>.
        </div>
      ) : (
        <div className="space-y-2">
          {data?.data.map((t) => <ThreadRow key={t.uuid} thread={t} />)}
        </div>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="text-center text-sm text-slate-500">
          Page {data.meta.current_page} of {data.meta.last_page} ({data.meta.total} total)
        </div>
      )}
    </div>
  );
}
