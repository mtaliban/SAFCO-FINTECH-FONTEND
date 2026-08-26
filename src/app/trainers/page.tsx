'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, ShieldCheck, Users, GraduationCap, Loader2, ArrowRight,
  Star, Briefcase, SlidersHorizontal, X,
} from 'lucide-react';
import { trainerPortalApi, type DirectoryQuery, type TrainerDirectoryEntry } from '@/lib/trainerPortal/api';
import { StarRating } from '@/components/trainer/StarRating';

export default function TrainersDirectoryPage() {
  const [query, setQuery] = useState<DirectoryQuery>({ sort: 'rating' });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trainers', 'directory', query],
    queryFn: () => trainerPortalApi.directory(query),
    staleTime: 30_000,
  });

  const applySearch = () => setQuery((q) => ({ ...q, q: searchInput.trim() || undefined, page: 1 }));
  const clearSearch = () => { setSearchInput(''); setQuery((q) => ({ ...q, q: undefined, page: 1 })); };

  const hasActiveFilters = !!(query.q || query.verified_only || query.min_rating);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #0c1a3a 0%, #1e3a8a 55%, #1d4ed8 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-4">
            <GraduationCap className="w-4 h-4" /> SAFCO FINTECH LMS · Certified Trainer Directory
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Learn from the best.
          </h1>
          <p className="text-lg text-blue-200 max-w-xl mb-8">
            Browse SAFCO FINTECH's roster of verified financial trainers. Filter by expertise, experience, and student ratings.
          </p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Search by name, headline, or skill…"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg"
              />
              {searchInput && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={applySearch}
              className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg text-sm whitespace-nowrap">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-6">

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </div>

          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
            <div className={`w-9 h-5 rounded-full transition-colors ${query.verified_only ? 'bg-emerald-500' : 'bg-slate-200'} relative`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${query.verified_only ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <input type="checkbox" className="sr-only"
              checked={!!query.verified_only}
              onChange={(e) => setQuery((q) => ({ ...q, verified_only: e.target.checked, page: 1 }))} />
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Verified only</span>
          </label>

          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-slate-600 font-medium">Min rating:</span>
            <select
              value={query.min_rating ?? 0}
              onChange={(e) => setQuery((q) => ({ ...q, min_rating: Number(e.target.value) || undefined, page: 1 }))}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value={0}>Any</option>
              <option value={3}>3+ stars</option>
              <option value={4}>4+ stars</option>
              <option value={4.5}>4.5+ stars</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm ml-auto">
            <span className="text-slate-600 font-medium">Sort by:</span>
            <select
              value={query.sort ?? 'rating'}
              onChange={(e) => setQuery((q) => ({ ...q, sort: e.target.value as DirectoryQuery['sort'], page: 1 }))}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="rating">Top rated</option>
              <option value="experience">Most experienced</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button onClick={() => { setSearchInput(''); setQuery({ sort: 'rating' }); }}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-5 w-16 bg-slate-100 rounded-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (data?.data.length ?? 0) === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
            <GraduationCap className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <div className="font-bold text-slate-700">No trainers match your filters</div>
            <div className="text-sm text-slate-500 mt-1">Try broadening your search criteria.</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-slate-500">
              Showing <strong className="text-slate-900">{data!.data.length}</strong> of {data!.meta.total} trainers
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

function TrainerCard({ t }: { t: TrainerDirectoryEntry }) {
  const availDot = t.availability_status === 'available'
    ? 'bg-emerald-400' : t.availability_status === 'busy' ? 'bg-amber-400' : 'bg-slate-300';

  return (
    <Link href={`/trainers/${t.slug}`}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-orange-300 transition group block">

      {/* Header: avatar + name */}
      <div className="flex items-start gap-3 mb-4">
        <div className="relative shrink-0">
          <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ${
            t.is_verified ? 'ring-2 ring-emerald-400 ring-offset-2' : 'bg-slate-100'
          }`}>
            {t.avatar
              ? <img src={t.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-slate-500 font-black text-xl">{t.name.slice(0, 1).toUpperCase()}</span>}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${availDot}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            <span className="font-bold text-slate-900 text-sm group-hover:text-orange-700 transition truncate">{t.name}</span>
            {t.is_verified && (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
          </div>
          {t.headline && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.headline}</p>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <StarRating value={t.rating_avg} showNumber={t.rating_avg !== null} />
        <span className="text-xs text-slate-400">({t.rating_count} review{t.rating_count === 1 ? '' : 's'})</span>
      </div>

      {/* Expertise pills */}
      {t.expertise_areas.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {t.expertise_areas.slice(0, 4).map((e) => (
            <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
              {e.replace(/_/g, ' ')}
            </span>
          ))}
          {t.expertise_areas.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
              +{t.expertise_areas.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <strong className="text-slate-700">{t.students_taught.toLocaleString()}</strong> students
        </span>
        {t.years_experience !== null && (
          <span className="inline-flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-slate-700">{t.years_experience}y</strong> exp.
          </span>
        )}
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition" />
      </div>
    </Link>
  );
}
