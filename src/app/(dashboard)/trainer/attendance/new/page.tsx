'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Video, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceApi } from '@/lib/attendance/api';

type FormData = {
  title: string;
  location?: string;
  late_threshold_minutes: number;
  when: 'now' | 'later';
  starts_at?: string;
};

function toLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewAttendanceSessionPage() {
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      late_threshold_minutes: 10,
      when: 'now',
      starts_at: toLocal(new Date(Date.now() + 60 * 60 * 1000)), // 1h from now default
    },
  });

  const when = watch('when');

  async function onSubmit(data: FormData) {
    try {
      const isNow = data.when === 'now';
      const startsAt = isNow ? new Date() : new Date(data.starts_at!);
      const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);

      const s = await attendanceApi.create({
        title: data.title,
        location: data.location || undefined,
        late_threshold_minutes: Number(data.late_threshold_minutes),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: isNow ? 'open' : 'scheduled',
      });

      toast.success(isNow ? 'Darasa limeanzishwa!' : 'Session imepangwa — wanafunzi wataiona!');
      router.push(`/trainer/attendance/${s.uuid}`);
    } catch { /* handled by interceptor */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Video className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Anza au Panga Darasa</h1>
        <p className="text-slate-500 mt-1">Wanafunzi wataona darasa kwenye akaunti zao na watajoin kwa click moja.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Jina la Darasa *</label>
          <input
            className="input text-lg"
            placeholder="Excel Advanced — Saa 2 Asubuhi"
            autoFocus
            {...register('title', { required: true })}
          />
        </div>

        <div>
          <label className="label">Mahali (si lazima)</label>
          <input className="input" placeholder="Online / Room 202" {...register('location')} />
        </div>

        {/* When to start */}
        <div>
          <label className="label">Lini linaanza?</label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${when === 'now' ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
              <input type="radio" value="now" {...register('when')} className="accent-green-600" />
              <div>
                <div className="font-semibold text-sm text-slate-900 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-green-600" /> Sasa Hivi
                </div>
                <div className="text-xs text-slate-500">Wanafunzi wajoin sasa</div>
              </div>
            </label>
            <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${when === 'later' ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
              <input type="radio" value="later" {...register('when')} className="accent-brand-600" />
              <div>
                <div className="font-semibold text-sm text-slate-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-600" /> Baadaye
                </div>
                <div className="text-xs text-slate-500">Panga mapema</div>
              </div>
            </label>
          </div>
        </div>

        {when === 'later' && (
          <div>
            <label className="label">Tarehe na Wakati *</label>
            <input
              type="datetime-local"
              className="input"
              {...register('starts_at', { required: when === 'later' })}
            />
            <p className="text-xs text-slate-400 mt-1">Wanafunzi wataona hii kwenye dashboard yao.</p>
          </div>
        )}

        <div>
          <label className="label">Dakika za kuchelewa</label>
          <input type="number" min={0} max={60} className="input" {...register('late_threshold_minutes')} />
          <p className="text-xs text-slate-400 mt-1">Akijoin baada ya dakika hizi → anachukuliwa amechelewa.</p>
        </div>

        <div className="pt-2 flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">Rudi</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 text-base py-3">
            {isSubmitting
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : when === 'now'
                ? <><Video className="w-5 h-5" /> Anza Darasa</>
                : <><Clock className="w-5 h-5" /> Panga Darasa</>}
          </button>
        </div>
      </form>
    </div>
  );
}
