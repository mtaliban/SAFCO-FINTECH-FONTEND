'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2, BookOpen, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { courseApi, CATEGORY_LABEL, Course } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

const STATUS_STYLE: Record<string, { bg: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { bg: 'bg-slate-100 text-slate-700', label: 'Draft', icon: Clock },
  pending_approval: { bg: 'bg-amber-100 text-amber-800', label: 'Pending Approval', icon: Clock },
  published: { bg: 'bg-green-100 text-green-800', label: 'Published', icon: CheckCircle2 },
  rejected: { bg: 'bg-red-100 text-red-800', label: 'Rejected', icon: AlertCircle },
  archived: { bg: 'bg-slate-100 text-slate-500', label: 'Archived', icon: Clock },
};

export default function TrainerCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['trainer', 'courses'],
    queryFn: () => courseApi.list(),
  });

  const courses = (data?.data ?? []) as Course[];
  const [page, setPage] = useState(1);
  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(courses, page, PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-orange-500" /> My Courses
          </h1>
          <p className="text-slate-600 mt-1">Courses ulizotengeneza (SRS 3.2 Create courses).</p>
        </div>
        <Link href="/trainer/courses/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Course Mpya
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : totalItems === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Bado hujatengeneza course</h3>
          <p className="text-slate-500 mb-6">Anza kwa kutengeneza course yako ya kwanza.</p>
          <Link href="/trainer/courses/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Tengeneza Course
          </Link>
        </div>
      ) : (
        <>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((c) => {
            const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.draft;
            const Icon = st.icon;
            return (
              <Link key={c.uuid} href={`/trainer/courses/${c.uuid}/edit`} className="card hover:shadow-md transition overflow-hidden group">
                <div className="aspect-video bg-gradient-to-br from-navy-500 to-navy-800 relative">
                  {c.thumbnail_url ? (
                    <Image src={mediaUrl(c.thumbnail_url)!} alt="" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-40">📚</div>
                  )}
                  <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${st.bg}`}>
                    <Icon className="w-3 h-3" /> {st.label}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-xs text-orange-600 font-semibold mb-1">{CATEGORY_LABEL[c.category]}</div>
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">{c.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{c.stats.modules} modules</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.stats.enrollments}</span>
                    {c.duration_hours && <span>{c.duration_hours}h</span>}
                  </div>
                  {c.status === 'rejected' && c.rejection_reason && (
                    <p className="text-xs text-red-600 mt-2 line-clamp-2"><strong>Rejected:</strong> {c.rejection_reason}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
        />
        </>
      )}
    </div>
  );
}
