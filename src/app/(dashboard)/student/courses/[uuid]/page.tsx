'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Users, Clock, PlayCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { courseApi, enrollmentApi, CATEGORY_LABEL, type Lesson } from '@/lib/course/api';

export default function CourseDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', uuid],
    queryFn: () => courseApi.get(uuid as string),
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['student', 'my-enrollments'],
    queryFn: () => enrollmentApi.myEnrollments(),
  });

  const enrolled = (myEnrollments?.data ?? []).find((e) => e.course.uuid === uuid);

  async function enroll() {
    setEnrolling(true);
    try {
      await enrollmentApi.enroll(uuid as string);
      toast.success('Umejiunga! Anza somo la kwanza.');
      qc.invalidateQueries({ queryKey: ['student', 'my-enrollments'] });
    } catch { setEnrolling(false); }
  }

  if (isLoading || !course) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  const totalLessons = (course.modules ?? []).reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-2">
            {CATEGORY_LABEL[course.category]} · {course.level}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">{course.title}</h1>
          <p className="text-slate-600 mb-4">{course.description ?? ' '}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.stats.modules} modules · {totalLessons} lessons</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.stats.enrollments} students</span>
            {course.duration_hours && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration_hours}h</span>}
            {course.instructor?.name && <span>👨‍🏫 {course.instructor.name}</span>}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-navy-500 to-navy-800 relative">
            {course.thumbnail_url ? (
              <Image src={`http://localhost:8000${course.thumbnail_url}`} alt="" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">📚</div>
            )}
          </div>
          <div className="p-4">
            {enrolled ? (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">Your progress</span>
                    <span className="text-slate-500">{Number(enrolled.progress_percentage).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${enrolled.progress_percentage}%` }} />
                  </div>
                </div>
                <div className="text-sm text-green-700 font-semibold flex items-center gap-1 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Enrolled
                </div>
              </>
            ) : (
              <button onClick={enroll} disabled={enrolling} className="btn-primary w-full">
                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Jiunge (Enroll)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course structure */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Course Structure</h2>
        {!course.modules?.length ? (
          <p className="text-slate-500 text-center py-8">Trainer bado hajaongeza modules.</p>
        ) : (
          <div className="space-y-4">
            {course.modules.map((m, i) => (
              <div key={m.uuid} className="border border-slate-200 rounded-lg p-4">
                <div className="font-bold text-slate-900 mb-1">Module {i + 1}: {m.title}</div>
                {m.description && <p className="text-sm text-slate-600 mb-3">{m.description}</p>}
                <div className="space-y-1">
                  {(m.lessons ?? []).map((l: Lesson, j: number) => {
                    const canOpen = !!enrolled;
                    const inner = (
                      <>
                        <PlayCircle className="w-4 h-4 text-brand-500" />
                        <span className="flex-1">{i + 1}.{j + 1} · {l.title}</span>
                        {l.duration_seconds && <span className="text-xs text-slate-400">{Math.round(l.duration_seconds / 60)}m</span>}
                      </>
                    );
                    const cls = `flex items-center gap-3 p-2 rounded text-sm ${canOpen ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-60'}`;
                    return canOpen ? (
                      <Link key={l.uuid} href={`/student/courses/${uuid}/lessons/${l.uuid}`} className={cls}>{inner}</Link>
                    ) : (
                      <div key={l.uuid} className={cls}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
