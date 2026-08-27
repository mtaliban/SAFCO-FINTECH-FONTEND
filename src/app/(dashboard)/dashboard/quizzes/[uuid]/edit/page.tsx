'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  Loader2, Plus, Play, CheckCircle2, Trash2, Copy, Save,
  ArrowUp, ArrowDown, Library, Settings2, ListChecks, HelpCircle, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { quizApi, type Quiz, type QuizFormPayload } from '@/lib/quiz/api';
import { QUESTION_TYPE_LABEL, type QuestionType } from '@/lib/questionBank/api';
import { AttachFromBankModal } from './AttachFromBankModal';
import { ExamSection } from '../../_shared/ExamSection';
import { AiQuestionGenerator } from '@/components/ai/AiQuestionGenerator';

type Tab = 'questions' | 'settings';
const TIME_CHOICES = [5, 10, 15, 20, 30, 45, 60, 90, 120] as const;

export default function QuizEditPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('questions');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', uuid],
    queryFn: () => quizApi.get(uuid as string),
  });

  const attachedUuidSet = useMemo(
    () => new Set((quiz?.questions ?? []).map((q) => q.id)),
    [quiz],
  );

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ['quiz', uuid] });
  }

  async function publish() {
    try {
      await quizApi.publish(uuid as string);
      toast.success('Quiz published — students can now take it.');
      await refresh();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Publish failed';
      toast.error(msg);
    }
  }

  async function hostLive() {
    try {
      const session = await quizApi.host(uuid as string);
      toast.success(`Live session started! PIN: ${session.pin}`);
      router.push(`/dashboard/quizzes/${uuid}/host/${session.id}?pin=${session.pin}`);
    } catch {
      toast.error('Failed to start live session');
    }
  }

  async function duplicate() {
    if (!confirm('Create a draft copy of this quiz with all its questions?')) return;
    try {
      const copy = await quizApi.duplicate(uuid as string);
      toast.success('Quiz duplicated');
      router.push(`/dashboard/quizzes/${copy.id}/edit`);
    } catch {
      toast.error('Duplicate failed');
    }
  }

  async function moveQuestion(fromIdx: number, direction: -1 | 1) {
    if (!quiz?.questions) return;
    const list = [...quiz.questions];
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= list.length) return;
    [list[fromIdx], list[toIdx]] = [list[toIdx], list[fromIdx]];
    try {
      await quizApi.reorderQuestions(uuid as string, list.map((q) => q.id));
      await refresh();
    } catch {
      toast.error('Reorder failed');
    }
  }

  async function detachQuestion(questionUuid: string) {
    if (!confirm('Remove this question from the quiz? (The question stays in its bank.)')) return;
    try {
      const res = await quizApi.detachQuestions(uuid as string, [questionUuid]);
      toast.success(`Removed — quiz now has ${res.total_questions} question(s).`);
      await refresh();
    } catch {
      toast.error('Detach failed');
    }
  }

  if (isLoading || !quiz) {
    return <div className="p-4 sm:p-6 lg:p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{quiz.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
            <StatusBadge status={quiz.status} />
            <span className="text-slate-500">
              {quiz.mode === 'live_kahoot' ? 'SAFCO Live' : quiz.mode === 'self_paced' ? 'Self-Paced' : 'Exam'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">{quiz.category}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500 font-semibold">
              {quiz.questions?.length ?? 0} / {quiz.number_of_questions} questions
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">{quiz.passing_mark_percentage}% to pass</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">{quiz.max_attempts} attempts</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={duplicate} className="btn-secondary text-sm" title="Duplicate quiz">
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          {quiz.status !== 'published' && (
            <button onClick={publish} className="btn-primary text-sm" title={(quiz.questions?.length ?? 0) === 0 ? 'Add at least one question first' : 'Publish this quiz'}>
              <CheckCircle2 className="w-4 h-4" /> Publish
            </button>
          )}
          {quiz.status === 'published' && quiz.mode === 'live_kahoot' && (
            <button onClick={hostLive} className="btn-primary text-sm">
              <Play className="w-4 h-4" /> Host Live
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-slate-200 mb-6 flex gap-1">
        <TabButton active={tab === 'questions'} onClick={() => setTab('questions')} icon={<ListChecks className="w-4 h-4" />}>
          Questions ({quiz.questions?.length ?? 0})
        </TabButton>
        <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={<Settings2 className="w-4 h-4" />}>
          Settings
        </TabButton>
      </div>

      {tab === 'questions' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-slate-900">Questions</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAiGenerator(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition text-white"
                style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)' }}
              >
                <Sparkles className="w-4 h-4" /> Generate with AI
              </button>
              <button onClick={() => setShowAttachModal(true)} className="btn-primary text-sm">
                <Library className="w-4 h-4" /> Attach from Bank
              </button>
            </div>
          </div>

          {!quiz.questions?.length ? (
            <div className="p-12 text-center">
              <HelpCircle className="w-16 h-16 mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No questions attached yet</h3>
              <p className="text-slate-500 mb-6">Pick from your Question Banks or let AI generate questions instantly.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowAiGenerator(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition"
                  style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)' }}
                >
                  <Sparkles className="w-4 h-4" /> Generate with AI
                </button>
                <button onClick={() => setShowAttachModal(true)} className="btn-primary">
                  <Library className="w-4 h-4" /> Attach from Bank
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {quiz.questions.map((q, i) => (
                <div key={q.id} className="p-3 rounded-lg border border-slate-200 hover:border-brand-300 flex items-start gap-3 transition">
                  <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 line-clamp-2">{q.text}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold">
                        {QUESTION_TYPE_LABEL[q.type as QuestionType] ?? q.type}
                      </span>
                      <span>· {q.time_limit_seconds}s · {q.points} pts · {q.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveQuestion(i, -1)}
                      disabled={i === 0}
                      className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveQuestion(i, 1)}
                      disabled={i === (quiz.questions?.length ?? 0) - 1}
                      className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => detachQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remove from quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && <SettingsPanel quiz={quiz} onSaved={refresh} />}

      {showAttachModal && (
        <AttachFromBankModal
          quizUuid={uuid as string}
          attachedQuestionUuids={attachedUuidSet}
          onClose={() => setShowAttachModal(false)}
          onAttached={async () => { await refresh(); setShowAttachModal(false); }}
        />
      )}

      {showAiGenerator && (
        <AiQuestionGenerator
          quizUuid={uuid as string}
          onClose={() => setShowAiGenerator(false)}
          onImported={async () => { await refresh(); setShowAiGenerator(false); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Quiz['status'] }) {
  const map = {
    draft: 'bg-amber-100 text-amber-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-slate-200 text-slate-600',
  } as const;
  return <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-xs ${map[status]}`}>{status}</span>;
}

function TabButton({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
        active
          ? 'text-brand-700 border-brand-500'
          : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function SettingsPanel({ quiz, onSaved }: { quiz: Quiz; onSaved: () => Promise<void> }) {
  const [f, setF] = useState<QuizFormPayload>(() => ({
    name: quiz.name,
    description: quiz.description ?? '',
    mode: quiz.mode,
    exam_type: quiz.exam_type ?? 'practice',
    category: quiz.category,
    difficulty: quiz.difficulty,
    duration_minutes: quiz.duration_minutes ?? undefined,
    number_of_questions: quiz.number_of_questions,
    passing_mark_percentage: quiz.passing_mark_percentage,
    max_attempts: quiz.max_attempts,
    default_time_per_question: quiz.default_time_per_question,
    shuffle_questions: quiz.settings.shuffle_questions,
    shuffle_options: quiz.settings.shuffle_options,
    show_correct_after_each: quiz.settings.show_correct_after_each,
    show_leaderboard: quiz.settings.show_leaderboard,
    award_bonus_for_speed: quiz.settings.award_bonus_for_speed,
    allow_late_join: quiz.settings.allow_late_join,
    anti_cheat_settings: quiz.anti_cheat_settings ?? { browser_lock: false, disable_copy_paste: false, disable_right_click: false, max_violations: 3 },
  }));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setDirty(true); /* run on every setF */ }, [f]);

  function update<K extends keyof QuizFormPayload>(k: K, v: QuizFormPayload[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    if (!f.name?.trim()) { toast.error('Quiz name is required'); return; }
    setBusy(true);
    try {
      await quizApi.update(quiz.id, {
        ...f,
        duration_minutes: f.duration_minutes ? Number(f.duration_minutes) : null,
        number_of_questions: Number(f.number_of_questions ?? 0),
        passing_mark_percentage: Number(f.passing_mark_percentage ?? 0),
        max_attempts: Number(f.max_attempts ?? 1),
        default_time_per_question: Number(f.default_time_per_question ?? 20),
      });
      toast.success('Settings saved');
      setDirty(false);
      await onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <SectionHeader title="Basics" />
      <div>
        <label className="label">Quiz Name *</label>
        <input className="input" value={f.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea rows={3} className="input" value={f.description ?? ''} onChange={(e) => update('description', e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Mode</label>
          <select className="input" value={f.mode} onChange={(e) => update('mode', e.target.value as Quiz['mode'])}>
            <option value="live_kahoot">SAFCO Live</option>
            <option value="self_paced">Self-Paced</option>
            <option value="exam">Exam</option>
          </select>
        </div>
        <div>
          <label className="label">Difficulty</label>
          <select className="input" value={f.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      <SectionHeader title="Timing" />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Total Duration (minutes)</label>
          <input
            type="number" min={1} max={600} className="input"
            value={f.duration_minutes ?? ''}
            onChange={(e) => update('duration_minutes', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div>
          <label className="label">Default Time per Question</label>
          <select className="input" value={f.default_time_per_question} onChange={(e) => update('default_time_per_question', Number(e.target.value))}>
            {TIME_CHOICES.map((n) => <option key={n} value={n}>{n} seconds</option>)}
          </select>
        </div>
      </div>

      <SectionHeader title="Grading & Attempts" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="label">Number of Questions</label>
          <input
            type="number" min={1} max={200} className="input"
            value={f.number_of_questions ?? 0}
            onChange={(e) => update('number_of_questions', Number(e.target.value))}
          />
          <p className="help">Target count (auto-updates as questions are attached).</p>
        </div>
        <div>
          <label className="label">Passing Mark (%)</label>
          <input
            type="number" min={0} max={100} className="input"
            value={f.passing_mark_percentage ?? 0}
            onChange={(e) => update('passing_mark_percentage', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Max Attempts per Student</label>
          <input
            type="number" min={1} max={100} className="input"
            value={f.max_attempts ?? 1}
            onChange={(e) => update('max_attempts', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Exam-only sections (rendered inline; ExamSection returns null when mode !== 'exam') */}
      <div className="-mx-6 -mb-4 space-y-6">
        <ExamSection
          value={f}
          onChange={(patch) => setF((prev) => ({ ...prev, ...patch }))}
        />
      </div>

      <SectionHeader title="Behavior" />
      <div className="grid md:grid-cols-2 gap-3">
        <Check label="Shuffle questions" checked={!!f.shuffle_questions} onChange={(v) => update('shuffle_questions', v)} />
        <Check label="Shuffle options" checked={!!f.shuffle_options} onChange={(v) => update('shuffle_options', v)} />
        <Check label="Show correct answer after each" checked={!!f.show_correct_after_each} onChange={(v) => update('show_correct_after_each', v)} />
        <Check label="Show leaderboard (live)" checked={!!f.show_leaderboard} onChange={(v) => update('show_leaderboard', v)} />
        <Check label="Award bonus for speed" checked={!!f.award_bonus_for_speed} onChange={(v) => update('award_bonus_for_speed', v)} />
        <Check label="Allow late join (live)" checked={!!f.allow_late_join} onChange={(v) => update('allow_late_join', v)} />
      </div>

      <div className="pt-2 flex justify-end sticky bottom-0 bg-white">
        <button onClick={save} disabled={busy || !dirty} className="btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Save className="w-4 h-4" /> Save Settings</>)}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2 border-t border-slate-100 first:border-0 first:pt-0">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-brand-300 cursor-pointer">
      <input type="checkbox" className="w-5 h-5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm text-slate-800">{label}</span>
    </label>
  );
}
