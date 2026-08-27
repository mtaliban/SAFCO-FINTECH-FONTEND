'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Loader2, Download, CheckCircle2, XCircle, Award, Save, Users, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentApi, type Submission } from '@/lib/course/api';
import { aiApi } from '@/lib/ai/api';

export default function GradingPage() {
  const { uuid } = useParams<{ uuid: string }>();

  const { data: assignmentData, isLoading: aLoad } = useQuery({
    queryKey: ['assignment', uuid],
    queryFn: () => assignmentApi.get(uuid as string),
  });
  const { data: subsResp, isLoading: sLoad } = useQuery({
    queryKey: ['assignment-submissions', uuid],
    queryFn: () => assignmentApi.submissions(uuid as string),
  });

  const submissions = subsResp?.data ?? [];
  const assignment = assignmentData?.assignment;

  const stats = useMemo(() => {
    const graded = submissions.filter((s) => s.status === 'graded');
    const avg = graded.length > 0
      ? graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length
      : 0;
    return { total: submissions.length, graded: graded.length, avg };
  }, [submissions]);

  if (aLoad || sLoad || !assignment) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <Link href={`/trainer/courses`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs uppercase text-slate-500 font-semibold tracking-widest">Grading</div>
            <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
            <div className="mt-2 text-sm text-slate-600 flex flex-wrap gap-3">
              <span>Max: <strong>{assignment.max_points}</strong> pts</span>
              {assignment.due_date && <span>Due: <strong>{new Date(assignment.due_date).toLocaleDateString()}</strong></span>}
              <span>Accepts: {(assignment.allowed_file_types ?? []).map((t) => '.' + t).join(', ')}</span>
            </div>
          </div>
          {assignment.brief && (
            <a
              href={assignment.brief.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              <Download className="w-4 h-4" /> Brief
            </a>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatBox label="Total Submissions" value={stats.total} icon={<Users className="w-5 h-5" />} accent="brand" />
          <StatBox label="Graded" value={`${stats.graded} / ${stats.total}`} icon={<CheckCircle2 className="w-5 h-5" />} accent="green" />
          <StatBox
            label="Average Grade"
            value={stats.graded > 0 ? `${stats.avg.toFixed(1)} / ${assignment.max_points}` : '—'}
            icon={<Award className="w-5 h-5" />}
            accent="amber"
          />
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No submissions yet</h3>
          <p className="text-slate-500">Students who submit will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <SubmissionRow
              key={s.uuid}
              s={s}
              maxPoints={assignment.max_points}
              assignmentTitle={assignment.title}
              assignmentInstructions={assignment.instructions ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: 'brand' | 'green' | 'amber' }) {
  const cls = accent === 'green' ? 'bg-emerald-50 text-emerald-700'
    : accent === 'amber' ? 'bg-amber-50 text-amber-700'
    : 'bg-brand-50 text-brand-700';
  return (
    <div className={`rounded-lg p-4 ${cls}`}>
      <div className="flex items-center gap-2 text-xs uppercase font-semibold tracking-wider opacity-80">
        {icon} {label}
      </div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  );
}

function SubmissionRow({ s, maxPoints, assignmentTitle, assignmentInstructions }: {
  s: Submission; maxPoints: number; assignmentTitle: string; assignmentInstructions: string;
}) {
  const qc = useQueryClient();
  const [grade, setGrade] = useState<number>(s.grade ?? 0);
  const [feedback, setFeedback] = useState<string>(s.feedback ?? '');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);

  async function saveGrade() {
    if (grade < 0 || grade > maxPoints) { toast.error(`Grade must be 0–${maxPoints}`); return; }
    setBusy(true);
    try {
      await assignmentApi.grade(s.uuid, grade, feedback || undefined);
      toast.success('Grade saved');
      qc.invalidateQueries({ queryKey: ['assignment-submissions'] });
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function autoGrade() {
    const studentText = s.answer_text;
    if (!studentText) { toast.error('No text answer to grade — download and grade the file manually'); return; }
    setAiGrading(true);
    try {
      const result = await aiApi.gradeSubmission({
        assignment_title: assignmentTitle,
        assignment_instructions: assignmentInstructions,
        student_answer: studentText,
        max_points: maxPoints,
      });
      setGrade(result.suggested_grade);
      const feedbackText = [
        result.feedback,
        result.strengths?.length ? `\n\nStrengths: ${result.strengths.join('; ')}` : '',
        result.improvements?.length ? `\nImprovements: ${result.improvements.join('; ')}` : '',
      ].filter(Boolean).join('');
      setFeedback(feedbackText);
      toast.success(`AI suggested ${result.suggested_grade}/${maxPoints} (${result.percentage}%) — review before saving`);
    } catch {
      toast.error('AI grading failed — grade manually');
    } finally {
      setAiGrading(false);
    }
  }

  return (
    <div className={`card p-4 ${s.status === 'graded' ? 'border-l-4 border-emerald-500' : 'border-l-4 border-slate-200'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {s.status === 'graded' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-slate-400" />}
            <span className="font-bold text-slate-900">{s.student.name ?? s.student.email}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
              s.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>{s.status}</span>
          </div>
          <div className="text-xs text-slate-500">
            {s.student.email} · Submitted {new Date(s.submitted_at).toLocaleString()}
          </div>
        </div>
        {s.file_url && s.file_name && (
          <a
            href={s.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download={s.file_name}
            className="btn-secondary text-sm shrink-0"
          >
            <Download className="w-4 h-4" /> {s.file_name} ({fmtSize(s.file_size ?? 0)})
          </a>
        )}
      </div>

      {s.answer_text && (
        <div className="mb-3">
          <button onClick={() => setExpanded((x) => !x)} className="text-xs text-brand-600 hover:text-brand-700">
            {expanded ? 'Hide' : 'Show'} student notes
          </button>
          {expanded && (
            <div className="mt-1 p-3 rounded bg-slate-50 text-sm text-slate-700 whitespace-pre-wrap">{s.answer_text}</div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-[120px_1fr_auto] gap-3 items-end">
        <div>
          <label className="label text-xs">Grade / {maxPoints}</label>
          <input
            type="number" min={0} max={maxPoints}
            className="input"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label text-xs">Feedback (optional)</label>
          <textarea
            rows={2}
            className="input resize-none text-xs"
            placeholder="Constructive feedback for the student…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          {s.answer_text && (
            <button
              onClick={autoGrade}
              disabled={aiGrading || busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition disabled:opacity-50 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)' }}
              title="Let AI analyze the student's answer and suggest a grade"
            >
              {aiGrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Auto-Grade
            </button>
          )}
          <button onClick={saveGrade} disabled={busy} className="btn-primary whitespace-nowrap">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Save className="w-4 h-4" /> Save</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
