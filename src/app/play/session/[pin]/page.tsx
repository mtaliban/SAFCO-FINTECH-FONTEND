'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Trophy, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { playApi } from '@/lib/quiz/api';

/**
 * Student-facing play interface.
 * Poll session state every 1s (light-weight); MQTT integration can replace this later.
 * Shows:
 *   - Waiting room (before quiz starts)
 *   - Question with 4 colored/shaped buttons
 *   - Result feedback (correct / points earned)
 *   - Final podium
 */

interface Participant { id: string; nickname: string; pin: string }
interface Question {
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

const OPTION_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
const OPTION_SHAPES = ['▲', '◆', '●', '■'];

export default function PlaySessionPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sessionState, setSessionState] = useState<{ status: string; participant_count: number } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<{
    is_correct: boolean; points_earned: number; total_score: number; current_streak: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const answeredForRef = useRef<string | null>(null);

  // Load participant from session storage
  useEffect(() => {
    const raw = sessionStorage.getItem('safco_participant');
    if (!raw) {
      router.replace('/play');
      return;
    }
    const p = JSON.parse(raw) as Participant;
    if (p.pin !== pin) {
      router.replace('/play');
      return;
    }
    setParticipant(p);
  }, [pin, router]);

  // Poll session state + current question every 1.2s
  useEffect(() => {
    if (!participant) return;

    let cancelled = false;

    async function poll() {
      try {
        const state = await playApi.sessionState(pin as string);
        if (cancelled) return;
        setSessionState({ status: state.status, participant_count: state.participant_count });

        // Fetch question payload if a question is active
        if (state.status === 'question_active' && state.current_question_ends_at) {
          const end = new Date(state.current_question_ends_at).getTime();
          setTimeLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));

          // We rely on the host to broadcast the question; for polling MVP we
          // read the last known question via a shadow endpoint below.
        }
      } catch { /* ignore */ }
    }

    poll();
    const t = setInterval(poll, 1200);
    return () => { cancelled = true; clearInterval(t); };
  }, [pin, participant]);

  // Fake question fetcher (in real setup MQTT will push this)
  // For now we ask backend for currently-broadcast question via session state
  useEffect(() => {
    if (!participant || sessionState?.status !== 'question_active') {
      if (sessionState?.status !== 'question_active') setCurrentQuestion(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/play/session/${pin}/current-question`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const q = data.data;
        setCurrentQuestion(q);
        if (q && answeredForRef.current !== q.question_id) {
          setAnswered(false);
          answeredForRef.current = q.question_id;
        }
      } catch { /* ignore */ }
    })();

    return () => { cancelled = true; };
  }, [sessionState?.status, pin, participant]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  async function submitAnswer(optionId: string) {
    if (answered || !participant) return;
    setAnswered(true);
    try {
      const res = await playApi.submitAnswer(pin as string, participant.id, optionId);
      setLastResult(res);
      if (res.is_correct) toast.success(`+${res.points_earned} pts! 🔥`);
      else toast.error('Jibu si sahihi 😬');
    } catch {
      setAnswered(false);
    }
  }

  if (!participant) return null;

  /* ------- Waiting room ------- */
  if (!sessionState || sessionState.status === 'waiting' || sessionState.status === 'starting') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-950 flex flex-col items-center justify-center text-white p-6">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6 animate-pulse">⏳</div>
          <h1 className="text-3xl font-bold mb-2">Karibu, {participant.nickname}!</h1>
          <p className="text-white/70 mb-8">Subiri mwalimu aanze quiz...</p>
          <div className="text-5xl font-mono font-bold tracking-widest text-brand-300">{pin}</div>
          <div className="mt-6 text-sm text-white/60">
            👥 {sessionState?.participant_count ?? 0} washindani waliojiunga
          </div>
        </div>
      </main>
    );
  }

  /* ------- Question active ------- */
  if (sessionState.status === 'question_active' && currentQuestion) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex flex-col">
        {/* Top bar */}
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <div className="text-sm text-white/60">
            Swali {currentQuestion.question_number} / {currentQuestion.total_questions}
          </div>
          <div className="text-3xl font-bold text-brand-300">{timeLeft}s</div>
          <div className="text-sm text-white/60">👤 {participant.nickname}</div>
        </div>

        {/* Question */}
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold">{currentQuestion.text}</h2>
        </div>

        {/* Options grid (Kahoot style) */}
        <div className="flex-1 grid grid-cols-2 gap-3 p-4">
          {currentQuestion.options?.map((opt, i) => (
            <button
              key={opt.id}
              onClick={() => submitAnswer(opt.id)}
              disabled={answered}
              className="rounded-2xl p-8 text-white font-bold text-xl flex items-center justify-center gap-3 transition disabled:opacity-40 active:scale-95 hover:brightness-110"
              style={{ backgroundColor: opt.color ?? OPTION_COLORS[i] }}
            >
              <span className="text-4xl">{opt.shape ? { triangle: '▲', diamond: '◆', circle: '●', square: '■' }[opt.shape] : OPTION_SHAPES[i]}</span>
              <span className="text-left">{opt.label}</span>
            </button>
          ))}
        </div>

        {answered && (
          <div className="p-4 text-center text-white/60 text-sm animate-fade-in">
            ✓ Jibu limetumwa - subiri washindani wengine...
          </div>
        )}
      </main>
    );
  }

  /* ------- Question ended (waiting for next) ------- */
  if (sessionState.status === 'question_ended' && lastResult) {
    return (
      <main className={`min-h-screen flex flex-col items-center justify-center text-white p-8 ${
        lastResult.is_correct
          ? 'bg-gradient-to-br from-green-600 to-green-800'
          : 'bg-gradient-to-br from-red-600 to-red-800'
      }`}>
        <div className="animate-fade-in text-center">
          {lastResult.is_correct ? (
            <>
              <CheckCircle2 className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-4xl font-black mb-2">Sahihi! 🎉</h1>
              <div className="text-6xl font-black text-yellow-300 mb-4">+{lastResult.points_earned}</div>
            </>
          ) : (
            <>
              <XCircle className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-4xl font-black mb-2">Sio Sahihi</h1>
              <div className="text-5xl mb-4">😬</div>
            </>
          )}
          <div className="text-lg mb-2">Alama zako: <strong>{lastResult.total_score}</strong></div>
          {lastResult.current_streak >= 2 && (
            <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Zap className="w-4 h-4" /> Streak: {lastResult.current_streak}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ------- Session completed ------- */
  if (sessionState.status === 'completed') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-950 flex flex-col items-center justify-center text-white p-8">
        <div className="animate-fade-in text-center">
          <Trophy className="w-24 h-24 mx-auto mb-6 text-yellow-300" />
          <h1 className="text-4xl font-black mb-4">Quiz Imekamilika!</h1>
          <div className="text-2xl mb-2">Alama zako za mwisho:</div>
          <div className="text-6xl font-black text-yellow-300 mb-8">{lastResult?.total_score ?? 0}</div>
          <button onClick={() => router.push('/play')} className="btn-primary text-lg px-8 py-3">
            Cheza Tena
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-900 flex items-center justify-center text-white">
      <Loader2 className="w-10 h-10 animate-spin" />
    </main>
  );
}
