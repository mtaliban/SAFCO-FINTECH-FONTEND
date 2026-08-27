'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceApi } from '@/lib/attendance/api';
import { courseApi } from '@/lib/course/api';

type FormData = {
  title: string;
  course_uuid?: string;
  location?: string;
  starts_at: string;
  ends_at: string;
  late_threshold_minutes: number;
  status: 'scheduled' | 'open';
};

export default function NewAttendanceSessionPage() {
  const router = useRouter();
  const now = new Date();
  const later = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const { data: courses } = useQuery({
    queryKey: ['courses', 'for-attendance'],
    queryFn: () => courseApi.list({ status: 'published' }),
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      late_threshold_minutes: 10,
      status: 'open',
      starts_at: toLocal(now),
      ends_at: toLocal(later),
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const s = await attendanceApi.create({
        title: data.title,
        course_uuid: data.course_uuid || undefined,
        location: data.location || undefined,
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
        late_threshold_minutes: Number(data.late_threshold_minutes),
        status: data.status,
      });
      toast.success('Attendance session imetengenezwa!');
      router.push(`/trainer/attendance/${s.uuid}`);
    } catch { /* toast handled */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">New Attendance Session</h1>
      <p className="text-slate-600 mb-6">SRS 4 — Record attendance, QR scan, late detection.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Session Title *</label>
          <input className="input" placeholder="Excel Class — 12 Aug" {...register('title', { required: true })} />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Course (optional)</label>
            <select className="input" {...register('course_uuid')}>
              <option value="">— Standalone (no course) —</option>
              {(courses?.data ?? []).map((c) => (
                <option key={c.uuid} value={c.uuid}>{c.title}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Ikichaguliwa, absentees zitatoka kwenye enrolled students.</p>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="Room 202, HQ" {...register('location')} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Starts At *</label>
            <input type="datetime-local" className="input" {...register('starts_at', { required: true })} />
          </div>
          <div>
            <label className="label">Ends At *</label>
            <input type="datetime-local" className="input" {...register('ends_at', { required: true })} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Late Threshold (minutes)</label>
            <input type="number" min={0} max={120} className="input" {...register('late_threshold_minutes')} />
            <p className="text-xs text-slate-500 mt-1">Check-ins after this many minutes past start → flagged 'late'.</p>
          </div>
          <div>
            <label className="label">Initial Status</label>
            <select className="input" {...register('status')}>
              <option value="open">Open — QR active immediately</option>
              <option value="scheduled">Scheduled — activate later</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Anzisha Session →'}
          </button>
        </div>
      </form>
    </div>
  );
}

function toLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
