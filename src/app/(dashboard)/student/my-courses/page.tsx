'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen, CheckCircle2, PlayCircle, Award, Clock } from 'lucide-react';
import { enrollmentApi, CATEGORY_LABEL } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';

export default function MyCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'my-enrollments'],
    queryFn: () => enrollmentApi.myEnrollments(),
  });

  const enrollments = data?.data ?? [];
  const completed   = enrollments.filter((e) => !!e.completed_at).length;
  const inProgress  = enrollments.filter((e) => !e.completed_at && Number(e.progress_percentage) > 0).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-orange-500" /> My Courses
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Courses ulizojiunga na maendeleo yako ya kujifunza</p>
        </div>
        <Link href="/student/courses" className="btn-primary shrink-0">
          + Tafuta Courses Zaidi
        </Link>
      </div>

      {/* ── Summary cards ── */}
      {enrollments.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-slate-900">{enrollments.length}</p>
            <p className="text-xs text-slate-500 mt-1">Courses Zote</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-orange-500">{inProgress}</p>
            <p className="text-xs text-slate-500 mt-1">Zinaendelea</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-green-600">{completed}</p>
            <p className="text-xs text-slate-500 mt-1">Zilizokamilika</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Inapakia...</p>
        </div>
      ) : !enrollments.length ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Bado Haujajiunga na Course</h3>
          <p className="text-slate-500 mb-6 text-sm">Anza safari yako ya kujifunza leo!</p>
          <Link href="/student/courses" className="btn-primary">
            Tafuta Courses
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments.map((e) => {
            const pct = Number(e.progress_percentage);
            const done = !!e.completed_at;
            return (
              <Link
                key={e.uuid}
                href={`/student/courses/${e.course.uuid}`}
                className="card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-navy-600 to-navy-900 relative overflow-hidden">
                  {e.course.thumbnail_url ? (
                    <Image
                      src={mediaUrl(e.course.thumbnail_url)!}
                      alt={e.course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">📚</div>
                  )}
                  {done ? (
                    <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Award className="w-10 h-10 mx-auto mb-1" />
                        <p className="text-sm font-bold">Imekamilika!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <PlayCircle className="w-7 h-7 text-navy-600" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs font-bold text-orange-600 mb-1">{CATEGORY_LABEL[e.course.category]}</p>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-3 flex-1">{e.course.title}</h3>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-semibold flex items-center gap-1 ${done ? 'text-green-600' : 'text-slate-600'}`}>
                        {done ? (
                          <><CheckCircle2 className="w-3 h-3" /> Imekamilika</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Inaendelea</>
                        )}
                      </span>
                      <span className="text-slate-500 font-medium">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${done ? 'bg-green-500' : pct > 50 ? 'bg-orange-500' : 'bg-navy-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
