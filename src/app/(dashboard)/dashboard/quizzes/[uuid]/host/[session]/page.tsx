'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play, SkipForward, Users, Trophy, Copy, CheckCircle2,
  Zap, Clock, Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionApi, playApi, type LeaderboardEntry, type LiveEndQuestionPayload, type LiveParticipant } from '@/lib/quiz/api';
import { useLiveSession } from '@/lib/quiz/useLiveSession';

type SessionStatus = 'waiting' | 'starting' | 'question_active' | 'question_ended' | 'showing_leaderboard' | 'completed' | 'cancelled';

interface QuestionStartedPayload {
  session_pin: string;
  question_id: string;
  index: number;
  total: number;
  time_limit_seconds: number;
  ends_at: string;
  question: {
    id: string; text: string; type: string;
    options?: Array<{ id: string; label: string; color?: string; shape?: string }>;
    image_url?: string | null;
  };
}

interface SessionState {
  pin: string;
  quiz_name: string;
  status: SessionStatus;
  participant_count: number;
  total_questions: number;
  current_question_index: number;
  current_question_ends_at: string | null;
}

export default function HostSessionPageWrapper() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <HostSessionPage />
    </Suspense>
  );
}

function HostSessionPage() {
  const { session: sessionUuid } = useParams<{ session: string }>();
  const params = useSearchParams();
  const pin = params.get('pin') ?? '';
  const qc = useQueryClient();

  // Poll session state as fallback (MQTT drives most updates but this is authoritative)
  const { data: state } = useQuery<SessionState | null>({
    queryKey: ['host-session', pin],
    queryFn: () => playApi.sessionState(pin) as Promise<SessionState | null>,
    refetchInterval: 3000,
    enabled: !!pin,
  });

  const status: SessionStatus = state?.status ?? 'waiting';
  const currentIndex = state?.current_question_index ?? 0;
  const totalQuestions = state?.total_questions ?? 0;
  const participantCount = state?.participant_count ?? 0;
  const questionEndsAt = state?.current_question_ends_at ?? null;

  const [activeQuestion, setActiveQuestion] = useState<QuestionStartedPayload | null>(null);
  const [lastReveal, setLastReveal] = useState<LiveEndQuestionPayload | null>(null);

  // Auto-advance refs/state
  const endingRef = useRef(false);
  const [nextIn, setNextIn] = useState<number | null>(null);

  // Real-time leaderboard, refetched on question_ended
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', sessionUuid],
    queryFn: () => sessionApi.leaderboard(sessionUuid as string, 100),
    refetchInterval: status === 'question_active' ? false : 3000,
    enabled: !!sessionUuid,
  });

  // Full participants list (with late-join flag)
  const { data: participantsData } = useQuery({
    queryKey: ['participants', sessionUuid, participantCount],
    queryFn: () => sessionApi.participants(sessionUuid as string),
    enabled: !!sessionUuid && status !== 'completed',
  });

  // Live "X answered of Y" ticker during a question
  const { data: answerCount } = useQuery({
    queryKey: ['answer-count', sessionUuid, currentIndex],
    queryFn: () => sessionApi.answerCount(sessionUuid as string),
    refetchInterval: status === 'question_active' ? 800 : false,
    enabled: !!sessionUuid,
  });

  // ------- MQTT subscriptions -------
  const eventHandler = useCallback((event: string, payload: unknown) => {
    switch (event) {
      case 'question_started': {
        const p = (payload as { payload?: QuestionStartedPayload }).payload ?? (payload as QuestionStartedPayload);
        setActiveQuestion(p);
        setLastReveal(null);
        qc.invalidateQueries({ queryKey: ['host-session', pin] });
        break;
      }
      case 'question_ended': {
        const p = (payload as { payload?: LiveEndQuestionPayload }).payload ?? (payload as LiveEndQuestionPayload);
        setLastReveal(p);
        qc.invalidateQueries({ queryKey: ['leaderboard', sessionUuid] });
        qc.invalidateQueries({ queryKey: ['host-session', pin] });
        break;
      }
      case 'participant_joined':
      case 'leaderboard': {
        qc.invalidateQueries({ queryKey: ['participants', sessionUuid] });
        qc.invalidateQueries({ queryKey: ['leaderboard', sessionUuid] });
        qc.invalidateQueries({ queryKey: ['host-session', pin] });
        break;
      }
      case 'completed': {
        qc.invalidateQueries({ queryKey: ['leaderboard', sessionUuid] });
        qc.invalidateQueries({ queryKey: ['host-session', pin] });
        toast.success('Session completed!');
        break;
      }
    }
  }, [qc, pin, sessionUuid]);

  useLiveSession(pin, ['question_started', 'question_ended', 'participant_joined', 'leaderboard', 'completed'], eventHandler);

  // Auto-reveal: when question timer expires, call endQuestion automatically
  useEffect(() => {
    if (status !== 'question_active' || !questionEndsAt) return;
    endingRef.current = false;
    const delay = new Date(questionEndsAt).getTime() - Date.now() + 1500;
    const t = setTimeout(() => {
      if (!endingRef.current) { endingRef.current = true; endQuestion(); }
    }, Math.max(delay, 0));
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, questionEndsAt]);

  // Auto-reveal immediately when ALL participants have answered — no waiting for timer
  useEffect(() => {
    if (status !== 'question_active') return;
    if (!answerCount || participantCount <= 0) return;
    if (answerCount.answered >= participantCount) {
      if (!endingRef.current) { endingRef.current = true; endQuestion(); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, answerCount, participantCount]);

  // Auto-next: 3-second countdown after answer revealed, then start next question or complete
  useEffect(() => {
    if (status !== 'question_ended') { setNextIn(null); return; }
    let s = 3;
    setNextIn(s);
    const t = setInterval(() => {
      s -= 1;
      setNextIn(s);
      if (s <= 0) {
        clearInterval(t);
        if (isLast) complete();
        else startQuestion();
      }
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Controls
  async function startQuestion() {
    try { await sessionApi.startQuestion(sessionUuid as string); }
    catch (e) { toast.error(errMsg(e, 'Failed to start question')); }
  }
  async function endQuestion() {
    try {
      const res = await sessionApi.endQuestion(sessionUuid as string);
      setLastReveal(res);
    } catch (e) { toast.error(errMsg(e, 'Failed to end question')); }
  }
  async function complete() {
    try { await sessionApi.complete(sessionUuid as string); }
    catch (e) { toast.error(errMsg(e, 'Failed to complete session')); }
  }
  function copyPin() {
    navigator.clipboard.writeText(pin);
    toast.success('PIN copied');
  }

  const isLast = currentIndex + 1 >= totalQuestions;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 text-slate-900">
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header — PIN + participant count + status */}
      <HostHeader
        pin={pin}
        onCopy={copyPin}
        participantCount={participantCount}
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        status={status}
      />

      {/* Controls bar */}
      <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3 border border-slate-200 shadow-sm">
        {status === 'waiting' && (
          <button onClick={startQuestion} className="btn-primary text-base px-6 py-3">
            <Play className="w-5 h-5" /> Anzisha Quiz
          </button>
        )}
        {status === 'question_active' && (
          <>
            <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
              Jibu litaonyeshwa moja kwa moja muda ukiisha…
            </div>
            <button
              onClick={() => { if (!endingRef.current) { endingRef.current = true; endQuestion(); } }}
              className="btn-secondary text-sm px-4 py-2 ml-auto"
            >
              <SkipForward className="w-4 h-4" /> Onyesha Jibu Sasa
            </button>
          </>
        )}
        {(status === 'question_ended' || status === 'showing_leaderboard') && (
          <>
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-black text-lg animate-pulse">
                {nextIn ?? 0}
              </span>
              {isLast ? 'Matokeo ya mwisho yataonyeshwa…' : 'Swali linalofuata linaanza…'}
            </div>
            <button
              onClick={() => { setNextIn(null); if (isLast) complete(); else startQuestion(); }}
              className="btn-secondary text-sm px-4 py-2 ml-auto"
            >
              <SkipForward className="w-4 h-4" /> {isLast ? 'Malizia Sasa' : 'Swali Linalofuata Sasa'}
            </button>
          </>
        )}
        {status === 'completed' && (
          <div className="text-sm text-slate-500 font-medium">Mchezo umekwisha — angalia matokeo hapa chini.</div>
        )}
      </div>

      {/* Main content — changes with status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {status === 'waiting' && (
            <ParticipantLobby
              participants={participantsData?.participants ?? []}
              count={participantCount}
            />
          )}

          {status === 'question_active' && activeQuestion && (
            <ActiveQuestionView
              question={activeQuestion}
              endsAt={questionEndsAt ?? activeQuestion.ends_at}
              answered={answerCount?.answered ?? 0}
              total={participantCount}
            />
          )}

          {(status === 'question_ended' || status === 'showing_leaderboard') && lastReveal && (
            <QuestionReveal reveal={lastReveal} total={participantCount} />
          )}

          {status === 'completed' && <FinalPodium leaderboard={leaderboard} />}
        </div>

        {/* Sidebar — always shows current leaderboard */}
        <div>
          <LeaderboardPanel leaderboard={leaderboard} highlight={status !== 'completed'} />
        </div>
      </div>
    </div>
    </div>
  );
}

/* ============================================================ *
 * Sub-components
 * ============================================================ */

function HostHeader({
  pin, onCopy, participantCount, currentIndex, totalQuestions, status,
}: {
  pin: string; onCopy: () => void; participantCount: number;
  currentIndex: number; totalQuestions: number; status: SessionStatus;
}) {
  const showQuestionCounter = status !== 'waiting' && status !== 'completed';
  return (
    <div className="bg-gradient-to-br from-navy-700 to-navy-900 text-white rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 relative overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-center">
        <div className="col-span-2 md:col-span-1 text-center md:text-left">
          <div className="text-xs uppercase tracking-widest opacity-70 mb-1">Game PIN</div>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="text-4xl md:text-6xl font-black tracking-widest font-mono">{pin}</div>
            <button onClick={onCopy} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Copy PIN">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm opacity-80 mt-1">Join at /play</div>
        </div>

        <div className="text-center">
          <Users className="w-5 h-5 md:w-6 md:h-6 mx-auto opacity-70 mb-1" />
          <div className="text-3xl md:text-4xl font-black">{participantCount}</div>
          <div className="text-xs uppercase tracking-widest opacity-70 mt-0.5">Players</div>
        </div>

        <div className="text-center md:text-right">
          {showQuestionCounter && (
            <>
              <div className="text-xs uppercase tracking-widest opacity-70 mb-1">Question</div>
              <div className="text-3xl md:text-4xl font-black">{currentIndex + 1} <span className="text-xl md:text-2xl opacity-60">/ {totalQuestions}</span></div>
            </>
          )}
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { bg: string; label: string }> = {
    waiting: { bg: 'bg-amber-500', label: 'Waiting for players' },
    starting: { bg: 'bg-amber-500', label: 'Starting' },
    question_active: { bg: 'bg-green-500', label: 'Question Active' },
    question_ended: { bg: 'bg-navy-500', label: 'Answer Revealed' },
    showing_leaderboard: { bg: 'bg-navy-500', label: 'Leaderboard' },
    completed: { bg: 'bg-navy-500', label: 'Completed' },
    cancelled: { bg: 'bg-red-500', label: 'Cancelled' },
  };
  const m = map[status];
  return (
    <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider" style={{}}>
      <span className={`px-3 py-1 rounded-full ${m.bg}`}>{m.label}</span>
    </div>
  );
}

function ParticipantLobby({ participants, count }: { participants: LiveParticipant[]; count: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
          <Users className="w-5 h-5 text-orange-500" /> Waiting Room
        </h3>
        <span className="text-sm text-slate-400">{count} joined</span>
      </div>
      {participants.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-6xl mb-3 animate-bounce">👀</div>
          <p className="text-slate-400">Share the PIN — waiting for players to join…</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="px-3 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-sm flex items-center gap-1.5 animate-fade-in"
              title={p.joined_at ? new Date(p.joined_at).toLocaleTimeString() : ''}
            >
              {p.nickname}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveQuestionView({
  question, endsAt, answered, total,
}: {
  question: QuestionStartedPayload; endsAt: string | null;
  answered: number; total: number;
}) {
  const q = question.question;
  const opts = q.options ?? [];
  const remaining = useCountdown(endsAt);
  const timeUp = remaining <= 0;
  const answerPct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Swali {question.index + 1} / {question.total}
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-black text-2xl ${
          timeUp ? 'bg-red-500 text-white' : remaining <= 5 ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-green-500 text-white'
        }`}>
          <Clock className="w-5 h-5" />
          {timeUp ? "TIME'S UP" : `${remaining}s`}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5">
        <h2 className="text-2xl font-bold text-slate-900 text-center">{q.text}</h2>
      </div>

      {opts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {opts.slice(0, 4).map((o, i) => (
            <div
              key={o.id ?? i}
              className="p-4 rounded-xl text-white font-bold text-center flex items-center justify-center gap-2"
              style={{ backgroundColor: o.color ?? DEFAULT_COLORS[i] ?? '#334155' }}
            >
              <span className="text-2xl">{DEFAULT_SHAPES[i] ?? '●'}</span>
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live "answered" ticker */}
      <div>
        <div className="flex items-center justify-between text-sm mb-2 text-slate-600">
          <span className="font-semibold flex items-center gap-1">
            <Zap className="w-4 h-4 text-orange-500" />
            {answered} / {total} wamejibu
          </span>
          <span className="font-bold text-slate-900">{answerPct}%</span>
        </div>
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-orange-400 transition-all duration-300 rounded-full" style={{ width: `${answerPct}%` }} />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#8b5cf6', '#0ea5e9'];
const DEFAULT_SHAPES = ['▲', '◆', '●', '■', '★', '✚'];

function useCountdown(endsAt: string | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return 0;
  const end = new Date(endsAt).getTime();
  return Math.max(0, Math.ceil((end - now) / 1000));
}

function QuestionReveal({ reveal, total }: { reveal: LiveEndQuestionPayload; total: number }) {
  const q = reveal.question;
  const stats = reveal.stats;
  const opts = (q.options ?? []) as Array<{ id: string; label: string; color?: string | null }>;
  const dist = stats.distribution || {};
  const maxCount = Math.max(1, ...Object.values(dist));
  const correctIds = normaliseCorrect(reveal.correct_answer);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Jibu limeonyeshwa
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5">
        <h2 className="text-xl font-bold text-slate-900 text-center">{q.text}</h2>
      </div>

      {/* Big stats banner */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
        <StatCard label="Walijibu" value={stats.total_answers} total={total} />
        <StatCard label="Sahihi" value={stats.correct_count} accent="green" />
        <StatCard label="Asilimia" value={`${stats.correct_rate_percent}%`} accent={stats.correct_rate_percent >= 50 ? 'green' : 'red'} />
      </div>

      {/* Bar chart per option */}
      {opts.length > 0 ? (
        <div className="space-y-2">
          {opts.map((o, i) => {
            const count = dist[o.id] ?? 0;
            const pct = Math.round((count / maxCount) * 100);
            const totalPct = stats.total_answers > 0 ? Math.round((count / stats.total_answers) * 100) : 0;
            const isCorrect = correctIds.includes(String(o.id));
            return (
              <div key={o.id} className={`p-3 rounded-xl border-2 ${
                isCorrect ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl" style={{ color: o.color ?? DEFAULT_COLORS[i] }}>
                    {DEFAULT_SHAPES[i] ?? '●'}
                  </span>
                  <span className={`flex-1 font-semibold ${isCorrect ? 'text-green-700' : 'text-slate-700'}`}>
                    {o.label}
                  </span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  <span className="text-sm font-mono text-slate-400">{count} ({totalPct}%)</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${isCorrect ? 'bg-green-400' : 'bg-slate-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-green-50 border-2 border-green-400">
          <div className="text-xs font-semibold text-green-700 mb-1 uppercase">Jibu Sahihi</div>
          <div className="text-lg font-bold text-green-800">{JSON.stringify(reveal.correct_answer)}</div>
        </div>
      )}

      {q.explanation && (
        <div className="mt-4 p-3 bg-navy-50/30 border-l-4 border-blue-400 rounded-r-xl">
          <div className="text-xs font-semibold text-navy-500 mb-1">Maelezo</div>
          <div className="text-sm text-navy-500">{q.explanation}</div>
        </div>
      )}
    </div>
  );
}

function normaliseCorrect(v: unknown): string[] {
  if (Array.isArray(v)) return (v as unknown[]).map(String);
  if (v === null || v === undefined) return [];
  return [String(v)];
}

function StatCard({ label, value, total, accent }: { label: string; value: number | string; total?: number; accent?: 'green' | 'red' }) {
  const cls = accent === 'green' ? 'bg-green-50 text-green-700 border border-green-300'
    : accent === 'red' ? 'bg-red-50 text-red-700 border border-red-300'
    : 'bg-slate-100 text-slate-700 border border-slate-200';
  return (
    <div className={`rounded-xl p-3 text-center ${cls}`}>
      <div className="text-2xl sm:text-3xl font-black">{value}{total !== undefined && <span className="text-lg opacity-50"> / {total}</span>}</div>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mt-1">{label}</div>
    </div>
  );
}

function LeaderboardPanel({ leaderboard, highlight }: { leaderboard: LeaderboardEntry[]; highlight: boolean }) {
  const top = useMemo(() => leaderboard.slice(0, 10), [leaderboard]);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-4 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard
      </h3>
      {top.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-400">Subiri jibu la kwanza…</div>
      ) : (
        <div className="space-y-1.5">
          {top.map((e) => (
            <div
              key={e.participant_id}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-sm ${
                highlight && e.rank <= 3 ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'
              }`}
            >
              <div className="w-7 text-center font-black">
                {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : <span className="text-slate-400">{e.rank}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                  {e.nickname}
                  {e.is_late_join && <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-700 uppercase font-bold">Late</span>}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span><CheckCircle2 className="w-2.5 h-2.5 inline text-green-500" /> {e.correct_answers}</span>
                  {typeof e.current_streak === 'number' && e.current_streak >= 2 && (
                    <span className="text-orange-500 font-bold"><Flame className="w-2.5 h-2.5 inline" /> {e.current_streak}</span>
                  )}
                </div>
              </div>
              <div className="text-lg font-black text-orange-500 font-mono">{e.total_score.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinalPodium({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const [first, second, third] = leaderboard;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Matokeo ya Mwisho</div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">🏆 SAFCO Live — Mabingwa</div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 items-end max-w-2xl mx-auto">
        <PodiumStep entry={second} rank={2} height="h-32" bg="bg-slate-400" emoji="🥈" />
        <PodiumStep entry={first} rank={1} height="h-40" bg="bg-yellow-400" emoji="🥇" />
        <PodiumStep entry={third} rank={3} height="h-24" bg="bg-orange-400" emoji="🥉" />
      </div>

      {leaderboard.length > 3 && (
        <div className="text-left max-w-md mx-auto space-y-1.5 mt-6">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Orodha Kamili</div>
          {leaderboard.slice(3, 20).map((e) => (
            <div key={e.participant_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
              <div className="w-6 text-slate-400 font-bold text-sm">{e.rank}</div>
              <div className="flex-1 truncate font-medium text-slate-900">{e.nickname}</div>
              <div className="text-orange-500 font-black font-mono">{e.total_score.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PodiumStep({ entry, rank, height, bg, emoji }: { entry?: LeaderboardEntry; rank: number; height: string; bg: string; emoji: string }) {
  if (!entry) {
    return <div className={`${height} ${bg} opacity-30 rounded-t-xl flex items-center justify-center text-white font-black text-2xl`}>—</div>;
  }
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl mb-1">{emoji}</div>
      <div className="font-bold text-white mb-0.5 truncate max-w-full px-1 text-sm">{entry.nickname}</div>
      <div className="text-yellow-300 font-black font-mono mb-2 text-sm">{entry.total_score.toLocaleString()}</div>
      <div className={`${bg} ${height} w-full rounded-t-xl flex items-center justify-center text-4xl font-black text-white shadow-lg`}>{rank}</div>
    </div>
  );
}

function errMsg(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}
