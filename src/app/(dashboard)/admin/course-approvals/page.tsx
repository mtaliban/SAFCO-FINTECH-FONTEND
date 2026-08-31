'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Loader2, Clock, ChevronDown, ChevronUp,
  BookOpen, Users, LayoutGrid, Calendar, Award, Eye,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminCoursesApi, CATEGORY_LABEL, type PendingApprovalCourse } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';
import { useNotifications } from '@/lib/notifications/hook';

const PAGE_SIZE = 10;

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', expert: 'Expert',
};

export default function CourseApprovalsPage() {
  const qc = useQueryClient();
  const { markReadForRoute } = useNotifications();
  const [rejectingUuid, setRejectingUuid] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Clear notification badge as soon as admin opens this page
  useEffect(() => { markReadForRoute('/admin/course-approvals'); }, [markReadForRoute]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'course-approvals'],
    queryFn: () => adminCoursesApi.pending(),
    refetchInterval: 30_000,
  });

  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(data?.data, page, PAGE_SIZE);

  async function approve(uuid: string) {
    if (!confirm('Approve course hii i-published?')) return;
    try {
      await adminCoursesApi.approve(uuid);
      toast.success('✅ Course imepublished — trainer amearifu');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
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
    } catch { /* toast handled */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-orange-500" /> Course Approvals
          </h1>
          <p className="text-slate-600 mt-1">
            Kagua maudhui ya course kabla ya kuapprove au kukatalia.
          </p>
        </div>
        {totalItems > 0 && (
          <span className="shrink-0 bg-amber-100 text-amber-800 font-black text-lg px-4 py-2 rounded-2xl border border-amber-200">
            {totalItems} zinasubiri
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : totalItems === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-1">Hakuna inayosubiri</h3>
          <p className="text-slate-400">Courses zote zimeshughulikiwa.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((c: PendingApprovalCourse) => {
            const isExpanded = expandedUuid === c.uuid;
            return (
              <div key={c.uuid} className="card overflow-hidden">
                {/* Card header — always visible */}
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-full md:w-24 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-navy-500 to-navy-800 shrink-0 relative">
                    {c.thumbnail_url ? (
                      <Image src={mediaUrl(c.thumbnail_url)!} alt="" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-40">📚</div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0">
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
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{c.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link
                      href={`/admin/course-approvals/${c.uuid}`}
                      className="btn-secondary text-sm gap-1"
                    >
                      <Eye className="w-4 h-4" /> Soma Yote
                    </Link>
                    <button
                      onClick={() => setExpandedUuid(isExpanded ? null : c.uuid)}
                      className="btn-secondary text-sm gap-1"
                    >
                      <BookOpen className="w-4 h-4" />
                      {isExpanded ? 'Funga' : 'Muhtasari'}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => { setRejectingUuid(c.uuid); setReason(''); }}
                      className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" /> Kataa
                    </button>
                    <button onClick={() => approve(c.uuid)} className="btn-primary text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                  </div>
                </div>

                {/* Expandable preview */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5">
                    <div className="grid md:grid-cols-[1fr_280px] gap-6">
                      {/* Left: description + structure */}
                      <div>
                        {c.description ? (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Maelezo</h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic mb-4">Maelezo hayapo.</p>
                        )}

                        {/* Structure summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <StatChip icon={<LayoutGrid className="w-4 h-4" />} label="Modules" value={c.stats?.modules ?? 0} color="brand" />
                          <StatChip icon={<Award className="w-4 h-4" />} label="Level" value={LEVEL_LABEL[c.level] ?? c.level} color="amber" />
                          <StatChip icon={<Clock className="w-4 h-4" />} label="Muda" value={c.duration_hours ? `${c.duration_hours}h` : '—'} color="green" />
                        </div>

                        {/* Quick approve/reject at bottom of preview */}
                        <div className="flex gap-2 mt-5 pt-4 border-t border-slate-200">
                          <button
                            onClick={() => { setRejectingUuid(c.uuid); setReason(''); setExpandedUuid(null); }}
                            className="flex-1 btn-secondary text-sm text-red-600 border-red-200 justify-center"
                          >
                            <XCircle className="w-4 h-4" /> Kataa Course
                          </button>
                          <button onClick={() => approve(c.uuid)} className="flex-1 btn-primary text-sm justify-center">
                            <CheckCircle2 className="w-4 h-4" /> ✅ Approve & Publish
                          </button>
                        </div>
                      </div>

                      {/* Right: thumbnail large + instructor */}
                      <div className="space-y-4">
                        <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-navy-500 to-navy-800 relative">
                          {c.thumbnail_url ? (
                            <Image src={mediaUrl(c.thumbnail_url)!} alt="" fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">📚</div>
                          )}
                        </div>
                        <div className="rounded-xl bg-white border border-slate-200 p-4">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Instructor</div>
                          <div className="font-semibold text-slate-800">{c.instructor?.name ?? '—'}</div>
                          <div className="text-xs text-slate-500">{c.instructor?.email ?? ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* Reject modal */}
      {rejectingUuid && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setRejectingUuid(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Kataa Course
            </h3>
            <p className="text-sm text-slate-600 mb-4">Eleza kwa nini course haikubaliwa — trainer ataona sababu hii na ataweza kuhariri.</p>
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
                <XCircle className="w-4 h-4" /> Kataa & Arif Trainer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number;
  color: 'brand' | 'amber' | 'green';
}) {
  const cls = color === 'amber' ? 'bg-amber-50 text-amber-700'
    : color === 'green' ? 'bg-green-50 text-green-700'
    : 'bg-brand-50 text-brand-700';
  return (
    <div className={`rounded-lg p-3 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
        {icon} {label}
      </div>
      <div className="font-black text-lg">{value}</div>
    </div>
  );
}
