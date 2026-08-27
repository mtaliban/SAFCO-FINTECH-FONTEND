'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, GraduationCap, Timer, ShieldAlert, Lock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { attemptApi, type AvailableExam, type ExamType } from '@/lib/quiz/api';
import { CATEGORY_LABEL } from '@/lib/course/api';

const EXAM_TYPE_META: Record<ExamType, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  practice: { label: 'Practice Test', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: GraduationCap },
  mock: { label: 'Mock Exam', color: 'text-amber-700', bg: 'bg-amber-100', icon: Timer },
  final_certification: { label: 'Final Certification', color: 'text-red-700', bg: 'bg-red-100', icon: Lock },
};

export default function ExamsListPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['available-exams'],
    queryFn: () => attemptApi.availableExams(),
  });

  const grouped: Record<ExamType, AvailableExam[]> = {
    practice: [],
    mock: [],
    final_certification: [],
  };
  for (const e of data) grouped[e.exam_type ?? 'practice'].push(e);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-orange-500" /> Examinations
        </h1>
        <p className="text-slate-600 mt-1">Practice tests, mock exams, and final certifications (SRS Module 8).</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : data.length === 0 ? (
        <div className="card p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Hakuna mitihani bado</h3>
          <p className="text-slate-500">Trainer hajaandaa mtihani wa mode="exam" bado.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(['final_certification', 'mock', 'practice'] as const).map((type) => (
            grouped[type].length > 0 && (
              <ExamGroup key={type} type={type} exams={grouped[type]} />
            )
          ))}
        </div>
      )}
    </div>
  );
}

function ExamGroup({ type, exams }: { type: ExamType; exams: AvailableExam[] }) {
  const meta = EXAM_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <div>
      <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${meta.color}`}>
        <Icon className="w-5 h-5" />
        {meta.label}
        <span className="text-sm text-slate-400 font-normal">({exams.length})</span>
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {exams.map((e) => <ExamCard key={e.id} exam={e} />)}
      </div>
    </div>
  );
}

function ExamCard({ exam }: { exam: AvailableExam }) {
  const meta = EXAM_TYPE_META[exam.exam_type];
  const remaining = exam.attempts_remaining;
  const unlocked = remaining === null || remaining > 0;
  const ac = exam.anti_cheat_settings;

  return (
    <div className="card p-5 hover:shadow-md hover:border-brand-300 transition flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
        <span className="text-xs text-slate-500 uppercase font-semibold">{exam.difficulty}</span>
      </div>

      <h3 className="font-bold text-lg text-slate-900 mb-1">{exam.name}</h3>
      {exam.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{exam.description}</p>}

      <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-3">
        <span className="px-2 py-1 rounded bg-slate-100">{CATEGORY_LABEL[exam.category as keyof typeof CATEGORY_LABEL] ?? exam.category}</span>
        {exam.duration_minutes && <span className="px-2 py-1 rounded bg-slate-100 flex items-center gap-1"><Timer className="w-3 h-3" /> {exam.duration_minutes} min</span>}
        <span className="px-2 py-1 rounded bg-slate-100">{exam.number_of_questions} Q</span>
        <span className="px-2 py-1 rounded bg-slate-100">Pass ≥ {exam.passing_mark_percentage}%</span>
      </div>

      {/* Attempts hint */}
      <div className="mb-3 text-sm">
        {remaining === null ? (
          <span className="text-emerald-700 font-semibold">Unlimited attempts</span>
        ) : remaining === 0 ? (
          <span className="text-red-700 font-semibold">No attempts remaining</span>
        ) : exam.exam_type === 'final_certification' ? (
          <span className="text-red-700 font-semibold">Single attempt available</span>
        ) : (
          <span className="text-amber-700 font-semibold">{remaining} of {exam.max_attempts} attempts remaining</span>
        )}
      </div>

      {/* Best result */}
      {exam.best_result && (
        <div className={`text-xs mb-3 p-2 rounded flex items-center gap-2 ${
          exam.best_result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {exam.best_result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>Best: {exam.best_result.percentage.toFixed(1)}% ({exam.best_result.passed ? 'Passed' : 'Failed'})</span>
          <Link href={`/student/exams/attempts/${exam.best_result.attempt_id}`} className="ml-auto underline">
            Review
          </Link>
        </div>
      )}

      {/* Anti-cheat badges */}
      {ac && (ac.browser_lock || ac.disable_copy_paste || ac.disable_right_click) && (
        <div className="mb-3 text-[10px] flex flex-wrap gap-1 text-red-700">
          {ac.browser_lock && <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5" /> Browser Lock</span>}
          {ac.disable_copy_paste && <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200">No Copy/Paste</span>}
          {ac.disable_right_click && <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200">No Right-Click</span>}
        </div>
      )}

      <div className="mt-auto">
        {unlocked ? (
          <Link href={`/student/exams/${exam.id}/take`} className="btn-primary w-full justify-center">
            {exam.best_result ? 'Retake Exam' : 'Start Exam'} <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button disabled className="btn-secondary w-full justify-center opacity-60 cursor-not-allowed">
            <Lock className="w-4 h-4" /> Locked
          </button>
        )}
      </div>
    </div>
  );
}
