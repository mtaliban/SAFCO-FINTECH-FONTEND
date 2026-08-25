'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen, CheckCircle2 } from 'lucide-react';
import { enrollmentApi, CATEGORY_LABEL } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';

export default function MyCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'my-enrollments'],
    queryFn: () => enrollmentApi.myEnrollments(),
  });

  const enrollments = data?.data ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-orange-500" /> My Courses
        </h1>
        <p className="text-slate-600 mt-1">Courses ulizojiunga + progress yako.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : !enrollments.length ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-3">📚</div>
          <p className="text-slate-500">Bado hujajiunga na course yoyote. Nenda <Link href="/student/courses" className="text-brand-600 underline">Browse Courses</Link>.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((e) => (
            <Link key={e.uuid} href={`/student/courses/${e.course.uuid}`} className="card overflow-hidden hover:shadow-md transition">
              <div className="aspect-video bg-gradient-to-br from-navy-500 to-navy-800 relative">
                {e.course.thumbnail_url ? (
                  <Image src={mediaUrl(e.course.thumbnail_url)!} alt="" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">📚</div>
                )}
                {e.completed_at && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Complete
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-xs text-orange-600 font-semibold mb-1">{CATEGORY_LABEL[e.course.category]}</div>
                <h3 className="font-bold text-slate-900 mb-3 line-clamp-2">{e.course.title}</h3>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Progress</span>
                  <span className="text-slate-500">{Number(e.progress_percentage).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${e.progress_percentage}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
