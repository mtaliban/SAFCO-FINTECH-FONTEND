'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type Session = {
  uuid: string;
  pin: string;
  quiz: { uuid: string; name: string };
  status: string;
  participant_count: number;
  total_questions: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export default function TrainerSessionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['trainer', 'my-sessions'],
    queryFn: () => apiRequest.get<{ data: Session[] }>('/trainer/my-sessions'),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-orange-500" /> Session History
        </h1>
        <p className="text-slate-600 mt-1">Sessions zote ulizoendesha — washiriki na PIN.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">PIN</th>
                <th className="px-4 py-3 font-semibold">Quiz</th>
                <th className="px-4 py-3 font-semibold">Washiriki</th>
                <th className="px-4 py-3 font-semibold">Maswali</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Started</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((s) => (
                <tr key={s.uuid} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-navy-700">{s.pin}</td>
                  <td className="px-4 py-3 font-medium">{s.quiz?.name ?? '—'}</td>
                  <td className="px-4 py-3">{s.participant_count}</td>
                  <td className="px-4 py-3">{s.total_questions}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      s.status === 'completed' ? 'bg-green-100 text-green-700' :
                      s.status === 'waiting' ? 'bg-amber-100 text-amber-700' :
                      s.status.includes('question') ? 'bg-brand-100 text-brand-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{s.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {s.started_at ? new Date(s.started_at).toLocaleString('sw-TZ') : '—'}
                  </td>
                </tr>
              ))}
              {(!data?.data?.length) && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Bado hujaendesha session yoyote.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
