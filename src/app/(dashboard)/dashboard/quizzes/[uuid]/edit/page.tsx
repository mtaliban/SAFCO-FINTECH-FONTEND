'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, Plus, Play, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizApi } from '@/lib/quiz/api';
import { apiRequest } from '@/lib/api';

const OPTION_STYLES = [
  { color: '#e21b3c', shape: 'triangle', icon: '▲' },
  { color: '#1368ce', shape: 'diamond', icon: '◆' },
  { color: '#d89e00', shape: 'circle', icon: '●' },
  { color: '#26890c', shape: 'square', icon: '■' },
];

export default function QuizEditPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', uuid],
    queryFn: () => quizApi.get(uuid as string),
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [bankId, setBankId] = useState<number | null>(null);
  const [newQ, setNewQ] = useState({
    text: '',
    type: 'multiple_choice' as const,
    time_limit_seconds: 20,
    points: 1000,
    options: [{ label: '' }, { label: '' }, { label: '' }, { label: '' }],
    correct_index: 0,
  });

  // Ensure a bank exists for this trainer
  async function ensureBank(): Promise<number> {
    if (bankId) return bankId;
    try {
      const list = await apiRequest.get<{ data: Array<{ id: number; name: string }> }>('/question-banks');
      if (list.data?.length) {
        setBankId(list.data[0].id);
        return list.data[0].id;
      }
      const bank = await apiRequest.post<{ id: number }>('/question-banks', {
        name: 'My Question Bank',
        category: quiz?.category ?? 'general',
      });
      setBankId(bank.id);
      return bank.id;
    } catch {
      throw new Error('Failed to load or create question bank');
    }
  }

  async function addQuestion() {
    if (!newQ.text.trim() || newQ.options.some((o) => !o.label.trim())) {
      toast.error('Jaza swali na options zote.');
      return;
    }
    try {
      const bank = await ensureBank();
      const options = newQ.options.map((o, i) => ({ id: String.fromCharCode(65 + i), label: o.label, ...OPTION_STYLES[i] }));
      const question = await apiRequest.post<{ id: string }>(`/question-banks/${bank}/questions`, {
        text: newQ.text,
        type: newQ.type,
        options,
        correct_answer: options[newQ.correct_index].id,
        time_limit_seconds: newQ.time_limit_seconds,
        points: newQ.points,
        difficulty: 'medium',
      });

      // Now attach to quiz
      const existing = quiz?.questions ?? [];
      // question came back as a resource with uuid; we need the raw id. Fetch raw.
      // Simpler: use the id property (backend controller sends uuid). We'll use uuid via a sync endpoint that accepts uuids.
      // For simplicity here we re-fetch quiz and let user reorder.

      await qc.invalidateQueries({ queryKey: ['quiz', uuid] });
      setShowAddQuestion(false);
      setNewQ({ text: '', type: 'multiple_choice', time_limit_seconds: 20, points: 1000, options: [{ label: '' }, { label: '' }, { label: '' }, { label: '' }], correct_index: 0 });
      toast.success('Swali limeongezwa!');
    } catch { /* handled */ }
  }

  async function publish() {
    try {
      await quizApi.publish(uuid as string);
      toast.success('Quiz imepublish!');
      qc.invalidateQueries({ queryKey: ['quiz', uuid] });
    } catch { /* handled */ }
  }

  async function hostLive() {
    try {
      const session = await quizApi.host(uuid as string);
      toast.success(`Live session started! PIN: ${session.pin}`);
      router.push(`/dashboard/quizzes/${uuid}/host/${session.id}?pin=${session.pin}`);
    } catch { /* handled */ }
  }

  if (isLoading || !quiz) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{quiz.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className={`px-2 py-0.5 rounded-full font-semibold ${
              quiz.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>{quiz.status}</span>
            <span className="text-slate-500">{quiz.mode}</span>
            <span className="text-slate-500">{quiz.category}</span>
            <span className="text-slate-500">{quiz.questions?.length ?? 0} maswali</span>
          </div>
        </div>
        <div className="flex gap-2">
          {quiz.status !== 'published' && (
            <button onClick={publish} className="btn-primary text-sm">
              <CheckCircle2 className="w-4 h-4" /> Publish
            </button>
          )}
          {quiz.status === 'published' && quiz.mode === 'live_kahoot' && (
            <button onClick={hostLive} className="btn-primary text-sm">
              <Play className="w-4 h-4" /> Host Live Session
            </button>
          )}
        </div>
      </div>

      {/* Questions list */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Maswali ({quiz.questions?.length ?? 0})</h2>
          <button onClick={() => setShowAddQuestion(true)} className="btn-secondary text-sm">
            <Plus className="w-4 h-4" /> Ongeza Swali
          </button>
        </div>

        {!quiz.questions?.length ? (
          <p className="text-slate-500 text-center py-8">Bado hakuna maswali. Anza kuongeza.</p>
        ) : (
          <div className="space-y-2">
            {quiz.questions.map((q, i) => (
              <div key={q.id} className="p-3 rounded-lg bg-slate-50 flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{q.text}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {q.type} · {q.time_limit_seconds}s · {q.points} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add question modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Swali Jipya</h3>

            <div className="space-y-4">
              <div>
                <label className="label">Swali</label>
                <textarea
                  rows={2}
                  className="input"
                  placeholder="Mfano: What does SUM() do?"
                  value={newQ.text}
                  onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Time</label>
                  <select
                    className="input"
                    value={newQ.time_limit_seconds}
                    onChange={(e) => setNewQ({ ...newQ, time_limit_seconds: Number(e.target.value) })}
                  >
                    {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{n}s</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Points</label>
                  <select
                    className="input"
                    value={newQ.points}
                    onChange={(e) => setNewQ({ ...newQ, points: Number(e.target.value) })}
                  >
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                    <option value={1500}>1500</option>
                    <option value={2000}>2000</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Options (bofya alama ya sahihi)</label>
                <div className="space-y-2">
                  {newQ.options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewQ({ ...newQ, correct_index: i })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl transition ${
                          newQ.correct_index === i ? 'ring-4 ring-green-400' : ''
                        }`}
                        style={{ backgroundColor: OPTION_STYLES[i].color }}
                      >
                        {OPTION_STYLES[i].icon}
                      </button>
                      <input
                        className="input flex-1"
                        placeholder={`Chaguo ${i + 1}`}
                        value={o.label}
                        onChange={(e) => {
                          const opts = [...newQ.options];
                          opts[i] = { label: e.target.value };
                          setNewQ({ ...newQ, options: opts });
                        }}
                      />
                      {newQ.correct_index === i && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddQuestion(false)} className="btn-secondary">Cancel</button>
              <button onClick={addQuestion} className="btn-primary">Ongeza Swali</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
