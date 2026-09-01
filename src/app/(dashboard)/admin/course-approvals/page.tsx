'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Loader2, Clock,
  BookOpen, Users, History, GraduationCap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  adminCoursesApi, CATEGORY_LABEL,
  type PendingApprovalCourse, type CourseHistoryItem,
} from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';
import { useNotifications } from '@/lib/notifications/hook';

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

type Tab = 'pending' | 'history';

export default function CourseApprovalsPage() {
  const { markReadForRoute } = useNotifications();
  const [tab, setTab] = useState<Tab>('pending');

  useEffect(() => { markReadForRoute('/admin/course-approvals'); }, [markReadForRoute]);

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin', 'course-approvals'],
    queryFn: () => adminCoursesApi.pending(),
    refetchInterval: 30_000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['admin', 'course-approvals-history'],
    queryFn: () => adminCoursesApi.history(),
    enabled: tab === 'history',
    staleTime: 60_000,
  });

  const pendingRows: PendingApprovalCourse[] = pendingData?.data ?? [];
  const historyRows: CourseHistoryItem[] = historyData?.data ?? [];
  const totalPending = pendingData?.meta?.total ?? pendingRows.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Course Approvals</h1>
            <p className="text-slate-500 text-sm">Kagua maudhui ya course kabla ya kuapprove au kukatalia</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <TabBtn active={tab === 'pending'} onClick={() => setTab('pending')}>
          <Clock className="w-4 h-4" /> Zinasubiri
          {totalPending > 0 && (
            <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {totalPending}
            </span>
          )}
        </TabBtn>
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>
          <History className="w-4 h-4" /> Historia
        </TabBtn>
      </div>

      {/* ── Pending tab ── */}
      {tab === 'pending' && (
        <>
          {pendingLoading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Inapakia...</p>
            </div>
          ) : pendingRows.length === 0 ? (
            <div className="card p-16 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-300 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 mb-1">Hakuna inayosubiri</h3>
              <p className="text-slate-400">Courses zote zimeshughulikiwa.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">{totalPending} course{totalPending !== 1 ? 's' : ''} zinasubiri ukaguzi</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {pendingRows.map((c) => (
                  <PendingCard key={c.uuid} course={c} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <>
          {historyLoading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Inapakia...</p>
            </div>
          ) : historyRows.length === 0 ? (
            <div className="card p-16 text-center">
              <History className="w-16 h-16 mx-auto text-slate-200 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 mb-1">Historia haina kitu bado</h3>
              <p className="text-slate-400">Courses zilizopitiwa zitaonekana hapa.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">{historyRows.length} courses zimeshughulikiwa</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {historyRows.map((c) => (
                  <HistoryCard key={c.uuid} course={c} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Pending course card — identical layout to student course card ── */
function PendingCard({ course: c }: { course: PendingApprovalCourse }) {
  return (
    <Link
      href={`/admin/course-approvals/${c.uuid}`}
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
        {/* Status badge */}
        <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-bold bg-amber-400 text-white flex items-center gap-1">
          <Clock className="w-3 h-3" /> Inasubiri
        </span>
        {/* Level badge */}
        <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-bold capitalize ${LEVEL_COLOR[c.level] ?? 'bg-white/90 text-slate-700'}`}>
          {c.level}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-bold text-orange-600">
            {CATEGORY_LABEL[c.category as keyof typeof CATEGORY_LABEL] ?? c.category}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 text-sm leading-snug flex-1 min-h-[2.5rem]">
          {c.title}
        </h3>
        {c.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>
        )}

        {/* Instructor */}
        {(c.instructor?.name ?? c.instructor?.email) && (
          <p className="text-xs text-slate-600 mb-3 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {c.instructor?.name ?? c.instructor?.email}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100 mt-auto">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {c.stats?.modules ?? 0} modules
          </span>
          {c.duration_hours && (
            <span className="flex items-center gap-1 ml-auto">
              <Users className="w-3 h-3" /> {c.duration_hours}h
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── History course card ── */
function HistoryCard({ course: c }: { course: CourseHistoryItem }) {
  const isApproved = c.status === 'published';
  const isRejected = c.status === 'rejected';

  return (
    <Link
      href={`/admin/course-approvals/${c.uuid}`}
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
        {/* Status badge */}
        {isApproved && (
          <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-bold bg-green-500 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        )}
        {isRejected && (
          <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-bold bg-red-500 text-white flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        )}
        <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-bold capitalize ${LEVEL_COLOR[c.level] ?? 'bg-white/90 text-slate-700'}`}>
          {c.level}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-bold text-orange-600">
            {CATEGORY_LABEL[c.category as keyof typeof CATEGORY_LABEL] ?? c.category}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 text-sm leading-snug flex-1 min-h-[2.5rem]">
          {c.title}
        </h3>

        {/* Instructor */}
        {(c.instructor?.name ?? c.instructor?.email) && (
          <p className="text-xs text-slate-600 mb-3 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {c.instructor?.name ?? c.instructor?.email}
          </p>
        )}

        {/* Reviewer */}
        {c.approver?.name && (
          <p className="text-xs text-slate-400 mb-2 truncate">
            {isApproved ? '✅' : '❌'} na {c.approver.name}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100 mt-auto">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {c.stats?.modules ?? 0} modules
          </span>
          {c.duration_hours && (
            <span className="flex items-center gap-1 ml-auto">
              <Users className="w-3 h-3" /> {c.duration_hours}h
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Tab button ── */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors
        ${active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
    >
      {children}
    </button>
  );
}
