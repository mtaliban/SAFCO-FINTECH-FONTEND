'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, Trophy, Zap, Flame, Clock } from 'lucide-react';
import { playApi, type LeaderboardEntry } from '@/lib/quiz/api';
import { useLiveSession } from '@/lib/quiz/useLiveSession';

/**
 * Student play page — MQTT-driven with polling as fallback.
 * Screens: waiting-room → active question → per-question result → final podium.
 */

interface Participant { id: string; nickname: string; pin: string }
interface CurrentQuestion {
  question_id: string;
  question_number: number;
  total_questions: number;
  type: string;
  text: string;
  image_url: string | null;
  options: Array<{ id: string; label: string; color?: string; shape?: string }>;
  time_limit_seconds: number;
  ends_at: string | null;
}
interface AnswerResult {
  is_correct: boolean; points_earned: number;
  total_score: number; current_streak: number;
  speed_bonus: number; streak_bonus: number;
}
interface SessionState {
  pin: string;
  quiz_name: string;
  status: string;
  participant_count: number;
  total_questions: number;
  current_question_index: number;
  current_question_ends_at: string | null;
  final_leaderboard?: LeaderboardEntry[] | null;
}

const DEFAULT_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#8b5cf6', '#0ea5e9'];
const DEFAULT_SHAPES = ['▲', '◆', '●', '■', '★', '✚'];

export default function PlaySessionPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const answeredForRef = useRef<string | null>(null);

  // 1) Load participant from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('safco_participant');
    if (!raw) { router.replace('/play'); return; }
    const p = JSON.parse(raw) as Participant;
    if (p.pin !== pin) { router.replace('/play'); return; }
    setParticipant(p);
  }, [pin, router]);

  // 2) Session state — polled every 3s as fallback; MQTT invalidates on events
  const { data: state, refetch: refetchState } = useQuery<SessionState | null>({
    queryKey: ['play-session', pin],
    queryFn: async () => {
      const s = await playApi.sessionState(pin as string);
      return s as SessionState;
    },
    refetchInterval: 3000,
    enabled: !!participant,
  });

  const status = state?.status ?? 'connecting';

  // 3) When question_active → fetch current question payload
  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/play/session/${pin}/current-question`);
      if (!res.ok) return;
      const json = await res.json();
      const q: CurrentQuestion | null = json.data;
      if (!q) return;
      setCurrentQuestion(q);
      if (answeredForRef.current !== q.question_id) {
        setSelectedOption(null);
        setLastResult(null);
        answeredForRef.current = q.question_id;
      }
    } catch { /* ignore */ }
  }, [pin]);

  useEffect(() => {
    if (status === 'question_active' && !currentQuestion) fetchCurrentQuestion();
    if (status !== 'question_active' && status !== 'question_ended') setCurrentQuestion(null);
  }, [status, currentQuestion, fetchCurrentQuestion]);

  // 4) MQTT — event-driven transitions (fires ~50ms after server, not 3s)
  useLiveSession(
    pin,
    ['question_started', 'question_ended', 'completed'],
    useCallback((event: string) => {
      if (event === 'question_started') {
        answeredForRef.current = null;
        setSelectedOption(null);
        setLastResult(null);
        fetchCurrentQuestion();
        refetchState();
      } else if (event === 'question_ended' || event === 'completed') {
        refetchState();
      }
    }, [fetchCurrentQuestion, refetchState]),
  );

  async function submit(optionId: string) {
    if (!participant || selectedOption || busy) return;
    setSelectedOption(optionId);
    setBusy(true);
    try {
      const res = await playApi.submitAnswer(pin as string, participant.id, optionId);
      setLastResult(res as AnswerResult);
    } catch {
      setSelectedOption(null);
    } finally {
      setBusy(false);
    }
  }

  if (!participant) return null;

  /* --------- Screens --------- */

  if (status === 'connecting' || (!state && !currentQuestion)) {
    return <FullScreen bg="bg-navy-900"><Loader2 className="w-10 h-10 animate-spin text-white" /></FullScreen>;
  }

  if (status === 'waiting' || status === 'starting') {
    return <LobbyScreen participant={participant} pin={String(pin)} count={state?.participant_count ?? 0} />;
  }

  if (status === 'question_active' && currentQuestion) {
    return (
      <QuestionScreen
        participant={participant}
        question={currentQuestion}
        selectedOption={selectedOption}
        busy={busy}
        onSelect={submit}
      />
    );
  }

  if (status === 'question_ended') {
    if (lastResult) {
      return <ResultScreen result={lastResult} participant={participant} />;
    }
    return <NoAnswerScreen participant={participant} />;
  }

  if (status === 'completed') {
    return <CompletedScreen
      participant={participant}
      finalScore={lastResult?.total_score ?? null}
      finalLeaderboard={state?.final_leaderboard ?? []}
    />;
  }

  return <FullScreen bg="bg-slate-900"><span className="text-white">Status: {status}</span></FullScreen>;
}

/* ============================================================ *
 * Screen components
 * ============================================================ */

function FullScreen({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <main className={`min-h-screen ${bg} flex items-center justify-center p-6`}>{children}</main>;
}

function LobbyScreen({ participant, pin, count }: { participant: Participant; pin: string; count: number }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-700 to-navy-950 flex flex-col items-center justify-center text-white p-6">
      <div className="text-center animate-fade-in">
        <div className="text-8xl mb-6 animate-bounce">🎯</div>
        <h1 className="text-3xl font-black mb-1">Karibu, {participant.nickname}!</h1>
        <p className="text-white/70 mb-8">Subiri mwalimu aanze quiz…</p>
        <div className="inline-block bg-white/10 px-6 py-3 rounded-2xl">
          <div className="text-xs uppercase tracking-widest text-white/60">Game PIN</div>
          <div className="text-5xl font-mono font-black tracking-widest text-orange-300">{pin}</div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70">
          <span className="animate-pulse text-green-400">●</span>
          {count} washindani waliojiunga
        </div>
      </div>
    </main>
  );
}

function useCountdown(endsAt: string | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
}

function QuestionScreen({
  participant, question, selectedOption, busy, onSelect,
}: {
  participant: Participant;
  question: CurrentQuestion;
  selectedOption: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
}) {
  const remaining = useCountdown(question.ends_at);
  const timeUp = remaining <= 0;
  const answered = !!selectedOption;

  return (
    <main className="min-h-screen bg-navy-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="p-3 flex justify-between items-center border-b border-white/10">
        <div className="text-xs text-white/70">
          Swali <span className="font-bold text-white">{question.question_number}</span> / {question.total_questions}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-black text-xl ${
          timeUp ? 'bg-red-500' : remaining <= 5 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
        }`}>
          <Clock className="w-4 h-4" />
          {timeUp ? '0s' : `${remaining}s`}
        </div>
        <div className="text-xs text-white/70">👤 {participant.nickname}</div>
      </div>

      {/* Question */}
      <div className="p-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">{question.text}</h2>
      </div>

      {/* Options grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 p-4 pb-6">
        {question.options?.map((opt, i) => {
          const bg = opt.color ?? DEFAULT_COLORS[i] ?? '#334155';
          const shape = shapeChar(opt.shape) ?? DEFAULT_SHAPES[i] ?? '●';
          const isSel = selectedOption === opt.id;
          const dim = answered && !isSel;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              disabled={answered || busy || timeUp}
              className={`rounded-2xl p-6 md:p-8 text-white font-bold text-xl flex items-center justify-center gap-3 transition transform ${
                dim ? 'opacity-30 scale-95' : 'active:scale-95 hover:brightness-110'
              } ${isSel ? 'ring-4 ring-white scale-105' : ''} ${timeUp && !answered ? 'opacity-50' : ''}`}
              style={{ backgroundColor: bg }}
            >
              <span className="text-4xl">{shape}</span>
              <span className="text-left">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="p-3 text-center text-white/80 text-sm animate-fade-in border-t border-white/10">
          ✓ Jibu limetumwa · subiri washindani wengine…
        </div>
      )}
      {timeUp && !answered && (
        <div className="p-3 text-center text-red-300 text-sm animate-fade-in border-t border-white/10">
          Muda umeisha!
        </div>
      )}
    </main>
  );
}

function shapeChar(shape?: string): string | null {
  const map: Record<string, string> = { triangle: '▲', diamond: '◆', circle: '●', square: '■', star: '★', plus: '✚' };
  return shape ? map[shape] ?? null : null;
}

function ResultScreen({ result, participant }: { result: AnswerResult; participant: Participant }) {
  const bg = result.is_correct
    ? 'bg-gradient-to-br from-green-500 to-green-800'
    : 'bg-gradient-to-br from-red-500 to-red-800';

  return (
    <main className={`min-h-screen ${bg} flex flex-col items-center justify-center text-white p-8`}>
      <div className="text-center animate-fade-in">
        {result.is_correct ? (
          <>
            <CheckCircle2 className="w-28 h-28 mx-auto mb-4 animate-bounce" strokeWidth={2.5} />
            <h1 className="text-5xl font-black mb-2">Sahihi!</h1>
            <div className="text-7xl font-black text-yellow-300 mb-3 font-mono">+{result.points_earned.toLocaleString()}</div>
            {result.speed_bonus > 0 && (
              <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm mr-2">
                <Zap className="w-4 h-4" /> Speed +{result.speed_bonus}
              </div>
            )}
            {result.streak_bonus > 0 && (
              <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm">
                <Flame className="w-4 h-4" /> Streak +{result.streak_bonus}
              </div>
            )}
          </>
        ) : (
          <>
            <XCircle className="w-28 h-28 mx-auto mb-4" strokeWidth={2.5} />
            <h1 className="text-5xl font-black mb-2">Sio Sahihi</h1>
            <div className="text-4xl mb-3">😬</div>
          </>
        )}

        <div className="mt-6 inline-block bg-white/10 px-6 py-3 rounded-2xl">
          <div className="text-xs uppercase tracking-widest opacity-80">Alama Zako</div>
          <div className="text-3xl font-black font-mono">{result.total_score.toLocaleString()}</div>
        </div>

        {result.current_streak >= 2 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-orange-500/30 rounded-full px-4 py-2 text-lg font-bold">
            <Flame className="w-5 h-5 text-orange-300" />
            {result.current_streak} in a row!
          </div>
        )}

        <div className="mt-8 text-sm text-white/70">👤 {participant.nickname}</div>
      </div>
    </main>
  );
}

function NoAnswerScreen({ participant }: { participant: Participant }) {
  return (
    <main className="min-h-screen bg-slate-800 text-white flex flex-col items-center justify-center p-8">
      <div className="text-6xl mb-4">⌛</div>
      <h1 className="text-2xl font-bold mb-2">Swali limemalizika</h1>
      <p className="text-white/70">Hukujibu kwa wakati. Subiri swali linalofuata…</p>
      <div className="mt-6 text-sm text-white/50">👤 {participant.nickname}</div>
    </main>
  );
}

function CompletedScreen({
  participant, finalScore, finalLeaderboard,
}: {
  participant: Participant;
  finalScore: number | null;
  finalLeaderboard: LeaderboardEntry[];
}) {
  const router = useRouter();
  const myRow = useMemo(
    () => finalLeaderboard.find((e) => e.nickname === participant.nickname),
    [finalLeaderboard, participant.nickname],
  );
  const rank = myRow?.rank;
  const displayScore = myRow?.total_score ?? finalScore ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-950 text-white flex flex-col items-center p-6 py-10">
      <div className="text-center animate-fade-in max-w-2xl w-full">
        <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-300" />
        <h1 className="text-4xl font-black mb-2">Quiz Imekamilika!</h1>

        {rank && (
          <div className="text-3xl mb-3">
            {rank === 1 ? '🥇 Umeshinda!' : rank === 2 ? '🥈 Nafasi ya pili!' : rank === 3 ? '🥉 Nafasi ya tatu!' : `Nafasi ya ${rank}`}
          </div>
        )}

        <div className="bg-white/10 rounded-2xl p-6 mb-8 inline-block">
          <div className="text-xs uppercase tracking-widest text-white/60 mb-1">Alama Zako</div>
          <div className="text-6xl font-black text-yellow-300 font-mono">{displayScore.toLocaleString()}</div>
          {myRow && (
            <div className="mt-3 text-sm text-white/80 flex items-center justify-center gap-3">
              <span>{myRow.correct_answers} sahihi</span>
              {myRow.longest_streak > 0 && (
                <span className="text-orange-300 font-bold flex items-center gap-1">
                  <Flame className="w-4 h-4" /> streak {myRow.longest_streak}
                </span>
              )}
            </div>
          )}
        </div>

        {finalLeaderboard.length > 0 && (
          <div className="text-left bg-white/5 rounded-2xl p-4 mb-6">
            <div className="text-xs uppercase tracking-widest text-white/60 mb-3 text-center">Podium</div>
            <div className="space-y-1.5">
              {finalLeaderboard.slice(0, 10).map((e) => {
                const isMe = e.nickname === participant.nickname;
                return (
                  <div key={e.participant_id}
                    className={`flex items-center gap-3 p-2 rounded ${isMe ? 'bg-orange-500/30 ring-2 ring-orange-400' : 'bg-white/5'}`}>
                    <div className="w-8 text-center font-black">
                      {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank}
                    </div>
                    <div className="flex-1 font-semibold truncate">{e.nickname}{isMe && ' (you)'}</div>
                    <div className="font-mono font-black text-yellow-300">{e.total_score.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={() => router.push('/play')} className="btn-primary text-lg px-8 py-3">
          Cheza Tena
        </button>
      </div>
    </main>
  );
}
