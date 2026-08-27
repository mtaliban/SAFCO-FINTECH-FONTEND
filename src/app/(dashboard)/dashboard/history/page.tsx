'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { LoginHistoryItem, PaginatedResponse } from '@/types';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Monitor, Smartphone, Tablet, Globe } from 'lucide-react';

export default function LoginHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['login-history'],
    queryFn: () => apiRequest.get<PaginatedResponse<LoginHistoryItem>>('/users/login-history?per_page=30'),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Login History</h1>
        <p className="text-slate-600 mt-1">Angalia ni wapi na wakati gani umeingia kwenye akaunti yako.</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 sm:p-6 lg:p-8 text-center text-slate-500">Inapakia...</div>
        ) : !data?.data?.length ? (
          <div className="p-4 sm:p-6 lg:p-8 text-center text-slate-500">Hakuna login history bado.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Browser / OS</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition text-sm">
                  <td className="px-4 py-3">
                    {h.status === 'success' || h.status === 'logged_out' ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" /> {h.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" /> {h.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <DeviceIcon type={h.device_type} />
                      {h.device_name ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {h.browser ?? '—'} · {h.os ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{h.ip_address}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {h.city ? `${h.city}, ${h.country}` : h.country ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {format(new Date(h.created_at), 'dd MMM yyyy, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DeviceIcon({ type }: { type: string | null }) {
  const cls = 'w-4 h-4 text-slate-500';
  if (type === 'mobile' || type === 'phone') return <Smartphone className={cls} />;
  if (type === 'tablet') return <Tablet className={cls} />;
  if (type === 'desktop') return <Monitor className={cls} />;
  return <Globe className={cls} />;
}
