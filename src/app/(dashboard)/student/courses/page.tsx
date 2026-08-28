'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, Clock, Loader2, Search,
  BarChart2, GraduationCap, Star,
} from 'lucide-react';
import { courseApi, CATEGORIES, CATEGORY_LABEL, type Category } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';

const LEVEL_COLOR: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-orange-100 text-orange-700',
  expert:       'bg-red-100 text-red-700',
};

const CATEGORY_ICON: Record<string, string> = {
  excel: '📊', power_query: '🔄', power_bi: '📈', accounting: '🏦',
  finance: '💰', ifrs: '📋', erp_systems: '⚙️', coding: '💻',
  data_analytics: '🔬', microsoft_office: '💼', general: '📚',
};

export default function BrowseCoursesPage() {
  const [category, setCategory] = useState<Category | ''>('');
  const [search, setSearch]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'browse', category],
    queryFn: () => courseApi.list(category ? { category } : {}),
  });

  const courses = (data?.data ?? []).filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tafuta Course</h1>
            <p className="text-slate-500 text-sm">Courses za kitaalamu zilizoandaliwa na wataalamu wa kweli</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tafuta course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={`text-sm px-4 py-2 rounded-full font-semibold transition ${!category ? 'bg-navy-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}`}
        >
          Zote
        </button>
        {CATEGORIES.filter((c) => c !== 'general').map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-sm px-4 py-2 rounded-full font-semibold transition flex items-center gap-1.5 ${category === c ? 'bg-navy-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}`}
          >
            <span>{CATEGORY_ICON[c]}</span> {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {/* ── Course grid ── */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Inapakia courses...</p>
        </div>
      ) : !courses.length ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Hakuna course iliyopatikana</h3>
          <p className="text-slate-500 text-sm">Jaribu category nyingine au futa utafutaji.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{courses.length} course{courses.length !== 1 ? 's' : ''} zimepatikana</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((c) => (
              <Link
                key={c.uuid}
                href={`/student/courses/${c.uuid}`}
                className="card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-navy-600 to-navy-900 relative overflow-hidden">
                  {c.thumbnail_url ? (
                    <Image
                      src={mediaUrl(c.thumbnail_url)!}
                      alt={c.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      {CATEGORY_ICON[c.category] ?? '📚'}
                    </div>
                  )}
                  {/* Level badge */}
                  <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-bold capitalize ${LEVEL_COLOR[c.level] ?? 'bg-white/90 text-slate-700'}`}>
                    {c.level}
                  </span>
                  {/* Free badge */}
                  {c.is_free && (
                    <span className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-full font-bold bg-green-500 text-white">
                      Bila Malipo
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-bold text-orange-600">{CATEGORY_LABEL[c.category]}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 text-sm leading-snug flex-1 min-h-[2.5rem]">
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>
                  )}

                  {/* Instructor */}
                  {c.instructor?.name && (
                    <p className="text-xs text-slate-600 mb-3 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {c.instructor.name}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100 mt-auto">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {c.stats.modules} modules
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {c.stats.enrollments}
                    </span>
                    {c.duration_hours && (
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" /> {c.duration_hours}h
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
