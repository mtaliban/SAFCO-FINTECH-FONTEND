'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceApi } from '@/lib/attendance/api';

type FormData = {
  title: string;
  location?: string;
  late_threshold_minutes: number;
};

export default function NewAttendanceSessionPage() {
  const router = useRouter();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { late_threshold_minutes: 10 },
  });

  async function onSubmit(data: FormData) {
    try {
      const now = new Date();
      const ends = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4h default window
      const s = await attendanceApi.create({
        title: data.title,
        location: data.location || undefined,
        late_threshold_minutes: Number(data.late_threshold_minutes),
        starts_at: now.toISOString(),
        ends_at: ends.toISOString(),
        status: 'open',
      });
      toast.success('Session imeanzishwa!');
      router.push(`/trainer/attendance/${s.uuid}`);
    } catch { /* handled by interceptor */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Video className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Anza Darasa la Live</h1>
        <p className="text-slate-500 mt-1">Wanafunzi watajoin kwa link utakayowatumia.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Jina la Darasa *</label>
          <input
            className="input text-lg"
            placeholder="Excel Advanced — Sept 2"
            autoFocus
            {...register('title', { required: true })}
          />
        </div>

        <div>
          <label className="label">Mahali (si lazima)</label>
          <input
            className="input"
            placeholder="Room 202 / Online"
            {...register('location')}
          />
        </div>

        <div>
          <label className="label">Dakika za kuchelewa</label>
          <input
            type="number" min={0} max={60}
            className="input"
            {...register('late_threshold_minutes')}
          />
          <p className="text-xs text-slate-400 mt-1">Akijoin baada ya dakika hizi tangu kuanza → anachukuliwa amechelewa.</p>
        </div>

        <div className="pt-2 flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
            Rudi
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 text-base py-3">
            {isSubmitting
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><Video className="w-5 h-5" /> Anza Darasa</>}
          </button>
        </div>
      </form>
    </div>
  );
}
