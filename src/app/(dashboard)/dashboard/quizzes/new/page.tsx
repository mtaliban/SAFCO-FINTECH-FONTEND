'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Info, Zap, Timer, Target, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizApi, type QuizFormPayload } from '@/lib/quiz/api';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/course/api';
import { ExamSection } from '../_shared/ExamSection';

const TIME_CHOICES = [5, 10, 15, 20, 30, 45, 60, 90, 120] as const;

export default function NewQuizPage() {
  const router = useRouter();

  const {
    register, handleSubmit, watch, setValue, getValues, formState: { isSubmitting, errors },
  } = useForm<QuizFormPayload>({
    defaultValues: {
      name: '',
      description: '',
      mode: 'live_kahoot',
      exam_type: 'practice',
      category: 'general',
      difficulty: 'beginner',
      duration_minutes: 30,
      number_of_questions: 10,
      passing_mark_percentage: 60,
      max_attempts: 3,
      default_time_per_question: 20,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_after_each: true,
      show_leaderboard: true,
      award_bonus_for_speed: true,
      allow_late_join: false,
      anti_cheat_settings: { browser_lock: false, disable_copy_paste: false, disable_right_click: false, max_violations: 3 },
    },
  });

  const mode = watch('mode');
  const examType = watch('exam_type');
  const antiCheat = watch('anti_cheat_settings');

  function patchForm(patch: Partial<QuizFormPayload>) {
    for (const k of Object.keys(patch) as (keyof QuizFormPayload)[]) {
      setValue(k, patch[k] as never, { shouldDirty: true });
    }
  }

  async function onSubmit(data: QuizFormPayload) {
    try {
      const payload: QuizFormPayload = {
        ...data,
        duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : null,
        number_of_questions: Number(data.number_of_questions ?? 10),
        passing_mark_percentage: Number(data.passing_mark_percentage ?? 60),
        max_attempts: Number(data.max_attempts ?? 3),
        default_time_per_question: Number(data.default_time_per_question ?? 20),
      };
      const quiz = await quizApi.create(payload);
      toast.success('Quiz created — sasa ongeza maswali');
      router.push(`/dashboard/quizzes/${quiz.id}/edit`);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create quiz';
      toast.error(msg);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Tengeneza Quiz Mpya</h1>
        <p className="text-slate-600 mt-1">Anza kwa kuweka SRS settings. Baadaye utaongeza maswali (attach kutoka Bank au create inline).</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* -------- SECTION 1: Basics -------- */}
        <Section icon={<Info className="w-4 h-4" />} title="Basics">
          <div>
            <label className="label">Quiz Name *</label>
            <input
              className="input"
              placeholder="Mfano: Excel Basics · Chapter 1"
              {...register('name', { required: 'Quiz name is required', minLength: { value: 2, message: 'Too short' } })}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" placeholder="What will students learn / practice?" {...register('description')} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" {...register('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" {...register('difficulty')}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </Section>

        {/* -------- SECTION 2: Mode -------- */}
        <Section icon={<Zap className="w-4 h-4" />} title="Mode">
          <div className="grid md:grid-cols-3 gap-3">
            <ModeCard value="live_kahoot" register={register('mode')} current={mode} title="SAFCO Live" desc="Real-time, students join with PIN, live leaderboard." />
            <ModeCard value="self_paced" register={register('mode')} current={mode} title="Self-Paced" desc="Students take it any time; retry as allowed." />
            <ModeCard value="exam" register={register('mode')} current={mode} title="Exam" desc="Strict; timer enforced; single attempt (unless overridden)." />
          </div>
        </Section>

        {/* -------- SECTION 3: Timing -------- */}
        <Section icon={<Timer className="w-4 h-4" />} title="Timing">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Total Duration (minutes)</label>
              <input
                type="number" min={1} max={600} className="input"
                {...register('duration_minutes', { valueAsNumber: true })}
              />
              <p className="help">
                {mode === 'exam'
                  ? 'Enforced wall-clock. Auto-submit when time runs out.'
                  : mode === 'self_paced'
                  ? 'Suggested duration shown to students. Not enforced.'
                  : 'Estimated total. Live pacing is driven per-question.'}
              </p>
            </div>
            <div>
              <label className="label">Default Time per Question</label>
              <select className="input" {...register('default_time_per_question', { valueAsNumber: true })}>
                {TIME_CHOICES.map((n) => <option key={n} value={n}>{n} seconds</option>)}
              </select>
              <p className="help">Per-question default. Can be overridden on individual questions.</p>
            </div>
          </div>
        </Section>

        {/* -------- SECTION 4: Grading -------- */}
        <Section icon={<Target className="w-4 h-4" />} title="Grading & Attempts">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Number of Questions</label>
              <input
                type="number" min={1} max={200} className="input"
                {...register('number_of_questions', { valueAsNumber: true })}
              />
              <p className="help">Target count. Auto-updates as you attach questions.</p>
            </div>
            <div>
              <label className="label">Passing Mark (%)</label>
              <input
                type="number" min={0} max={100} className="input"
                {...register('passing_mark_percentage', { valueAsNumber: true })}
              />
              <p className="help">Score ≥ this to pass.</p>
            </div>
            <div>
              <label className="label">Max Attempts per Student</label>
              <input
                type="number" min={1} max={100} className="input"
                {...register('max_attempts', { valueAsNumber: true })}
              />
              <p className="help">How many times a student can retake.</p>
            </div>
          </div>
        </Section>

        {/* -------- EXAM SECTIONS (only when mode=exam) -------- */}
        <ExamSection
          value={{ mode, exam_type: examType, anti_cheat_settings: antiCheat, max_attempts: getValues('max_attempts') }}
          onChange={patchForm}
        />

        {/* -------- SECTION 5: Behavior -------- */}
        <Section icon={<Settings2 className="w-4 h-4" />} title="Behavior">
          <div className="grid md:grid-cols-2 gap-3">
            <Toggle label="Shuffle questions between students" hint="Randomize the order of questions." {...register('shuffle_questions')} />
            <Toggle label="Shuffle answer options" hint="Randomize option order per question." {...register('shuffle_options')} />
            <Toggle label="Show correct answer after each question" hint="Reveal correct answer immediately." {...register('show_correct_after_each')} />
            <Toggle label="Show leaderboard (live mode)" hint="Rank students after each question." {...register('show_leaderboard')} />
            <Toggle label="Award bonus for speed" hint="Faster correct answers earn more." {...register('award_bonus_for_speed')} />
            <Toggle label="Allow late join (live mode)" hint="Students can join after the quiz starts." {...register('allow_late_join')} />
          </div>
        </Section>

        <div className="flex justify-end gap-3 sticky bottom-0 bg-slate-50 py-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Quiz & Add Questions →'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">{icon}</div>
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ModeCard({
  value, register, current, title, desc,
}: {
  value: string;
  register: ReturnType<ReturnType<typeof useForm<QuizFormPayload>>['register']>;
  current?: string;
  title: string;
  desc: string;
}) {
  const active = current === value;
  return (
    <label
      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
        active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      <input type="radio" value={value} {...register} className="sr-only" />
      <div className={`font-bold mb-1 ${active ? 'text-brand-700' : 'text-slate-900'}`}>{title}</div>
      <div className="text-xs text-slate-600">{desc}</div>
    </label>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Toggle = ({ label, hint, ...regProps }: { label: string; hint?: string } & any) => (
  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-300 cursor-pointer">
    <input type="checkbox" className="w-5 h-5 mt-0.5" {...regProps} />
    <div className="min-w-0">
      <div className="text-sm font-medium text-slate-900">{label}</div>
      {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
    </div>
  </label>
);
