'use client';

export const dynamic = 'force-dynamic';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, SkipForward, Users, Trophy, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionApi, LeaderboardEntry } from '@/lib/quiz/api';

export default function HostSessionPage() {
  const { session } = useParams<{ session: string }>();
  const params = useSearchParams();
  const pin = params.get('pin') ?? '';

  const [status, setStatus] = useState<string>('waiting');
  const [participantCount, setParticipantCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', session],
    queryFn: () => sessionApi.leaderboard(session as string),
    refetchInterval: 2000,
  });

  // Poll session state
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/v1/play/session/${pin}`);
        const json = await res.json();
        setStatus(json.data.status);
        setParticipantCount(json.data.participant_count);
        setCurrentIndex(json.data.current_question_index);
        setTotalQuestions(json.data.total_questions);
      } catch { /* ignore */ }
    }
    poll();
    const t = setInterval(poll, 1500);
    return () => clearInterval(t);
  }, [pin]);

  async function nextQuestion() {
    try {
      await sessionApi.startQuestion(session as string);
      toast.success(`Swali ${currentIndex + 2} imeanza`);
    } catch { /* handled */ }
  }

  async function endQuestion() {
    try {
      await sessionApi.endQuestion(session as string);
      toast.success('Jibu limefunuliwa');
    } catch { /* handled */ }
  }

  async function complete() {
    try {
      await sessionApi.complete(session as string);
      toast.success('Session imekamilika');
    } catch { /* handled */ }
  }

  function copyPin() {
    navigator.clipboard.writeText(pin);
    toast.success('PIN copied!');
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Big PIN display */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-900 text-white rounded-3xl p-8 mb-6 text-center relative overflow-hidden">
        <div className="text-sm uppercase tracking-widest opacity-70 mb-2">Game PIN</div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-7xl md:text-8xl font-black tracking-widest font-mono">{pin}</div>
          <button onClick={copyPin} className="p-3 rounded-lg bg-white/10 hover:bg-white/20">
            <Copy className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 text-lg">
          Join at <strong>localhost:3002/play</strong>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <Users className="w-5 h-5" />
            <span className="font-bold text-xl">{participantCount}</span>
            <span className="text-sm opacity-70">washindani</span>
          </div>
          {status !== 'waiting' && (
            <div className="bg-white/10 rounded-full px-4 py-2">
              Swali <strong>{currentIndex + 1}</strong> / {totalQuestions}
            </div>
          )}
          <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
            status === 'waiting' ? 'bg-amber-500' :
            status === 'question_active' ? 'bg-green-500' :
            status === 'question_ended' ? 'bg-blue-500' :
            status === 'completed' ? 'bg-purple-500' : 'bg-slate-500'
          }`}>
            {status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Host Controls</h3>
        <div className="flex flex-wrap gap-3">
          {status === 'waiting' && (
            <button onClick={nextQuestion} className="btn-primary text-base px-6 py-3">
              <Play className="w-5 h-5" /> Anzisha Quiz
            </button>
          )}
          {status === 'question_active' && (
            <button onClick={endQuestion} className="btn-primary text-base px-6 py-3 bg-blue-600 hover:bg-blue-700">
              <Pause className="w-5 h-5" /> Onyesha Jibu
            </button>
          )}
          {status === 'question_ended' && currentIndex + 1 < totalQuestions && (
            <button onClick={nextQuestion} className="btn-primary text-base px-6 py-3">
              <SkipForward className="w-5 h-5" /> Swali Linalofuata
            </button>
          )}
          {status === 'question_ended' && currentIndex + 1 >= totalQuestions && (
            <button onClick={complete} className="btn-primary text-base px-6 py-3 bg-purple-600 hover:bg-purple-700">
              <Trophy className="w-5 h-5" /> Malizia Quiz
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Hakuna washindani bado...</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry: LeaderboardEntry) => (
              <div
                key={entry.participant_id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  entry.rank === 1 ? 'bg-yellow-50 border-2 border-yellow-300' :
                  entry.rank === 2 ? 'bg-slate-100' :
                  entry.rank === 3 ? 'bg-orange-50' :
                  'bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                  entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                  entry.rank === 2 ? 'bg-slate-300 text-slate-800' :
                  entry.rank === 3 ? 'bg-orange-300 text-orange-900' :
                  'bg-brand-100 text-brand-700'
                }`}>
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{entry.nickname}</div>
                  <div className="text-xs text-slate-500">
                    {entry.correct_answers} sahihi · streak {entry.longest_streak}
                  </div>
                </div>
                <div className="text-2xl font-black text-brand-700">{entry.total_score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
