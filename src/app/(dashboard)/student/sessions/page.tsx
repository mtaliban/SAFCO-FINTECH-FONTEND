'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Loader2, MapPin, Video } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { SessionPeek } from '@/lib/attendance/api';

function fetchStudentSessions(): Promise<SessionPeek[]> {
  return apiRequest.get<SessionPeek[]>('/student/live-sessions');
}

export default function StudentSessionsPage() {
  const router = useRouter();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['student-live-sessions'],
    queryFn: fetchStudentSessions,
    refetchInterval: 30_000, // refresh every 30s to catch newly opened sessions
  });

  const live = sessions.filter((s) => s.status === 'open');
  const upcoming = sessions.filter((s) => s.status === 'scheduled');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Madarasa</h1>
      <p className="text-slate-500 mb-6">Madarasa yanayoendelea na yanayokuja.</p>

      {/* Live now */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Yanayoendelea Sasa
          </h2>
          <div className="space-y-3">
            {live.map((s) => (
              <SessionCard key={s.uuid} session={s} onJoin={() => router.push(`/student/live-class/${s.uuid}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Yanayokuja (masaa 48)
          </h2>
          <div className="space-y-3">
            {upcoming.map((s) => (
              <SessionCard key={s.uuid} session={s} onJoin={() => router.push(`/student/live-class/${s.uuid}`)} />
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <div className="card p-12 text-center">
          <Video className="w-14 h-14 mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Hakuna madarasa ya live kwa sasa.</p>
          <p className="text-slate-400 text-sm mt-1">Trainer akipanga darasa utaona hapa.</p>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onJoin }: { session: SessionPeek; onJoin: () => void }) {
  const isLive = session.status === 'open';
  const startsAt = new Date(session.starts_at);
  const isToday = startsAt.toDateString() === new Date().toDateString();
  const isTomorrow = startsAt.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const dateLabel = isLive
    ? 'Sasa Hivi'
    : isToday
      ? `Leo — ${startsAt.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}`
      : isTomorrow
        ? `Kesho — ${startsAt.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}`
        : startsAt.toLocaleString('sw-TZ', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`card p-4 sm:p-5 flex items-center gap-4 ${isLive ? 'border-green-300 ring-1 ring-green-200' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isLive ? 'bg-green-100' : 'bg-slate-100'}`}>
        {isLive
          ? <Video className="w-6 h-6 text-green-600" />
          : <Clock className="w-6 h-6 text-slate-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900 truncate">{session.title}</div>
        <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap mt-0.5">
          <span>{dateLabel}</span>
          {session.course && <span>· {session.course.title}</span>}
          {session.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>}
        </div>
      </div>

      {isLive ? (
        <button onClick={onJoin} className="btn-primary shrink-0 text-sm">
          <Video className="w-4 h-4" /> Ingia
        </button>
      ) : (
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full shrink-0">
          Imepangwa
        </span>
      )}
    </div>
  );
}
