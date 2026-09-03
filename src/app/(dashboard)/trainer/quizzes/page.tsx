'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Play, Zap, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { Quiz, quizApi } from '@/lib/quiz/api';

export default function TrainerQuizzesPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['trainer', 'my-quizzes'],
    queryFn: () => apiRequest.get<{ data: Quiz[] }>('/trainer/my-quizzes'),
  });

  const quizzes = data?.data ?? [];

  async function hostLive(q: Quiz) {
    try {
      const session = await quizApi.host(q.id);
      toast.success(`Session started! PIN: ${session.pin}`);
      router.push(`/dashboard/quizzes/${q.id}/host/${session.id}?pin=${session.pin}`);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to start session';
      toast.error(msg);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Quizzes</h1>
          <p className="text-slate-600 mt-1">Quizzes ulizotengeneza wewe mwenyewe (SRS 3.2).</p>
        </div>
        <Link href="/dashboard/quizzes/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Quiz Mpya
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : !quizzes.length ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Bado hujatengeneza quiz</h3>
          <p className="text-slate-500 mb-6">Anza kwa kutengeneza quiz yako ya kwanza.</p>
          <Link href="/dashboard/quizzes/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Tengeneza Quiz
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q) => (
            <div key={q.id} className="card p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  q.status === 'published' ? 'bg-green-100 text-green-700' :
                  q.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{q.status}</span>
                {q.mode === 'live_kahoot' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-brand-100 text-brand-700">
                    <Zap className="w-3 h-3" /> SAFCO Live
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{q.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{q.description ?? 'No description'}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {q.number_of_questions} Q</span>
                <span>{q.category}</span>
                <span>{q.difficulty}</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/dashboard/quizzes/${q.id}/edit`} className="btn-secondary flex-1 text-sm">Edit</Link>
                {q.status === 'published' && q.mode === 'live_kahoot' && (
                  <button onClick={() => hostLive(q)} className="btn-primary flex-1 text-sm">
                    <Play className="w-3 h-3" /> Host Live
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
