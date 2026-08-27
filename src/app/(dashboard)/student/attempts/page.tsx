'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Layers, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { attemptApi, type MyAttemptRow } from '@/lib/quiz/api';

export default function MyAttemptsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'my-attempts'],
    queryFn: () => attemptApi.myAttempts({ per_page: '50' }),
  });

  const rows: MyAttemptRow[] = data?.data ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-7 h-7 text-orange-500" /> My Attempts
        </h1>
        <p className="text-slate-600 mt-1">Practice tests, mock exams, and certifications you've taken.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-3">📝</div>
          <p className="text-slate-500">
            Bado hujaanza mtihani wowote. Nenda kwenye{' '}
            <Link href="/student/exams" className="text-brand-600 underline">Examinations</Link>.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Quiz</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Attempt #</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Result</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Completed</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{a.quiz?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold uppercase">
                      {a.exam_type ?? a.quiz?.mode ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">#{a.attempt_number}</td>
                  <td className="px-4 py-3 font-bold text-brand-700">
                    {a.percentage.toFixed(1)}%
                    <span className="text-slate-400 text-xs ml-1">({a.correct_answers}/{a.total_questions})</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold">
                        <Clock className="w-3 h-3" /> IN PROGRESS
                      </span>
                    ) : a.passed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> PASSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 text-xs font-semibold">
                        <XCircle className="w-3 h-3" /> FAILED
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.auto_submit_reason ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 text-xs">
                        <AlertTriangle className="w-3 h-3" /> {a.auto_submit_reason.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs uppercase">{a.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {a.completed_at ? new Date(a.completed_at).toLocaleString('sw-TZ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {a.status !== 'in_progress' && (
                      <Link href={`/student/exams/attempts/${a.id}`} className="text-brand-600 hover:text-brand-700 text-xs font-semibold underline">
                        View
                      </Link>
                    )}
                    {a.status === 'in_progress' && a.quiz && (
                      <Link href={`/student/exams/${a.quiz.id}/take`} className="text-amber-600 hover:text-amber-700 text-xs font-semibold underline">
                        Resume
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
