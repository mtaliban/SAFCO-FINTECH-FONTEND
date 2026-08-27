'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

type UserRow = {
  uuid: string;
  email: string;
  status: string;
  full_name?: string;
  roles: string[];
  organization?: { name: string };
  created_at: string;
};

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiRequest.get<{ data: UserRow[]; meta: { total: number } }>('/admin/users'),
  });

  const [page, setPage] = useState(1);
  const { page: slice, lastPage, currentPage, totalItems } = usePagedSlice(data?.data, page, PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-orange-500" /> Users
        </h1>
        <p className="text-slate-600 mt-1">Kila mtumiaji kwenye mfumo (SRS 3.1).</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((u) => (
                <tr key={u.uuid} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-navy-700">{u.email}</td>
                  <td className="px-4 py-3">{u.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {(u.roles ?? []).map((r) => (
                      <span key={r} className="inline-block text-xs px-2 py-0.5 mr-1 rounded-full bg-brand-100 text-brand-700 capitalize">
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.organization?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' :
                      u.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{u.status}</span>
                  </td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Hakuna users bado.</td></tr>
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
