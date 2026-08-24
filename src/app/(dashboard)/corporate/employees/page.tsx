'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

type Emp = {
  uuid: string;
  email: string;
  full_name?: string;
  position?: string;
  status: string;
  roles: string[];
  created_at: string;
};

const PAGE_SIZE = 10;

export default function CorporateEmployeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['corporate', 'my-employees'],
    queryFn: () => apiRequest.get<{ data: Emp[] }>('/corporate/my-employees'),
  });
  const [page, setPage] = useState(1);
  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(data?.data, page, PAGE_SIZE);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-orange-500" /> My Employees
        </h1>
        <p className="text-slate-600 mt-1">Wafanyakazi wa organization yako (SRS 3.4).</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : totalItems === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-3">👥</div>
          <p className="text-slate-500">Hakuna mfanyakazi bado. <a href="/corporate/invite" className="text-brand-600 underline">Alika wa kwanza</a>.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.uuid} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{e.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{e.email}</td>
                  <td className="px-4 py-3 text-slate-600">{e.position ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                      e.status === 'active' ? 'bg-green-100 text-green-700' :
                      e.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(e.created_at).toLocaleDateString('sw-TZ')}</td>
                </tr>
              ))}
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
