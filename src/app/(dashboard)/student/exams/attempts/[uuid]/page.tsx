'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, CheckCircle2, XCircle, ShieldAlert, Clock, ArrowLeft, Trophy, AlertTriangle, Award,
} from 'lucide-react';
import { attemptApi, type AttemptSummary } from '@/lib/quiz/api';

export default function AttemptResultPage() {
  const { uuid } = useParams<{ uuid: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['attempt', uuid],
    queryFn: () => attemptApi.get(uuid as string),
  });

  if (isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }
  if (!data || !('passed' in data)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto card p-4 sm:p-6 lg:p-8 text-center text-slate-500">
        Result not available (attempt might still be in progress).
      </div>
    );
  }
  const summary = data as AttemptSummary;
  const passed = summary.passed;
  const pct = summary.percentage;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      <Link href="/student/exams" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Exams
      </Link>

      {/* Big pass/fail banner */}
      <div className={`rounded-2xl p-4 sm:p-6 lg:p-8 text-white text-center mb-6 ${
        passed ? 'bg-gradient-to-br from-emerald-500 to-emerald-800' : 'bg-gradient-to-br from-red-500 to-red-800'
      }`}>
        {passed ? <Trophy className="w-16 h-16 mx-auto mb-3 text-yellow-300" /> : <XCircle className="w-16 h-16 mx-auto mb-3" />}
        <div className="text-xs uppercase tracking-widest opacity-80 mb-1">
          {summary.quiz.name}
        </div>
        <h1 className="text-4xl font-black mb-2">
          {passed ? 'PASSED' : 'NOT PASSED'}
        </h1>
        <div className="text-6xl font-black font-mono mb-2">{pct.toFixed(1)}%</div>
        <div className="text-sm opacity-80">Required: {summary.passing_mark_percentage}%</div>

        {summary.auto_submit_reason && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" />
            Auto-submitted: {summary.auto_submit_reason.replace(/_/g, ' ')}
          </div>
        )}
      </div>

      {/* Certificate earned banner */}
      {summary.certificate && (
        <Link
          href={`/student/certificates/${summary.certificate.id}`}
          className="block mb-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white p-6 hover:brightness-105 transition"
        >
          <div className="flex items-center gap-4">
            <Award className="w-14 h-14 shrink-0" strokeWidth={1.8} />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest font-bold text-white/80">You earned a certificate</div>
              <div className="text-2xl font-black">Certificate {summary.certificate.cert_number}</div>
              <div className="text-sm text-white/90 mt-1">Click to view, download PDF, or share the public verify link.</div>
            </div>
            <div className="text-3xl">→</div>
          </div>
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Score" value={`${summary.total_score} / ${summary.max_possible_score}`} accent="brand" />
        <StatBox label="Correct" value={`${summary.correct_answers}`} accent="green" />
        <StatBox label="Incorrect" value={`${summary.incorrect_answers}`} accent="red" />
        <StatBox label="Unanswered" value={`${summary.unanswered}`} accent="slate" />
      </div>

      {/* Meta */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 text-sm">
        {summary.duration_seconds !== null && (
          <div className="flex items-center gap-1 text-slate-600">
            <Clock className="w-4 h-4" /> Duration: <strong>{formatDuration(summary.duration_seconds)}</strong>
          </div>
        )}
        <div className="flex items-center gap-1 text-slate-600">
          Exam type: <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold uppercase text-xs">{summary.exam_type}</span>
        </div>
        {summary.violations.length > 0 && (
          <div className="flex items-center gap-1 text-red-700">
            <ShieldAlert className="w-4 h-4" /> Violations: <strong>{summary.violations.length}</strong>
          </div>
        )}
      </div>

      {/* Violations list */}
      {summary.violations.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-red-500">
          <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Anti-cheat violations
          </h3>
          <ul className="text-sm text-red-900 space-y-1">
            {summary.violations.map((v, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-xs text-red-600">{new Date(v.at).toLocaleTimeString()}</span>
                <span>{v.type.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-question review — practice only */}
      {summary.review && summary.review.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-lg mb-4">Answer Review</h3>
          <div className="space-y-4">
            {summary.review.map((r, i) => (
              <ReviewCard key={r.question_id} index={i} row={r} />
            ))}
          </div>
        </div>
      )}
      {!summary.review && (
        <div className="card p-6 text-center text-sm text-slate-500">
          Answer review is not available for this exam type. Contact your trainer for detailed feedback.
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: 'brand' | 'green' | 'red' | 'slate' }) {
  const cls = accent === 'brand' ? 'bg-brand-50 text-brand-700'
    : accent === 'green' ? 'bg-emerald-50 text-emerald-700'
    : accent === 'red' ? 'bg-red-50 text-red-700'
    : 'bg-slate-100 text-slate-700';
  return (
    <div className={`rounded-lg p-3 text-center ${cls}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs uppercase font-semibold tracking-widest mt-1 opacity-80">{label}</div>
    </div>
  );
}

function ReviewCard({ index, row }: { index: number; row: NonNullable<AttemptSummary['review']>[0] }) {
  const opts = (row.options ?? []) as Array<Record<string, unknown>>;
  const correctIds = normaliseIds(row.correct_answer);
  const myIds = normaliseIds(row.my_answer);

  return (
    <div className={`p-4 rounded-lg border-2 ${row.is_correct ? 'border-emerald-300 bg-emerald-50/30' : 'border-red-300 bg-red-50/30'}`}>
      <div className="flex items-start gap-2 mb-2">
        {row.is_correct ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase text-slate-500 mb-1">
            Q{index + 1} · {row.points_earned}/{row.points_possible} pts
          </div>
          <div className="text-slate-900 font-medium">{row.text}</div>
        </div>
      </div>

      {/* Show options with correct highlighted */}
      {['multiple_choice', 'true_false', 'multiple_select'].includes(row.type) && opts.length > 0 && (
        <div className="space-y-1 ml-7 mt-3">
          {opts.map((o, i) => {
            const id = String(o.id ?? i);
            const isCorrect = correctIds.includes(id);
            const isMine = myIds.includes(id);
            return (
              <div key={id} className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
                isCorrect ? 'bg-emerald-100 text-emerald-800 font-semibold'
                : isMine ? 'bg-red-100 text-red-800 font-semibold'
                : 'bg-slate-100 text-slate-600'
              }`}>
                {isCorrect && <CheckCircle2 className="w-3 h-3" />}
                {!isCorrect && isMine && <XCircle className="w-3 h-3" />}
                <span>{String(o.label ?? o.left ?? '')}</span>
                {isMine && <span className="ml-auto text-[10px] uppercase">your answer</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Fill-in / short answer */}
      {['fill_in_blank', 'short_answer'].includes(row.type) && (
        <div className="ml-7 mt-3 text-sm space-y-1">
          <div>Your answer: <span className={`font-mono px-2 py-0.5 rounded ${row.is_correct ? 'bg-emerald-100' : 'bg-red-100'}`}>{String((row.my_answer as string[] | string) ?? '—')}</span></div>
          <div>Accepted: <span className="font-mono px-2 py-0.5 rounded bg-slate-100">{JSON.stringify(row.correct_answer)}</span></div>
        </div>
      )}

      {row.explanation && (
        <div className="mt-3 ml-7 p-2 bg-navy-50 border-l-4 border-navy-200 rounded text-sm text-navy-500">
          <strong>Explanation:</strong> {row.explanation}
        </div>
      )}
    </div>
  );
}

function normaliseIds(v: unknown): string[] {
  if (Array.isArray(v)) return (v as unknown[]).map(String);
  if (v === null || v === undefined) return [];
  return [String(v)];
}

function formatDuration(s: number): string {
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return mm > 0 ? `${mm}m ${ss}s` : `${ss}s`;
}
