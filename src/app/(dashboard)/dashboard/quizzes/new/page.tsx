'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizApi, Quiz } from '@/lib/quiz/api';

export default function NewQuizPage() {
  const router = useRouter();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Partial<Quiz>>({
    defaultValues: {
      mode: 'live_kahoot',
      category: 'general',
      difficulty: 'beginner',
      default_time_per_question: 20,
      passing_mark_percentage: 50,
      max_attempts: 3,
    },
  });

  async function onSubmit(data: Partial<Quiz>) {
    try {
      const quiz = await quizApi.create(data);
      toast.success('Quiz imetengenezwa! Sasa ongeza maswali.');
      router.push(`/dashboard/quizzes/${quiz.id}/edit`);
    } catch { /* handled */ }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Tengeneza Quiz Mpya</h1>
      <p className="text-slate-600 mb-6">Anza kwa kuweka taarifa za msingi. Baadaye utaongeza maswali.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Jina la Quiz *</label>
          <input className="input" placeholder="Mfano: Excel Basics - Chapter 1" {...register('name', { required: true })} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input" placeholder="Elezea quiz hii..." {...register('description')} />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Mode</label>
            <select className="input" {...register('mode')}>
              <option value="live_kahoot">🎯 Live Kahoot-Style</option>
              <option value="self_paced">📖 Self-Paced</option>
              <option value="exam">📝 Exam</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" {...register('category')}>
              <option value="general">General</option>
              <option value="excel">Excel</option>
              <option value="power_query">Power Query</option>
              <option value="power_bi">Power BI</option>
              <option value="accounting">Accounting</option>
              <option value="finance">Finance</option>
              <option value="ifrs">IFRS</option>
              <option value="erp_systems">ERP Systems</option>
              <option value="coding">Coding</option>
              <option value="data_analytics">Data Analytics</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="label">Difficulty</label>
            <select className="input" {...register('difficulty')}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="label">Time per Question (s)</label>
            <select className="input" {...register('default_time_per_question')}>
              {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{n}s</option>)}
            </select>
          </div>
          <div>
            <label className="label">Passing Mark (%)</label>
            <input type="number" min={0} max={100} className="input" {...register('passing_mark_percentage')} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tengeneza & Endelea →'}
          </button>
        </div>
      </form>
    </div>
  );
}
