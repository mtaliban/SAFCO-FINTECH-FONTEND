'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2, Play } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

type Q = {
  uuid: string; name: string; description: string | null;
  category: string; difficulty: string;
  number_of_questions: number; duration_minutes: number; mode: string;
};

export default function AvailableQuizzesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'available'],
    queryFn: () => apiRequest.get<{ data: Q[] }>('/student/available-quizzes'),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-orange-500" /> Available Quizzes
        </h1>
        <p className="text-slate-600 mt-1">Quizzes zilizopublished — chagua ya kucheza (SRS 3.3).</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : !data?.data?.length ? (
        <div className="card p-12 text-center text-slate-400">Hakuna quiz iliyopublished kwa sasa.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((q) => (
            <div key={q.uuid} className="card p-5 hover:shadow-md transition flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-brand-100 text-brand-700 capitalize">
                  {q.category}
                </span>
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 capitalize">
                  {q.difficulty}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{q.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{q.description ?? 'No description'}</p>
              <div className="text-xs text-slate-500 mb-4">
                {q.number_of_questions} maswali · {q.duration_minutes ?? '—'} min
              </div>
              {q.mode === 'live_kahoot' ? (
                <Link href="/play" className="btn-primary text-sm w-full justify-center">
                  <Play className="w-3 h-3" /> Join via PIN
                </Link>
              ) : (
                <button disabled className="btn-secondary text-sm w-full justify-center opacity-50">
                  Coming — self-paced
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
