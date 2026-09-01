'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Loader2, Clock,
  BookOpen, Users, LayoutGrid, Calendar, History, Eye,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  adminCoursesApi, CATEGORY_LABEL,
  type PendingApprovalCourse, type CourseHistoryItem,
} from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';
import { useNotifications } from '@/lib/notifications/hook';

const PAGE_SIZE = 10;

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', expert: 'Expert',
};

type Tab = 'pending' | 'history';

export default function CourseApprovalsPage() {
  const qc = useQueryClient();
  const { markReadForRoute } = useNotifications();
  const [tab, setTab] = useState<Tab>('pending');
  const [rejectingUuid, setRejectingUuid] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);

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

  const { page: pendingRows, lastPage, currentPage, totalItems } =
    usePagedSlice(pendingData?.data, page, PAGE_SIZE);

  const historyRows: CourseHistoryItem[] = historyData?.data ?? [];

  async function approve(uuid: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Approve course hii i-published?')) return;
    try {
      await adminCoursesApi.approve(uuid);
      toast.success('✅ Course imepublished — trainer amearifu');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals-history'] });
    } catch { /* toast handled */ }
  }

  async function submitReject() {
    if (!rejectingUuid || !reason.trim()) return;
    try {
      await adminCoursesApi.reject(rejectingUuid, reason);
      toast.success('Course imekataliwa — trainer amearifu');
      setRejectingUuid(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals-history'] });
    } catch { /* toast handled */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-orange-500" /> Course Approvals
          </h1>
          <p className="text-slate-600 mt-1">
            Kagua maudhui ya course kabla ya kuapprove au kukatalia.
          </p>
        </div>
        {tab === 'pending' && totalItems > 0 && (
          <span className="shrink-0 bg-amber-100 text-amber-800 font-black text-lg px-4 py-2 rounded-2xl border border-amber-200">
            {totalItems} zinasubiri
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <TabBtn active={tab === 'pending'} onClick={() => { setTab('pending'); setPage(1); }}>
          <Clock className="w-4 h-4" /> Zinasubiri
          {(pendingData?.data?.length ?? 0) > 0 && (
            <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingData!.data.length}
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
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
          ) : totalItems === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-300 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 mb-1">Hakuna inayosubiri</h3>
              <p className="text-slate-400">Courses zote zimeshughulikiwa.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRows.map((c: PendingApprovalCourse) => (
                <PendingCard
                  key={c.uuid}
                  course={c}
                  onApprove={(e) => approve(c.uuid, e)}
                  onReject={() => { setRejectingUuid(c.uuid); setReason(''); }}
                />
              ))}

              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={setPage}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <>
          {historyLoading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
          ) : historyRows.length === 0 ? (
            <div className="card p-12 text-center">
              <History className="w-16 h-16 mx-auto text-slate-200 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 mb-1">Historia haina kitu bado</h3>
              <p className="text-slate-400">Courses zilizopitiwa zitaonekana hapa.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyRows.map((c) => (
                <HistoryCard key={c.uuid} course={c} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectingUuid && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setRejectingUuid(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Kataa Course
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Eleza kwa nini course haikubaliwa — trainer ataona sababu hii.
            </p>
            <textarea
              rows={4}
              className="input"
              placeholder="Mfano: Video hazipo, maelezo ya modules ni mafupi sana, thumbnail haipo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setRejectingUuid(null); setReason(''); }} className="btn-secondary">Ghairi</button>
              <button
                onClick={submitReject}
                disabled={!reason.trim()}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Kataa & Arifu Trainer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pending course card ── */
function PendingCard({
  course: c,
  onApprove,
  onReject,
}: {
  course: PendingApprovalCourse;
  onApprove: (e: React.MouseEvent) => void;
  onReject: () => void;
}) {
  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/admin/course-approvals/${c.uuid}`} className="flex gap-0">
        {/* Thumbnail */}
        <div className="w-40 shrink-0 hidden sm:block relative bg-gradient-to-br from-navy-500 to-navy-800">
          {c.thumbnail_url ? (
            <Image src={mediaUrl(c.thumbnail_url)!} alt="" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">📚</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">
              {CATEGORY_LABEL[c.category as keyof typeof CATEGORY_LABEL]}
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {LEVEL_LABEL[c.level] ?? c.level}
            </span>
            {c.duration_hours && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {c.duration_hours}h
              </span>
            )}
          </div>

          <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{c.title}</h3>

          {c.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-2">{c.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {c.instructor?.name ?? c.instructor?.email ?? 'Hakuna instructor'}
            </span>
            <span className="flex items-center gap-1">
              <LayoutGrid className="w-3 h-3" />
              {c.stats?.modules ?? 0} modules
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Imetumwa {new Date(c.submitted_at).toLocaleString('sw-TZ')}
            </span>
          </div>
        </div>
      </Link>

      {/* Action bar — separate from the link */}
      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap border-t border-slate-100 pt-3">
        <Link
          href={`/admin/course-approvals/${c.uuid}`}
          className="btn-secondary text-sm gap-1.5"
        >
          <Eye className="w-4 h-4" /> Soma Course
        </Link>
        <div className="flex-1" />
        <button
          onClick={onReject}
          className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50 gap-1"
        >
          <XCircle className="w-4 h-4" /> Kataa
        </button>
        <button onClick={onApprove} className="btn-primary text-sm gap-1">
          <CheckCircle2 className="w-4 h-4" /> Approve
        </button>
      </div>
    </div>
  );
}

/* ── History card ── */
function HistoryCard({ course }: { course: CourseHistoryItem }) {
  const [open, setOpen] = useState(false);
  const isApproved = course.status === 'published';
  const isRejected = course.status === 'rejected';

  return (
    <div className="card overflow-hidden">
      <Link href={`/admin/course-approvals/${course.uuid}`} className="flex gap-0 hover:bg-slate-50/50 transition">
        {/* Thumbnail */}
        <div className="w-32 shrink-0 hidden sm:block relative bg-gradient-to-br from-navy-500 to-navy-800">
          {course.thumbnail_url ? (
            <Image src={mediaUrl(course.thumbnail_url)!} alt="" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">📚</div>
          )}
        </div>

        <div className="flex-1 p-4 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {isApproved && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Imepublished
                </span>
              )}
              {isRejected && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> Imekataliwa
                </span>
              )}
              <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">
                {CATEGORY_LABEL[course.category as keyof typeof CATEGORY_LABEL] ?? course.category}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 leading-tight">{course.title}</h3>

            <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {course.instructor?.name ?? course.instructor?.email ?? '—'}
              </span>
              <span className="flex items-center gap-1">
                <LayoutGrid className="w-3 h-3" />
                {course.stats?.modules ?? 0} modules
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {isApproved && course.approved_at
                  ? `Imepitishwa ${new Date(course.approved_at).toLocaleString('sw-TZ')}`
                  : `Imesasishwa ${new Date(course.updated_at).toLocaleString('sw-TZ')}`}
              </span>
              {course.approver?.name && (
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  na {course.approver.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
            <Link href={`/admin/course-approvals/${course.uuid}`} className="btn-secondary text-sm gap-1">
              <Eye className="w-4 h-4" /> Angalia
            </Link>
            {isRejected && course.rejection_reason && (
              <button
                onClick={(e) => { e.preventDefault(); setOpen(!open); }}
                className="btn-secondary text-sm gap-1 text-red-600 border-red-200"
              >
                <BookOpen className="w-4 h-4" /> Sababu
              </button>
            )}
          </div>
        </div>
      </Link>

      {open && isRejected && course.rejection_reason && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-4">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Sababu ya Kukataliwa</p>
          <p className="text-sm text-red-800 leading-relaxed whitespace-pre-wrap">{course.rejection_reason}</p>
        </div>
      )}
    </div>
  );
}

/* ── Tab button ── */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors
        ${active
          ? 'border-brand-600 text-brand-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
      {children}
    </button>
  );
}
