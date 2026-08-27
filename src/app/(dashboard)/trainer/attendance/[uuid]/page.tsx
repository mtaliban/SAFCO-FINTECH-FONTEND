'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, QrCode, RefreshCw, X, CheckCircle2, XCircle, Clock,
  AlertCircle, BarChart3, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { subscribe } from '@/lib/mqtt';
import { attendanceApi } from '@/lib/attendance/api';

type CheckInEvent = {
  session_uuid: string;
  record_uuid: string;
  student: { uuid: string; email: string; full_name?: string };
  status: 'present' | 'late' | 'absent' | 'excused';
  method: 'qr' | 'manual' | 'auto';
  checked_in_at: string | null;
  ts: string;
};

export default function LiveAttendanceSessionPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [qrBlob, setQrBlob] = useState<string | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['attendance-session', uuid],
    queryFn: () => attendanceApi.get(uuid as string),
    refetchInterval: (q) => q.state.data?.status === 'open' ? 15000 : false,
  });

  // Load QR SVG as authenticated blob (Bearer needs to be set)
  async function loadQr() {
    try {
      const r = await api.get(`/attendance-sessions/${uuid}/qr`, { responseType: 'blob' });
      if (qrBlob) URL.revokeObjectURL(qrBlob);
      setQrBlob(URL.createObjectURL(r.data));
    } catch { /* toast handled */ }
  }
  useEffect(() => {
    if (session?.status === 'open') loadQr();
    return () => { if (qrBlob) URL.revokeObjectURL(qrBlob); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.qr_token]);

  // Live check-in events via MQTT
  useEffect(() => {
    if (!uuid) return;
    const unsub = subscribe(`safco/lms/attendance/${uuid}/checkin`, (payload) => {
      const ev = payload as CheckInEvent;
      const label = ev.student.full_name ?? ev.student.email;
      const emoji = ev.status === 'present' ? '✅' : ev.status === 'late' ? '⏰' : '❌';
      toast.success(`${emoji} ${label} — ${ev.status}${ev.method === 'qr' ? ' (QR)' : ''}`);
      qc.invalidateQueries({ queryKey: ['attendance-session', uuid] });
    });
    return () => unsub();
  }, [uuid, qc]);

  async function rotate() {
    if (!confirm('Rotate QR? Wachezaji lazima wa-scan mpya.')) return;
    await attendanceApi.rotateQr(uuid as string);
    toast.success('QR imebadilishwa');
    qc.invalidateQueries({ queryKey: ['attendance-session', uuid] });
  }
  async function closeSession() {
    if (!confirm('Funga session? Absentees wote wa-marked.')) return;
    const res = await api.post(`/attendance-sessions/${uuid}/close`);
    toast.success(res.data.message ?? 'Closed');
    qc.invalidateQueries({ queryKey: ['attendance-session', uuid] });
  }
  async function markStudent(studentUuid: string, status: 'present' | 'late' | 'absent' | 'excused') {
    await attendanceApi.mark(uuid as string, studentUuid, status);
    qc.invalidateQueries({ queryKey: ['attendance-session', uuid] });
  }
  async function openSession() {
    await api.post(`/attendance-sessions/${uuid}/open`);
    toast.success('Session opened');
    qc.invalidateQueries({ queryKey: ['attendance-session', uuid] });
  }

  if (isLoading || !session) return <div className="p-4 sm:p-6 lg:p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const recordedByStudent = new Map(session.records.map((r) => [r.student.uuid, r]));
  const expected = session.expected_students;
  const isOpen = session.status === 'open';
  const isClosed = session.status === 'closed';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{session.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
            <SessionStatusBadge status={session.status} />
            {session.course && <span className="text-slate-500">{session.course.title}</span>}
            {session.location && <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.location}</span>}
            <span className="text-slate-500">Starts: {new Date(session.starts_at).toLocaleString('sw-TZ')}</span>
            <span className="text-slate-500">Late threshold: {session.late_threshold_minutes} min</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => router.push(`/trainer/attendance/${uuid}/report`)} className="btn-secondary text-sm">
            <BarChart3 className="w-4 h-4" /> Report
          </button>
          {!isOpen && !isClosed && (
            <button onClick={openSession} className="btn-primary text-sm">Open Session</button>
          )}
          {isOpen && (
            <button onClick={closeSession} className="btn-secondary text-sm text-red-600">
              <X className="w-4 h-4" /> Close
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* QR + summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            {isOpen ? (
              <>
                <div className="text-center mb-3">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Scan to Check In</div>
                </div>
                {qrBlob ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrBlob} alt="Attendance QR" className="w-full aspect-square rounded" />
                ) : (
                  <div className="aspect-square bg-slate-100 rounded flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                )}
                <button onClick={rotate} className="btn-secondary text-sm w-full mt-3">
                  <RefreshCw className="w-4 h-4" /> Rotate QR
                </button>
                <div className="mt-3 text-xs text-slate-500 text-center break-all">
                  Token: {session.qr_token.slice(0, 12)}...
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-16 h-16 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">
                  {isClosed ? 'Session imefungwa. QR haifanyi kazi tena.' : 'Bofya "Open Session" ili QR ianze kufanya kazi.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live roster */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4">Roster {expected.length > 0 && `(${expected.length} enrolled)`}</h2>
            {expected.length === 0 ? (
              <p className="text-slate-500 text-sm">
                No enrolled students — session haijaunganishwa na course, au course haina enrollments.
                Records zote hapa chini ni manual/QR-only.
              </p>
            ) : (
              <div className="space-y-2">
                {expected.map((stu) => {
                  const rec = recordedByStudent.get(stu.uuid);
                  return (
                    <RosterRow
                      key={stu.uuid}
                      student={stu}
                      record={rec}
                      canMark={isOpen}
                      onMark={(s) => markStudent(stu.uuid, s)}
                    />
                  );
                })}
              </div>
            )}

            {/* Walk-ins: recorded students NOT in expected (e.g. manual mark w/o enrollment) */}
            {session.records.some((r) => !expected.find((s) => s.uuid === r.student.uuid)) && (
              <>
                <h3 className="text-sm font-bold text-slate-700 mt-6 mb-2">Walk-ins</h3>
                <div className="space-y-2">
                  {session.records
                    .filter((r) => !expected.find((s) => s.uuid === r.student.uuid))
                    .map((r) => (
                      <RosterRow key={r.uuid} student={r.student} record={r} canMark={false} onMark={() => {}} />
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'bg-slate-100 text-slate-700',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${map[status] ?? ''}`}>{status}</span>;
}

function RosterRow({ student, record, canMark, onMark }: {
  student: { uuid: string; email: string; full_name?: string };
  record?: { status: string; method: string; checked_in_at: string | null };
  canMark: boolean;
  onMark: (status: 'present' | 'late' | 'absent' | 'excused') => void;
}) {
  const st = record?.status;
  const statusMap: Record<string, { c: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    present: { c: 'text-green-700 bg-green-100', icon: CheckCircle2, label: 'Present' },
    late: { c: 'text-amber-700 bg-amber-100', icon: Clock, label: 'Late' },
    absent: { c: 'text-red-700 bg-red-100', icon: XCircle, label: 'Absent' },
    excused: { c: 'text-navy-600 bg-navy-100', icon: AlertCircle, label: 'Excused' },
  };
  const style = st ? statusMap[st] : null;
  const Icon = style?.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100">
      <div className="w-8 h-8 rounded-full bg-navy-500 text-white flex items-center justify-center font-bold text-sm">
        {(student.full_name ?? student.email)[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 truncate">{student.full_name ?? student.email}</div>
        {record?.checked_in_at && (
          <div className="text-xs text-slate-500">
            {new Date(record.checked_in_at).toLocaleTimeString('sw-TZ')} · {record.method}
          </div>
        )}
      </div>

      {style && Icon && (
        <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${style.c}`}>
          <Icon className="w-3 h-3" /> {style.label}
        </span>
      )}

      {canMark && (
        <div className="flex gap-1">
          <button onClick={() => onMark('present')} title="Mark present" className="p-1.5 rounded hover:bg-green-100 text-green-600"><CheckCircle2 className="w-4 h-4" /></button>
          <button onClick={() => onMark('late')} title="Mark late" className="p-1.5 rounded hover:bg-amber-100 text-amber-600"><Clock className="w-4 h-4" /></button>
          <button onClick={() => onMark('absent')} title="Mark absent" className="p-1.5 rounded hover:bg-red-100 text-red-600"><XCircle className="w-4 h-4" /></button>
          <button onClick={() => onMark('excused')} title="Mark excused" className="p-1.5 rounded hover:bg-navy-100 text-navy-500"><AlertCircle className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
