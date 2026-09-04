'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, Trophy, Zap, Flame, LogOut } from 'lucide-react';
import { playApi, type LeaderboardEntry } from '@/lib/quiz/api';
import { useLiveSession } from '@/lib/quiz/useLiveSession';

interface Participant { id: string; nickname: string; pin: string }
interface CurrentQuestion {
  question_id: string; question_number: number; total_questions: number;
  type: string; text: string; image_url: string | null;
  options: Array<{ id: string; label: string; color?: string; shape?: string }>;
  time_limit_seconds: number; ends_at: string | null;
}
interface AnswerResult {
  is_correct: boolean; points_earned: number; total_score: number;
  current_streak: number; speed_bonus: number; streak_bonus: number;
  correct_answer?: unknown;
}
interface SessionState {
  pin: string; quiz_name: string; status: string;
  participant_count: number; total_questions: number;
  current_question_index: number; current_question_ends_at: string | null;
  realtime_topic?: string;
  final_leaderboard?: LeaderboardEntry[] | null;
}

const COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
const SHAPES = ['▲', '◆', '●', '■'];

export default function PlaySessionPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  // correct_answer revealed by MQTT question_ended payload (or submit response if backend returns it)
  const [revealedAnswer, setRevealedAnswer] = useState<unknown>(undefined);
  const answeredForRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string>('');

  useEffect(() => {
    const raw = sessionStorage.getItem('safco_participant');
    if (!raw) { router.replace('/play'); return; }
    const p = JSON.parse(raw) as Participant;
    if (p.pin !== pin) { router.replace('/play'); return; }
    setParticipant(p);
  }, [pin, router]);

  const showingResult = !!(selectedOption && lastResult);

  const { data: state, refetch: refetchState } = useQuery<SessionState | null>({
    queryKey: ['play-session', pin],
    queryFn: () => playApi.sessionState(pin as string) as Promise<SessionState>,
    // Poll at 500ms after answering so next question appears almost instantly
    refetchInterval: showingResult ? 500 : 3000,
    enabled: !!participant,
  });

  const status = state?.status ?? 'connecting';
  const currentIndex = state?.current_question_index ?? 0;

  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const q = await playApi.currentQuestion(pin as string);
      if (!q) return;
      setCurrentQuestion(q);
      if (answeredForRef.current !== q.question_id) {
        // New question — reset answer state
        setSelectedOption(null);
        setLastResult(null);
        answeredForRef.current = q.question_id;
      }
    } catch { /* ignore */ }
  }, [pin]);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (status === 'question_active') {
      setRevealedAnswer(undefined); // clear for new question
      if (!currentQuestion || prevStatus === 'question_ended') {
        fetchCurrentQuestion();
      }
    } else if (status !== 'question_ended') {
      setCurrentQuestion(null);
    }
  }, [status, currentQuestion, fetchCurrentQuestion]);

  useLiveSession(
    pin,
    ['question_started', 'question_ended', 'completed'],
    useCallback((event: string, payload: unknown) => {
      if (event === 'question_started') {
        answeredForRef.current = null;
        setSelectedOption(null);
        setLastResult(null);
        setRevealedAnswer(undefined);
        setCurrentQuestion(null);
        fetchCurrentQuestion();
        refetchState();
      } else if (event === 'question_ended') {
        // Backend sends correct_answer in the question_ended payload — capture it for students
        type EndedPayload = { payload?: { correct_answer?: unknown }; correct_answer?: unknown };
        const p = payload as EndedPayload;
        const ca = p?.payload?.correct_answer ?? p?.correct_answer;
        if (ca !== undefined) setRevealedAnswer(ca);
        refetchState();
      } else {
        refetchState();
      }
    }, [fetchCurrentQuestion, refetchState]),
  );

  async function submit(optionId: string) {
    if (!participant || selectedOption || busy || !optionId) return;
    setSelectedOption(optionId);
    setBusy(true);
    try {
      const res = await playApi.submitAnswer(pin as string, participant.id, String(optionId));
      setLastResult(res as AnswerResult);
      // If backend already returns correct_answer in submit response, capture it immediately
      if ((res as AnswerResult).correct_answer !== undefined) {
        setRevealedAnswer((res as AnswerResult).correct_answer);
      }
    } catch {
      setSelectedOption(null);
    } finally { setBusy(false); }
  }

  if (!participant) return null;

  if (status === 'connecting' || (!state && !currentQuestion)) {
    return <Full bg="bg-white"><Loader2 className="w-12 h-12 animate-spin text-brand-600" /></Full>;
  }
  if (status === 'waiting' || status === 'starting') {
    return <LobbyScreen participant={participant} pin={String(pin)} count={state?.participant_count ?? 0} quizName={state?.quiz_name} onExit={() => router.push('/play')} />;
  }
  // CRITICAL: check completed FIRST — otherwise ResultScreen blocks CompletedScreen
  if (status === 'completed') {
    return (
      <CompletedScreen
        participant={participant}
        finalScore={lastResult?.total_score ?? null}
        finalLeaderboard={state?.final_leaderboard ?? []}
        quizName={state?.quiz_name}
      />
    );
  }
  // Show result IMMEDIATELY after submitting — no waiting for timer
  if (selectedOption && lastResult) {
    // Merge revealed correct_answer from MQTT question_ended event (if available)
    const resultWithAnswer: AnswerResult = revealedAnswer !== undefined
      ? { ...lastResult, correct_answer: revealedAnswer }
      : lastResult;
    return (
      <ResultScreen
        result={resultWithAnswer}
        participant={participant}
        question={currentQuestion}
        selectedOption={selectedOption}
        isLastQuestion={currentIndex + 1 >= (state?.total_questions ?? 999)}
      />
    );
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
    return <WaitScreen participant={participant} />;
  }
  return <Full bg="bg-slate-50"><span className="text-slate-400">Status: {status}</span></Full>;
}

/* ── helpers ── */

function Full({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <main className={`fixed inset-0 ${bg} flex items-center justify-center`}>
      {children}
    </main>
  );
}

/* ── Lobby ── */
function LobbyScreen({ participant, pin, count, quizName, onExit }: {
  participant: Participant; pin: string; count: number; quizName?: string; onExit: () => void;
}) {
  return (
    <main className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      <button onClick={onExit} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition" title="Toka">
        <LogOut className="w-5 h-5" />
      </button>
      <div className="text-center animate-fade-in max-w-sm w-full">
        <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-4xl font-black shadow-lg shadow-orange-200">
          {participant.nickname[0]?.toUpperCase()}
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-1">{participant.nickname}</h1>
        {quizName && <p className="text-slate-500 text-sm mb-6">{quizName}</p>}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Game PIN</p>
          <p className="text-5xl font-mono font-black tracking-widest text-orange-500">{pin}</p>
        </div>

        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-green-700 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {count} {count === 1 ? 'player' : 'players'} joined
        </div>

        <p className="mt-8 text-slate-400 text-xs">Subiri mwalimu aanze quiz…</p>
      </div>
    </main>
  );
}

/* ── Countdown circle ── */
function CountdownCircle({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? remaining / total : 0;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const col = remaining <= 5 ? '#ef4444' : remaining <= 10 ? '#f59e0b' : '#22c55e';

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={col} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.25s linear, stroke 0.25s' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-black text-slate-800">{remaining}</span>
      </div>
    </div>
  );
}

function useCountdown(endsAt: string | null | undefined, totalSeconds: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return totalSeconds;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
}

function shapeChar(shape?: string): string {
  const map: Record<string, string> = { triangle: '▲', diamond: '◆', circle: '●', square: '■', star: '★', plus: '✚' };
  return shape ? (map[shape] ?? '●') : '●';
}

/* ── Question ── */
function QuestionScreen({ participant, question, selectedOption, busy, onSelect }: {
  participant: Participant;
  question: CurrentQuestion;
  selectedOption: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const remaining = useCountdown(question.ends_at, question.time_limit_seconds);
  const timeUp = remaining <= 0;
  const answered = !!selectedOption;
  const opts = question.options?.slice(0, 4) ?? [];

  function handleExit() {
    if (confirm('Una uhakika unataka kutoka kwenye quiz?')) router.push('/play');
  }

  return (
    <main className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex-1 text-xs text-slate-500 font-medium">
          Swali <span className="text-slate-900 font-bold">{question.question_number}</span> / {question.total_questions}
        </div>
        <CountdownCircle remaining={remaining} total={question.time_limit_seconds} />
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className="text-xs text-slate-500">{participant.nickname}</span>
          <button onClick={handleExit} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded transition" title="Toka">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-full bg-orange-400 transition-all duration-200"
          style={{ width: `${(question.question_number / question.total_questions) * 100}%` }}
        />
      </div>

      {/* Question text */}
      <div className="flex items-center justify-center px-4 py-4 flex-shrink-0" style={{ minHeight: '28%' }}>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-4 max-w-2xl w-full text-center">
          {question.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.image_url} alt="" className="w-full max-h-32 object-contain mb-3 rounded" />
          )}
          <p className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">{question.text}</p>
        </div>
      </div>

      {/* Options — 2×2 grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-3">
        {opts.filter((o) => o.id).map((opt, i) => {
          const bg = opt.color ?? COLORS[i] ?? '#334155';
          const shape = shapeChar(opt.shape) ?? SHAPES[i] ?? '●';
          const isSel = selectedOption === opt.id;
          const dim = answered && !isSel;

          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              disabled={answered || busy || timeUp}
              className={`
                relative rounded-2xl flex flex-col items-center justify-center gap-2 p-3
                text-white font-bold transition-all duration-150
                ${dim ? 'opacity-25 scale-95' : 'active:scale-95'}
                ${isSel ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-50 scale-[1.03]' : ''}
                ${!answered && !timeUp ? 'hover:brightness-110 hover:scale-[1.02]' : ''}
                ${timeUp && !answered ? 'opacity-40' : ''}
              `}
              style={{ backgroundColor: bg }}
            >
              <span className="text-3xl leading-none">{shape}</span>
              <span className="text-sm md:text-base text-center leading-tight">{opt.label}</span>
              {isSel && (
                <div className="absolute inset-0 rounded-2xl border-4 border-white/60 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Status footer */}
      <div className="py-2 text-center text-xs shrink-0 bg-white border-t border-slate-200">
        {answered && <p className="text-green-600 font-semibold">✓ Jibu limetumwa — inapakia matokeo…</p>}
        {timeUp && !answered && <p className="text-red-500 font-semibold">⏱ Muda umeisha!</p>}
        {!answered && !timeUp && <p className="text-slate-300">&nbsp;</p>}
      </div>
    </main>
  );
}

/* ── Wait (time up, no answer) ── */
function WaitScreen({ participant }: { participant: Participant }) {
  const router = useRouter();
  return (
    <Full bg="bg-slate-50">
      <div className="text-center">
        <div className="text-7xl mb-4">⌛</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Swali limemalizika</h1>
        <p className="text-slate-500 text-sm">Hukujibu kwa wakati</p>
        <p className="mt-6 text-xs text-slate-400">{participant.nickname}</p>
        <button onClick={() => router.push('/play')} className="mt-8 text-xs text-slate-400 hover:text-slate-600 underline">
          Toka kwenye quiz
        </button>
      </div>
    </Full>
  );
}

/* ── Per-question result — shows immediately after submitting ── */
function normalizeCorrect(v: unknown): string[] {
  if (Array.isArray(v)) return (v as unknown[]).map(String);
  if (v === null || v === undefined) return [];
  return [String(v)];
}

function ResultScreen({ result, participant, question, selectedOption, isLastQuestion }: {
  result: AnswerResult;
  participant: Participant;
  question: CurrentQuestion | null;
  selectedOption: string | null;
  isLastQuestion: boolean;
}) {
  const correctIds = normalizeCorrect(result.correct_answer);
  const opts = question?.options?.slice(0, 4) ?? [];

  // Show dot-dot-dot countdown so student knows something is happening
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots((d) => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="fixed inset-0 flex flex-col overflow-y-auto bg-slate-50">
      {/* Verdict banner */}
      <div className={`px-6 py-5 text-white text-center ${result.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
        <div className="flex items-center justify-center gap-3 mb-1">
          {result.is_correct
            ? <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
            : <XCircle className="w-8 h-8" strokeWidth={2.5} />}
          <span className="text-2xl font-black">{result.is_correct ? 'Sahihi! 🎉' : 'Sio Sahihi 😬'}</span>
        </div>
        {result.points_earned > 0 && (
          <div className="text-4xl font-black text-yellow-200 font-mono">+{result.points_earned.toLocaleString()}</div>
        )}
        {(result.speed_bonus > 0 || result.streak_bonus > 0) && (
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            {result.speed_bonus > 0 && (
              <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 text-sm font-bold">
                <Zap className="w-3.5 h-3.5" /> Kasi +{result.speed_bonus}
              </span>
            )}
            {result.streak_bonus > 0 && (
              <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 text-sm font-bold">
                <Flame className="w-3.5 h-3.5" /> Streak +{result.streak_bonus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Options — show correct answer highlighted */}
      {opts.length > 0 && (
        <div className="px-4 py-4 space-y-2">
          {!result.is_correct && (
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              {correctIds.length > 0 ? '✅ Jibu Sahihi Lilikuwa:' : 'Majibu yote:'}
            </p>
          )}
          {opts.map((opt, i) => {
            const isCorrect = correctIds.length > 0 && correctIds.includes(String(opt.id));
            const wasSelected = selectedOption === opt.id;
            const bg = opt.color ?? COLORS[i] ?? '#334155';

            let rowClass = 'border-slate-200 bg-white text-slate-700';
            let labelClass = 'text-slate-700';
            if (isCorrect) {
              rowClass = 'border-green-400 bg-green-50';
              labelClass = 'text-green-800 font-bold';
            } else if (wasSelected && !result.is_correct) {
              rowClass = 'border-red-300 bg-red-50';
              labelClass = 'text-red-700';
            }

            return (
              <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${rowClass}`}>
                <span className="text-xl w-7 text-center shrink-0" style={{ color: bg }}>
                  {shapeChar(opt.shape) ?? SHAPES[i] ?? '●'}
                </span>
                <span className={`flex-1 text-sm ${labelClass}`}>{opt.label}</span>
                {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                {wasSelected && !result.is_correct && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                {wasSelected && result.is_correct && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Score + waiting */}
      <div className="px-4 pb-6 mt-auto space-y-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Jumla ya Alama</p>
          <p className="text-4xl font-black text-orange-500 font-mono">{result.total_score.toLocaleString()}</p>
          {result.current_streak >= 2 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 rounded-full px-3 py-1 text-sm font-bold">
              <Flame className="w-4 h-4" /> {result.current_streak} sahihi mfululizo!
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
          {isLastQuestion ? `Inasubiri matokeo ya mwisho${dots}` : `Swali linalofuata linakuja${dots}`}
        </div>
        <div className="text-center">
          <button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/play'; }} className="text-xs text-slate-300 hover:text-slate-500 underline transition">
            Toka kwenye quiz
          </button>
        </div>
      </div>
    </main>
  );
}

/* ── Final podium ── */
function CompletedScreen({ participant, finalScore, finalLeaderboard, quizName }: {
  participant: Participant; finalScore: number | null; finalLeaderboard: LeaderboardEntry[];
  quizName?: string;
}) {
  const router = useRouter();
  const myRow = useMemo(
    () => finalLeaderboard.find((e) => e.nickname === participant.nickname),
    [finalLeaderboard, participant.nickname],
  );
  const rank = myRow?.rank;
  const score = myRow?.total_score ?? finalScore ?? 0;

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎯';
  const rankLabel = !rank ? null
    : rank === 1 ? '🥇 Umeshinda!' : rank === 2 ? '🥈 Nafasi ya 2!' : rank === 3 ? '🥉 Nafasi ya 3!'
    : `Nafasi ya ${rank}`;

  return (
    <main className="fixed inset-0 bg-slate-50 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-start px-4 py-8">

        {/* Top nav — back to home */}
        <div className="w-full max-w-sm mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/student')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            ← Dashibodi
          </button>
          <span className="text-xs text-slate-400 font-mono">{participant.nickname}</span>
        </div>

        <Trophy className="w-20 h-20 text-yellow-500 mb-3" />
        <h1 className="text-4xl font-black text-slate-900 mb-1">Quiz Imekamilika!</h1>
        {quizName && <p className="text-slate-500 text-sm mb-2">{quizName}</p>}
        {rankLabel && <div className="text-2xl text-slate-700 mb-4">{rankLabel}</div>}

        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-5 mb-6 text-center shadow-sm w-full max-w-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Alama Zako {rankEmoji}</p>
          <p className="text-6xl font-black text-orange-500 font-mono">{score.toLocaleString()}</p>
          {myRow && (
            <div className="flex items-center justify-center gap-4 mt-3 text-sm text-slate-600">
              <span>✓ {myRow.correct_answers} sahihi</span>
              {myRow.longest_streak > 0 && (
                <span className="text-orange-500 flex items-center gap-1">
                  <Flame className="w-4 h-4" /> streak {myRow.longest_streak}
                </span>
              )}
            </div>
          )}
        </div>

        {finalLeaderboard.length > 0 && (
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-4 mb-6 space-y-1.5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400 text-center mb-3">🏆 Orodha ya Ushindi</p>
            {finalLeaderboard.slice(0, 10).map((e) => {
              const isMe = e.nickname === participant.nickname;
              const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : String(e.rank);
              return (
                <div key={e.participant_id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl ${isMe ? 'bg-orange-50 ring-2 ring-orange-400' : 'bg-slate-50'}`}>
                  <div className="w-8 text-center font-black text-sm">{medal}</div>
                  <div className="flex-1 font-semibold text-slate-900 truncate">
                    {e.nickname}{isMe && <span className="text-orange-500 text-xs ml-1">(wewe)</span>}
                  </div>
                  <div className="font-mono font-black text-orange-500">{e.total_score.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => router.push('/play')}
            className="btn-primary text-base px-8 py-3 justify-center"
          >
            Cheza Tena 🚀
          </button>
          <button
            onClick={() => router.push('/student')}
            className="btn-secondary text-sm px-8 py-2.5 justify-center"
          >
            ← Rudi Dashibodini
          </button>
        </div>
      </div>
    </main>
  );
}
