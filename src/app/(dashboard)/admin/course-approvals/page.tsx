'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCoursesApi, CATEGORY_LABEL } from '@/lib/course/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

export default function CourseApprovalsPage() {
  const qc = useQueryClient();
  const [rejectingUuid, setRejectingUuid] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'course-approvals'],
    queryFn: () => adminCoursesApi.pending(),
  });
  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(data?.data, page, PAGE_SIZE);

  async function approve(uuid: string) {
    if (!confirm('Approve course hii i-published?')) return;
    try {
      await adminCoursesApi.approve(uuid);
      toast.success('Course imepublished');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
    } catch { /* toast handled */ }
  }

  async function submitReject() {
    if (!rejectingUuid || !reason.trim()) return;
    try {
      await adminCoursesApi.reject(rejectingUuid, reason);
      toast.success('Course imekataliwa');
      setRejectingUuid(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
    } catch { /* toast handled */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-7 h-7 text-orange-500" /> Course Approvals
        </h1>
        <p className="text-slate-600 mt-1">Courses zilizosubmitwa na trainer (SRS 3.1 Approve courses).</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : totalItems === 0 ? (
        <div className="card p-12 text-center text-slate-400">Hakuna course inayosubiri approval.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.uuid} className="card p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">
                  {CATEGORY_LABEL[c.category as keyof typeof CATEGORY_LABEL]} · {c.level}
                </div>
                <h3 className="font-bold text-lg text-slate-900">{c.title}</h3>
                <div className="text-sm text-slate-500 mt-1">
                  By {c.instructor?.email} · {c.stats?.modules ?? 0} modules
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setRejectingUuid(c.uuid)} className="btn-secondary text-sm text-red-600">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => approve(c.uuid)} className="btn-primary text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
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

      {rejectingUuid && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setRejectingUuid(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">Reject Course</h3>
            <p className="text-sm text-slate-600 mb-4">Eleza kwa nini course haifikii viwango.</p>
            <textarea
              rows={4}
              className="input"
              placeholder="Course haina modules za kutosha, video URLs hazipo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setRejectingUuid(null); setReason(''); }} className="btn-secondary">Cancel</button>
              <button onClick={submitReject} disabled={!reason.trim()} className="btn-primary text-red-600">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
