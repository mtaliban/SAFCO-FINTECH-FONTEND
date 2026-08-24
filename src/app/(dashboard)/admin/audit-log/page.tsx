'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

type Entry = {
  id: number;
  user: { uuid: string; email: string };
  ip_address: string;
  user_agent: string;
  device_type: string;
  location: string | null;
  status: string;
  created_at: string;
};

const PAGE_SIZE = 10;

export default function AuditLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log'],
    queryFn: () => apiRequest.get<{ data: Entry[]; meta: { total: number } }>('/admin/audit-log'),
  });
  const [page, setPage] = useState(1);
  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(data?.data, page, PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-7 h-7 text-orange-500" /> Audit Log
        </h1>
        <p className="text-slate-600 mt-1">
          Kila login ya mtumiaji yeyote kwenye mfumo — IP, kifaa, hali (SRS 3.1 Security).
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">IP</th>
                <th className="px-4 py-3 font-semibold">Device</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(e.created_at).toLocaleString('sw-TZ')}</td>
                  <td className="px-4 py-3 font-medium text-navy-700">{e.user?.email ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.ip_address ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 capitalize">{e.device_type ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                      e.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{e.status}</span>
                  </td>
                </tr>
              ))}
              {totalItems === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Hakuna records za login bado.</td></tr>
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
