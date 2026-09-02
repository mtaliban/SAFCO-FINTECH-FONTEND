'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, MapPin, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { attendanceApi, LiveJoinResult, RecordStatus, SessionPeek } from '@/lib/attendance/api';
import { useAuthStore } from '@/store/auth';

const JitsiRoom = dynamic(() => import('@/components/JitsiRoom'), { ssr: false });

export default function StudentLiveClassPage() {
  const { sessionUuid } = useParams<{ sessionUuid: string }>();
  const user = useAuthStore((s) => s.user);
  const [checkinResult, setCheckinResult] = useState<LiveJoinResult | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const { data: session, isLoading, error } = useQuery<SessionPeek>({
    queryKey: ['attendance-peek', sessionUuid],
    queryFn: () => attendanceApi.peek(sessionUuid as string),
    retry: false,
    refetchInterval: 15_000,
  });

  // Detect when trainer closes the session
  useEffect(() => {
    if (session?.status === 'closed') setSessionEnded(true);
  }, [session?.status]);

  async function handleJoined() {
    try {
      const res = await attendanceApi.liveJoin(sessionUuid as string);
      setCheckinResult(res);
      const emoji = res.status === 'present' ? '✅' : '⏰';
      toast.success(`${emoji} Umerekodiwa kama ${res.status}`);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Check-in imeshindwa';
      setCheckinError(msg);
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

  const isOpen = session.status === 'open' && !sessionEnded;
  const isClosed = session.status === 'closed' || sessionEnded;
  const displayName = user?.profile?.full_name ?? user?.email ?? 'Student';
  const email = user?.email ?? '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {isOpen && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full animate-pulse">
              ● LIVE
            </span>
          )}
          {isClosed && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Imefungwa
            </span>
          )}
          {!isOpen && !isClosed && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Imepangwa
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{session.title}</h1>
        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 flex-wrap">
          {session.course && <span>{session.course.title}</span>}
          {session.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{session.location}
            </span>
          )}
          <span>Ilianza: {new Date(session.starts_at).toLocaleString('sw-TZ')}</span>
        </div>
      </div>

      {/* Check-in status banner */}
      {checkinResult && <CheckInBanner result={checkinResult} />}
      {checkinError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {checkinError}
        </div>
      )}

      {/* Session ended by trainer */}
      {isClosed && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-800 mb-2">Darasa Limekwisha</p>
          <p className="text-slate-500 text-sm">Mwalimu amefunga darasa.</p>
          {checkinResult && (
            <p className="mt-4 text-sm font-semibold text-green-700">
              ✅ Attendance yako imerekodiwa kama {checkinResult.status}.
            </p>
          )}
        </div>
      )}

      {/* Not open yet */}
      {!isOpen && !isClosed && (
        <div className="card p-10 text-center">
          <Clock className="w-14 h-14 mx-auto text-amber-300 mb-3" />
          <p className="text-slate-600 font-medium">Darasa bado halijafunguliwa na mwalimu.</p>
          <p className="text-slate-400 text-sm mt-1">Ukurasa unasasishwa kila sekunde 15.</p>
        </div>
      )}

      {/* Live Jitsi */}
      {isOpen && (
        <JitsiRoom
          roomName={session.jitsi_room}
          displayName={displayName}
          email={email}
          isHost={false}
          onJoined={handleJoined}
          onLeft={() => setSessionEnded(true)}
          height="calc(100vh - 260px)"
        />
      )}
    </div>
  );
}

function CheckInBanner({ result }: { result: LiveJoinResult }) {
  const map: Record<RecordStatus, { bg: string; Icon: typeof CheckCircle2; label: string }> = {
    present: { bg: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle2, label: 'Umehudhuria ✅' },
    late:    { bg: 'bg-amber-50 border-amber-200 text-amber-800', Icon: Clock,        label: 'Umechelewa ⏰' },
    absent:  { bg: 'bg-red-50 border-red-200 text-red-800',       Icon: Clock,        label: 'Absent' },
    excused: { bg: 'bg-blue-50 border-blue-200 text-blue-800',    Icon: CheckCircle2, label: 'Excused' },
  };
  const s = map[result.status];
  const Icon = s.Icon;
  return (
    <div className={`mb-4 p-3 rounded-lg border flex items-center gap-3 ${s.bg}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <div>
        <span className="font-bold">{s.label}</span>
        <span className="text-sm ml-2">
          — Umejoin saa {new Date(result.checked_in_at).toLocaleTimeString('sw-TZ')}
        </span>
      </div>
    </div>
  );
}
