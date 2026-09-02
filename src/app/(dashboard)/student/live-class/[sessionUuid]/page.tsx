'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, MapPin, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { attendanceApi, LiveJoinResult, RecordStatus } from '@/lib/attendance/api';
import { useAuthStore } from '@/store/auth';

const JitsiRoom = dynamic(() => import('@/components/JitsiRoom'), { ssr: false });

export default function StudentLiveClassPage() {
  const { sessionUuid } = useParams<{ sessionUuid: string }>();
  const user = useAuthStore((s) => s.user);
  const [joined, setJoined] = useState(false);
  const [checkinResult, setCheckinResult] = useState<LiveJoinResult | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['attendance-peek', sessionUuid],
    queryFn: () => attendanceApi.peek(sessionUuid as string),
    retry: false,
  });

  async function handleJoined() {
    setJoined(true);
    try {
      const res = await attendanceApi.liveJoin(sessionUuid as string);
      setCheckinResult(res);
      const emoji = res.status === 'present' ? '✅' : '⏰';
      toast.success(`${emoji} Umerekodiwa kama ${res.status}`);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Check-in imeshindwa';
      setCheckinError(msg);
      toast.error(msg);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center mt-12">
        <p className="text-red-600 font-semibold">Darasa hili halipatikani au hujasajiliwa.</p>
      </div>
    );
  }

  const isOpen = session.status === 'open';
  const displayName = user?.profile?.full_name ?? user?.email ?? 'Student';
  const email = user?.email ?? '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {isOpen && <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full animate-pulse">● LIVE</span>}
          {!isOpen && <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">{session.status}</span>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{session.title}</h1>
        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 flex-wrap">
          {session.course && <span>{session.course.title}</span>}
          {session.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>}
          <span>Ilianza: {new Date(session.starts_at).toLocaleString('sw-TZ')}</span>
        </div>
      </div>

      {/* Check-in status banner */}
      {checkinResult && <CheckInBanner result={checkinResult} />}
      {checkinError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{checkinError}</div>
      )}

      {/* Main content */}
      {!isOpen ? (
        <div className="card p-10 text-center">
          <Video className="w-14 h-14 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">
            {session.status === 'scheduled' ? 'Darasa bado halijafunguliwa na trainer.' : 'Darasa limefungwa tayari.'}
          </p>
        </div>
      ) : (
        <JitsiRoom
          roomName={session.jitsi_room}
          displayName={displayName}
          email={email}
          isHost={false}
          onJoined={handleJoined}
          height="calc(100vh - 260px)"
        />
      )}
    </div>
  );
}

function CheckInBanner({ result }: { result: LiveJoinResult }) {
  const map: Record<RecordStatus, { bg: string; Icon: typeof CheckCircle2; label: string }> = {
    present: { bg: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle2, label: 'Umehudhuria ✅' },
    late: { bg: 'bg-amber-50 border-amber-200 text-amber-800', Icon: Clock, label: 'Umechelewa ⏰' },
    absent: { bg: 'bg-red-50 border-red-200 text-red-800', Icon: Clock, label: 'Absent' },
    excused: { bg: 'bg-navy-50 border-navy-200 text-navy-800', Icon: CheckCircle2, label: 'Excused' },
  };
  const s = map[result.status];
  const Icon = s.Icon;
  return (
    <div className={`mb-4 p-3 rounded-lg border flex items-center gap-3 ${s.bg}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <div>
        <span className="font-bold">{s.label}</span>
        <span className="text-sm ml-2">— Umejoin saa {new Date(result.checked_in_at).toLocaleTimeString('sw-TZ')}</span>
      </div>
    </div>
  );
}
