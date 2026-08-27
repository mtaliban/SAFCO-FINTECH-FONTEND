'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES, CATEGORY_LABEL, LEVELS, courseApi, instructorApi, type Category, type Level } from '@/lib/course/api';

type FormData = {
  title: string;
  description?: string;
  category: Category;
  level: Level;
  duration_hours?: number;
  instructor_uuid?: string;
};

export default function NewCoursePage() {
  const router = useRouter();
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorApi.list(),
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { category: 'excel', level: 'beginner', duration_hours: 10 },
  });

  async function onSubmit(data: FormData) {
    try {
      const c = await courseApi.create(data);
      toast.success('Course imetengenezwa! Sasa ongeza modules na lessons.');
      router.push(`/trainer/courses/${c.uuid}/edit`);
    } catch { /* toast handled */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Tengeneza Course Mpya</h1>
      <p className="text-slate-600 mb-6">Anza na taarifa za msingi. Modules na lessons utaongeza baadaye (SRS 4.2).</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Course Title *</label>
          <input className="input" placeholder="Advanced Excel & Power Query" {...register('title', { required: true })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input" placeholder="Ni mafunzo gani? Ni watu wa kiwango gani?" {...register('description')} />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Category *</label>
            <select className="input" {...register('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Level *</label>
            <select className="input" {...register('level')}>
              {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Duration (hours)</label>
            <input type="number" min={1} className="input" {...register('duration_hours', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="label">Instructor</label>
            <select className="input" {...register('instructor_uuid')}>
              <option value="">— Mimi mwenyewe —</option>
              {(instructors?.data ?? []).map((i) => (
                <option key={i.uuid} value={i.uuid}>{i.name} ({i.email})</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Chagua trainer atakayefundisha course hii.</p>
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
