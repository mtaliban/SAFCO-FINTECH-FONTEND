'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, UserPlus, BarChart3 } from 'lucide-react';
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-orange-500" /> My Employees
          </h1>
          <p className="text-slate-600 mt-1">Wafanyakazi wa organization yako.</p>
        </div>
        <Link
          href="/corporate/invite"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Alika Mfanyakazi
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : totalItems === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-3">👥</div>
          <p className="text-slate-500 mb-4">Hakuna mfanyakazi bado.</p>
          <Link href="/corporate/invite" className="btn btn-primary inline-flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Alika wa Kwanza
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Jina</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Nafasi</th>
                  <th className="px-4 py-3 font-semibold">Hali</th>
                  <th className="px-4 py-3 font-semibold">Aliongezwa</th>
                  <th className="px-4 py-3 font-semibold">Ripoti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((e) => (
                  <tr key={e.uuid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xs shrink-0">
                          {(e.full_name || e.email).charAt(0).toUpperCase()}
                        </div>
                        {e.full_name ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{e.email}</td>
                    <td className="px-4 py-3 text-slate-500">{e.position ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                        e.status === 'active'  ? 'bg-green-100 text-green-700'  :
                        e.status === 'pending' ? 'bg-amber-100 text-amber-700'  :
                        'bg-slate-100 text-slate-600'
                      }`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(e.created_at).toLocaleDateString('sw-TZ')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/corporate/employees/${e.uuid}/report`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-800 hover:underline transition"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> Angalia Ripoti
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 border-t border-slate-100">
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
