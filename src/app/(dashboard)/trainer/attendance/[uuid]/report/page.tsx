'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Loader2, Download, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { attendanceApi } from '@/lib/attendance/api';

export default function AttendanceReportPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'report', uuid],
    queryFn: () => attendanceApi.report(uuid as string),
  });

  function exportCsv() {
    if (!data) return;
    const rows = [['Email', 'Full Name', 'Status', 'Method', 'Checked In At']];
    for (const r of data.records) {
      rows.push([
        r.student.email,
        r.student.full_name ?? '',
        r.status,
        r.method,
        r.checked_in_at ?? '',
      ]);
    }
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${data.session.title.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || !data) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const t = data.totals;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <button onClick={() => router.push(`/trainer/attendance/${uuid}`)} className="text-sm text-brand-600 hover:underline flex items-center gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> Rudi kwenye session
      </button>

      <div className="mb-6 flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{data.session.title}</h1>
          <p className="text-slate-600 mt-1">Attendance Report · {new Date(data.session.starts_at).toLocaleString('sw-TZ')}</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Big percentage + counters */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 md:col-span-1 text-center">
          <div className="text-4xl font-black text-brand-600 mb-1">{data.attendance_percentage}%</div>
          <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Attendance</div>
        </div>
        <Counter icon={CheckCircle2} label="Present" value={t.present} accent="green" />
        <Counter icon={Clock} label="Late" value={t.late} accent="amber" />
        <Counter icon={XCircle} label="Absent" value={t.absent} accent="red" />
      </div>

      {/* Bar */}
      <div className="card p-5 mb-6">
        <h2 className="text-lg font-bold mb-3">Distribution</h2>
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
          {t.expected > 0 && (
            <>
              <div className="bg-green-500" style={{ width: `${(t.present / t.expected) * 100}%` }} title={`Present ${t.present}`} />
              <div className="bg-amber-500" style={{ width: `${(t.late / t.expected) * 100}%` }} title={`Late ${t.late}`} />
              <div className="bg-red-500" style={{ width: `${(t.absent / t.expected) * 100}%` }} title={`Absent ${t.absent}`} />
              <div className="bg-blue-500" style={{ width: `${(t.excused / t.expected) * 100}%` }} title={`Excused ${t.excused}`} />
            </>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs mt-2 text-slate-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Present {t.present}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-sm inline-block" /> Late {t.late}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> Absent {t.absent}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> Excused {t.excused}</span>
        </div>
      </div>

      {/* Absentees */}
      {data.absentees.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" /> Absentee List ({data.absentees.length})
          </h2>
          <div className="space-y-1">
            {data.absentees.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-red-50">
                <div>
                  <div className="font-semibold text-slate-900">{a.student.full_name ?? a.student.email}</div>
                  <div className="text-xs text-slate-500">{a.student.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All records */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Checked In</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((r) => (
              <tr key={r.uuid} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{r.student.full_name ?? r.student.email}</div>
                  <div className="text-xs text-slate-500">{r.student.email}</div>
                </td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                <td className="px-4 py-3 text-slate-500 uppercase text-xs">{r.method}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString('sw-TZ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Counter({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent: 'green' | 'amber' | 'red' | 'blue' }) {
  const bg = { green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600' }[accent];
  return (
    <div className="card p-5">
      <div className={`inline-flex w-10 h-10 rounded-lg items-center justify-center ${bg}`}><Icon className="w-5 h-5" /></div>
      <div className="mt-3 text-xs text-slate-500 uppercase font-semibold tracking-wider">{label}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}
