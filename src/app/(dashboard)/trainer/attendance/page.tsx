'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, QrCode, CheckCircle2, Clock } from 'lucide-react';
import { attendanceApi } from '@/lib/attendance/api';

export default function TrainerAttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['trainer', 'attendance-sessions'],
    queryFn: () => attendanceApi.list(),
  });

  const sessions = data?.data ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-7 h-7 text-orange-500" /> Attendance
          </h1>
          <p className="text-slate-600 mt-1">Rekodi mahudhurio kwa QR scan au manually (SRS Module 4).</p>
        </div>
        <Link href="/trainer/attendance/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Session
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : !sessions.length ? (
        <div className="card p-12 text-center">
          <QrCode className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Bado hakuna attendance session</h3>
          <p className="text-slate-500 mb-6">Anzisha session ya kwanza ya kuchukua mahudhurio.</p>
          <Link href="/trainer/attendance/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New Session
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sessions.map((s) => (
            <Link
              key={s.uuid}
              href={`/trainer/attendance/${s.uuid}`}
              className="card p-5 hover:shadow-md hover:border-brand-300 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-orange-600 font-semibold mb-1 truncate">
                    {s.course?.title ?? 'Standalone Session'}
                  </div>
                  <h3 className="font-bold text-slate-900">{s.title}</h3>
                  {s.location && <div className="text-sm text-slate-500 mt-1">📍 {s.location}</div>}
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mt-3">
                <div>
                  <div className="text-slate-400 uppercase">Starts</div>
                  <div className="font-semibold">{new Date(s.starts_at).toLocaleString('sw-TZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase">Late after</div>
                  <div className="font-semibold">{s.late_threshold_minutes} min</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase">Records</div>
                  <div className="font-semibold">{s.records_count}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    scheduled: { c: 'bg-slate-100 text-slate-700', label: 'Scheduled', icon: Clock },
    open: { c: 'bg-green-100 text-green-700', label: 'Live', icon: CheckCircle2 },
    closed: { c: 'bg-slate-100 text-slate-500', label: 'Closed', icon: Clock },
  };
  const st = map[status] ?? map.scheduled;
  const Icon = st.icon;
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 shrink-0 ${st.c}`}>
      <Icon className="w-3 h-3" /> {st.label}
    </span>
  );
}
