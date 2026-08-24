'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

type Quiz = { id: string; name: string; category: string; mode: string; status: string; creator?: { name?: string } };
const PAGE_SIZE = 10;

export default function AdminQuizzesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'all-quizzes'],
    queryFn: () => api.get('/quizzes').then((r) => r.data.data as Quiz[]),
  });
  const [page, setPage] = useState(1);
  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(data, page, PAGE_SIZE);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-7 h-7 text-orange-500" /> All Quizzes
        </h1>
        <p className="text-slate-600 mt-1">Read-only system-wide view (trainer wa kila mtu).</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Creator</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-navy-700">{q.name}</td>
                  <td className="px-4 py-3 text-slate-600">{q.creator?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{q.category}</td>
                  <td className="px-4 py-3 text-slate-600">{q.mode === 'live_kahoot' ? 'SAFCO Live' : q.mode}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      q.status === 'published' ? 'bg-green-100 text-green-700' :
                      q.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{q.status}</span>
                  </td>
                </tr>
              ))}
              {totalItems === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Hakuna quizzes bado.</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination
              currentPage={currentPage}
              lastPage={lastPage}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          </div>
        </div>
      )}
    </div>
  );
}
