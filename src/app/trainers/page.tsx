'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, ShieldCheck, Users, GraduationCap, Loader2, ArrowRight,
} from 'lucide-react';
import { trainerPortalApi, type DirectoryQuery } from '@/lib/trainerPortal/api';
import { StarRating } from '@/components/trainer/StarRating';

/**
 * SRS Module 13 — Public trainer directory.
 * Anyone (unauthenticated) can browse. Filters: search, expertise, verified, rating, sort.
 */
export default function TrainersDirectoryPage() {
  const [query, setQuery] = useState<DirectoryQuery>({ sort: 'rating' });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trainers', 'directory', query],
    queryFn: () => trainerPortalApi.directory(query),
    staleTime: 30_000,
  });

  const applySearch = () => setQuery((q) => ({ ...q, q: searchInput.trim() || undefined, page: 1 }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public hero header */}
      <div className="bg-gradient-to-r from-navy-700 to-navy-900 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-orange-400" /> Certified Trainer Directory
          </h1>
          <p className="text-lg text-slate-200 max-w-2xl">
            Browse SAFCO FINTECH's roster of verified trainers. Filter by expertise, experience, and student ratings.
          </p>
          <div className="mt-6 flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Search by name, headline, or skill..."
                className="w-full pl-10 pr-3 py-3 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <button onClick={applySearch} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 card">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!query.verified_only}
              onChange={(e) => setQuery((q) => ({ ...q, verified_only: e.target.checked, page: 1 }))}
              className="rounded border-slate-300"
            />
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Verified only</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <span className="text-slate-600">Min rating:</span>
            <select
              value={query.min_rating ?? 0}
              onChange={(e) => setQuery((q) => ({ ...q, min_rating: Number(e.target.value) || undefined, page: 1 }))}
              className="rounded border-slate-300 py-1 text-sm"
            >
              <option value={0}>Any</option>
              <option value={3}>3+ stars</option>
              <option value={4}>4+ stars</option>
              <option value={4.5}>4.5+ stars</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm ml-auto">
            <span className="text-slate-600">Sort:</span>
            <select
              value={query.sort ?? 'rating'}
              onChange={(e) => setQuery((q) => ({ ...q, sort: e.target.value as DirectoryQuery['sort'], page: 1 }))}
              className="rounded border-slate-300 py-1 text-sm"
            >
              <option value="rating">Top rated</option>
              <option value="experience">Most experienced</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
        ) : (data?.data.length ?? 0) === 0 ? (
          <div className="card p-12 text-center text-slate-500">
            No trainers match your filters.
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-slate-600">
              Showing <strong>{data!.data.length}</strong> of {data!.meta.total} trainers
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data!.data.map((t) => <TrainerCard key={t.slug} t={t} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TrainerCard({ t }: { t: import('@/lib/trainerPortal/api').TrainerDirectoryEntry }) {
  return (
    <Link href={`/trainers/${t.slug}`} className="card p-5 hover:shadow-md hover:border-brand-300 transition group">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
          {t.avatar
            ? <img src={t.avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-slate-500 font-black text-lg">{t.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-slate-900 truncate">{t.name}</span>
            {t.is_verified && (
              <span title="Verified trainer" className="inline-flex items-center gap-0.5 text-emerald-600 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
          {t.headline && (
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{t.headline}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <StarRating value={t.rating_avg} showNumber={t.rating_avg !== null} />
        <span className="text-slate-500">
          ({t.rating_count} review{t.rating_count === 1 ? '' : 's'})
        </span>
      </div>

      {t.expertise_areas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {t.expertise_areas.slice(0, 4).map((e) => (
            <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold">
              {e.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3" /> {t.students_taught} students
        </span>
        {t.years_experience !== null && (
          <span>{t.years_experience}y experience</span>
        )}
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
      </div>
    </Link>
  );
}
