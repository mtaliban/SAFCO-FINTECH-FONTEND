'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft, Loader2, ShieldAlert, Users, CheckCircle2, XCircle,
  Clock, AlertTriangle, ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';
import { analyticsApi, type AnalyticsAttemptRow, type QuizViolation } from '@/lib/quiz/api';

const VIOLATION_LABELS: Record<string, string> = {
  tab_switch:        'Tab Switch',
  fullscreen_exit:   'Fullscreen Exit',
  copy_paste:        'Copy / Paste',
  right_click:       'Right Click',
  visibility_hidden: 'Window Hidden',
  dev_tools:         'DevTools Open',
  devtools_shortcut: 'DevTools Shortcut',
  window_blur:       'Window Blur',
  webcam_denied:     'Webcam Denied',
};

function fmtDuration(secs: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function AutoSubmitBadge({ reason }: { reason: string | null }) {
  if (!reason) return null;
  const labels: Record<string, string> = {
    duration_exceeded:     'Time Up',
    violations_threshold:  'Violations',
  };
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
      <AlertTriangle className="w-3 h-3" />
      {labels[reason] ?? reason}
    </span>
  );
}

function ViolationRow({ v }: { v: QuizViolation }) {
  return (
    <div className="flex items-center gap-2 text-xs py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
      <span className="font-medium text-slate-700">{VIOLATION_LABELS[v.type] ?? v.type}</span>
      <span className="text-slate-400">{fmtDate(v.at)}</span>
    </div>
  );
}

function AttemptRow({ attempt, passing }: { attempt: AnalyticsAttemptRow; passing: number }) {
  const [open, setOpen] = useState(false);
  const hasViolations = attempt.violations_count > 0;
  const isAutoSubmitted = !!attempt.auto_submit_reason;
  const isFlagged = hasViolations || isAutoSubmitted;

  return (
    <>
      <tr
        className={`border-t border-slate-100 hover:bg-slate-50 transition cursor-pointer ${isFlagged ? 'bg-red-50/40' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
              {attempt.student?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">{attempt.student?.name ?? 'Unknown'}</div>
              <div className="text-xs text-slate-400">{attempt.student?.email ?? ''}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">#{attempt.attempt_number}</td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            attempt.status === 'completed' ? 'bg-green-100 text-green-700' :
            attempt.status === 'expired'   ? 'bg-amber-100 text-amber-700' :
            attempt.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>{attempt.status}</span>
        </td>
        <td className="px-4 py-3">
          {attempt.status === 'in_progress' ? (
            <span className="text-slate-400 text-sm">—</span>
          ) : attempt.passed ? (
            <span className="flex items-center gap-1 text-green-700 text-sm font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 text-sm font-semibold">
              <XCircle className="w-3.5 h-3.5" /> Fail
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 bg-slate-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${attempt.percentage >= passing ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${Math.min(100, attempt.percentage)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700">{attempt.percentage.toFixed(1)}%</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">{fmtDuration(attempt.duration_seconds)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {hasViolations && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                <ShieldAlert className="w-3 h-3" />
                {attempt.violations_count}
              </span>
            )}
            <AutoSubmitBadge reason={attempt.auto_submit_reason} />
            {!isFlagged && <span className="text-xs text-slate-400">Clear</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(attempt.started_at)}</td>
        <td className="px-4 py-3 text-slate-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50 border-t border-slate-100">
          <td colSpan={9} className="px-6 py-3">
            {attempt.violations.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No violations recorded.</p>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Violation Log</p>
                <div className="space-y-0.5">
                  {attempt.violations.map((v, i) => (
                    <ViolationRow key={i} v={v} />
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
  { value: 'in_progress', label: 'In Progress' },
];

export default function QuizAnalyticsPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quiz-analytics', uuid, statusFilter, page],
    queryFn: () => analyticsApi.quizAnalytics(uuid, { page, per_page: 25, status: statusFilter || undefined }),
  });

  const quiz    = data?.quiz;
  const summary = data?.summary;
  const passing = quiz?.passing_mark_percentage ?? 50;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <Link href="/trainer/quizzes" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> My Quizzes
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">Anti-Cheat Analytics</h1>
          </div>
          {quiz && (
            <p className="text-slate-500 mt-0.5">
              {quiz.name}
              {quiz.exam_type && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-semibold uppercase">
                  {quiz.exam_type.replace('_', ' ')}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : isError ? (
        <div className="card p-10 text-center text-red-600">Imeshindwa kupakia data. Jaribu tena.</div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Attempts</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{summary.total_attempts}</p>
              <p className="text-xs text-slate-400 mt-0.5">{summary.in_progress} in progress</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Pass Rate</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{summary.pass_rate}%</p>
              <p className="text-xs text-slate-400 mt-0.5">{summary.pass_count} passed · {summary.fail_count} failed</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Avg Score</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{summary.avg_score}%</p>
              <p className="text-xs text-slate-400 mt-0.5">Pass mark: {passing}%</p>
            </div>

            <div className={`card p-4 ${summary.attempts_with_violations > 0 ? 'border-red-200 bg-red-50/60' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className={`w-4 h-4 ${summary.attempts_with_violations > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Flagged</span>
              </div>
              <p className={`text-2xl font-bold ${summary.attempts_with_violations > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                {summary.attempts_with_violations}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{summary.total_violations} violations total</p>
            </div>
          </div>

          {/* Violation Breakdown */}
          {Object.keys(summary.violation_breakdown).length > 0 && (
            <div className="card p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Violation Breakdown
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.violation_breakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                    <span className="text-sm font-bold text-red-700">{count}</span>
                    <span className="text-xs text-red-600">{VIOLATION_LABELS[type] ?? type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters + Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm font-semibold text-slate-700">
                {data?.meta.total ?? 0} attempts
                {summary.auto_submitted_count > 0 && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    · {summary.auto_submitted_count} auto-submitted
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filter:</span>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        statusFilter === opt.value
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(data?.attempts ?? []).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">Hakuna attempts za kuonyesha.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                      <th className="px-4 py-2 font-semibold">Student</th>
                      <th className="px-4 py-2 font-semibold">Attempt</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 font-semibold">Result</th>
                      <th className="px-4 py-2 font-semibold">Score</th>
                      <th className="px-4 py-2 font-semibold">Duration</th>
                      <th className="px-4 py-2 font-semibold">Integrity</th>
                      <th className="px-4 py-2 font-semibold">Started</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data!.attempts.map((a) => (
                      <AttemptRow key={a.id} attempt={a} passing={passing} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data && data.meta.last_page > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {data.meta.current_page} of {data.meta.last_page}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="text-xs px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === data.meta.last_page}
                    className="text-xs px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
