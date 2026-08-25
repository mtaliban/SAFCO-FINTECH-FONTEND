'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, Clock, Loader2 } from 'lucide-react';
import { courseApi, CATEGORIES, CATEGORY_LABEL, type Category } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';

export default function BrowseCoursesPage() {
  const [category, setCategory] = useState<Category | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'browse', category],
    queryFn: () => courseApi.list(category ? { category } : {}),
  });

  const courses = data?.data ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-orange-500" /> Browse Courses
        </h1>
        <p className="text-slate-600 mt-1">Chagua course ya kujiunga (SRS 3.3 Enroll in courses).</p>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={`text-sm px-3 py-1.5 rounded-full font-semibold ${!category ? 'bg-navy-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          All
        </button>
        {CATEGORIES.filter(c => c !== 'general').map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-sm px-3 py-1.5 rounded-full font-semibold ${category === c ? 'bg-navy-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : !courses.length ? (
        <div className="card p-12 text-center text-slate-400">
          Hakuna course iliyopublished kwa category hii bado.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Link key={c.uuid} href={`/student/courses/${c.uuid}`} className="card overflow-hidden hover:shadow-md hover:border-brand-300 transition group">
              <div className="aspect-video bg-gradient-to-br from-navy-500 to-navy-800 relative">
                {c.thumbnail_url ? (
                  <Image src={mediaUrl(c.thumbnail_url)!} alt="" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">📚</div>
                )}
                <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-semibold bg-white/90 text-navy-700 capitalize">
                  {c.level}
                </span>
              </div>
              <div className="p-4">
                <div className="text-xs text-orange-600 font-semibold mb-1">{CATEGORY_LABEL[c.category]}</div>
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">{c.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3 min-h-[2.5rem]">{c.description ?? ' '}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {c.stats.modules} modules</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.stats.enrollments}</span>
                  {c.duration_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration_hours}h</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
