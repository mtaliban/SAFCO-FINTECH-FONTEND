'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen, Users, Clock, PlayCircle, Loader2, CheckCircle2,
  ChevronRight, Lock, Award,
} from 'lucide-react';
import { courseApi, enrollmentApi, CATEGORY_LABEL, type Lesson } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';

export default function CourseDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router   = useRouter();
  const qc       = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', uuid],
    queryFn: () => courseApi.get(uuid as string),
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['student', 'my-enrollments'],
    queryFn: () => enrollmentApi.myEnrollments(),
  });

  const enrolled     = (myEnrollments?.data ?? []).find((e) => e.course.uuid === uuid);
  const totalLessons = (course?.modules ?? []).reduce((s, m) => s + (m.lessons?.length ?? 0), 0);

  // Find first incomplete lesson for "Continue Learning"
  const firstIncomplete = (() => {
    for (const mod of course?.modules ?? []) {
      for (const l of mod.lessons ?? []) {
        if (!l.is_completed) return l;
      }
    }
    return null;
  })();

  const completedCount = (course?.modules ?? [])
    .flatMap((m) => m.lessons ?? [])
    .filter((l) => l.is_completed).length;

  async function enroll() {
    setEnrolling(true);
    try {
      await enrollmentApi.enroll(uuid as string);
      toast.success('Umejiunga! Anza somo la kwanza.');
      qc.invalidateQueries({ queryKey: ['student', 'my-enrollments'] });
      qc.invalidateQueries({ queryKey: ['course', uuid] });
    } catch {
      setEnrolling(false);
    }
  }

  if (isLoading || !course) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const progressPct = enrolled ? Number(enrolled.progress_percentage) : 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">

      {/* ── Header grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

        {/* Left: course info */}
        <div className="md:col-span-2">
          <div className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-2">
            {CATEGORY_LABEL[course.category]} · {course.level}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight">{course.title}</h1>
          {course.description && (
            <p className="text-slate-600 mb-4 leading-relaxed">{course.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {course.stats.modules} modules · {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {course.stats.enrollments} wanafunzi
            </span>
            {course.duration_hours && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.duration_hours}h
              </span>
            )}
            {course.instructor?.name && (
              <span>👨‍🏫 {course.instructor.name}</span>
            )}
          </div>
        </div>

        {/* Right: enrollment card */}
        <div className="card overflow-hidden">
          {/* Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-navy-600 to-navy-900 relative">
            {course.thumbnail_url ? (
              <Image
                src={mediaUrl(course.thumbnail_url)!}
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">📚</div>
            )}
          </div>

          <div className="p-4 space-y-3">
            {enrolled ? (
              <>
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Progress yako</span>
                    <span className="text-slate-500">{completedCount}/{totalLessons} lessons</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-right text-slate-500 mt-0.5">{progressPct.toFixed(0)}%</p>
                </div>

                {/* CTA */}
                {enrolled.completed_at ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Award className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-bold text-green-700">Course Imekamilika!</p>
                      <Link href="/student/certificates" className="text-xs text-green-600 underline">
                        Angalia certificate →
                      </Link>
                    </div>
                  </div>
                ) : firstIncomplete ? (
                  <Link
                    href={`/student/courses/${uuid}/lessons/${firstIncomplete.uuid}`}
                    className="btn-primary w-full justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {completedCount > 0 ? 'Endelea Kusoma' : 'Anza Kusoma'}
                  </Link>
                ) : (
                  <Link
                    href={`/student/courses/${uuid}/lessons/${course.modules?.[0]?.lessons?.[0]?.uuid ?? ''}`}
                    className="btn-primary w-full justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> Anza Lesson ya Kwanza
                  </Link>
                )}

                <div className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Umejiunga</span>
                </div>
              </>
            ) : (
              <>
                {course.price_tzs && !course.is_free ? (
                  <p className="text-xl font-bold text-slate-900">
                    TZS {course.price_tzs.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-sm text-green-600 font-semibold">🎁 Bila malipo</p>
                )}
                <button
                  onClick={enroll}
                  disabled={enrolling}
                  className="btn-primary w-full justify-center gap-2"
                >
                  {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Jiunge (Enroll)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Course structure ── */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Muundo wa Course</h2>
        <p className="text-sm text-slate-500 mb-5">
          {course.stats.modules} modules · {totalLessons} lessons
          {enrolled ? ` · ${completedCount} zilizokamilika` : ''}
        </p>

        {!(course.modules ?? []).length ? (
          <p className="text-slate-500 text-center py-8">Trainer bado hajaongeza modules.</p>
        ) : (
          <div className="space-y-3">
            {(course.modules ?? []).map((mod, mi) => {
              const modDone = (mod.lessons ?? []).filter((l) => l.is_completed).length;
              const modTotal = mod.lessons?.length ?? 0;
              return (
                <details key={mod.uuid} open={mi === 0} className="border border-slate-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">
                        Module {mi + 1}: {mod.title}
                      </p>
                      {mod.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{mod.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {enrolled ? `${modDone}/${modTotal}` : `${modTotal} lessons`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                  </summary>

                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {(mod.lessons ?? []).map((l: Lesson, li) => {
                      const canOpen = !!enrolled;
                      const isComplete = l.is_completed;
                      const inner = (
                        <div className="flex items-center gap-3 px-5 py-3 text-sm">
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          ) : canOpen ? (
                            <PlayCircle className="w-4 h-4 text-brand-500 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className={`flex-1 ${isComplete ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {mi + 1}.{li + 1} · {l.title}
                          </span>
                          {l.duration_seconds && (
                            <span className="text-xs text-slate-400 shrink-0">
                              {Math.round(l.duration_seconds / 60)}m
                            </span>
                          )}
                        </div>
                      );
                      return canOpen ? (
                        <Link
                          key={l.uuid}
                          href={`/student/courses/${uuid}/lessons/${l.uuid}`}
                          className="block hover:bg-brand-50 transition"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div key={l.uuid}>{inner}</div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
