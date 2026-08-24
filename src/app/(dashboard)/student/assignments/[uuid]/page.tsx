'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft, Loader2, Download, Upload, FileText, CheckCircle2,
  Clock, AlertTriangle, Trophy, Send, MessagesSquare,
} from 'lucide-react';
import { forumApi } from '@/lib/forum/api';
import toast from 'react-hot-toast';
import {
  assignmentApi, ASSIGNMENT_ACCEPT_ATTR, ASSIGNMENT_MAX_MB,
} from '@/lib/course/api';

export default function StudentAssignmentDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['assignment', uuid],
    queryFn: () => assignmentApi.get(uuid as string),
  });

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const a = data?.assignment;
  const sub = data?.my_submission;
  const graded = sub?.status === 'graded';
  const overdue = a?.due_date ? new Date(a.due_date) < new Date() : false;
  const allowed = a?.allowed_file_types ?? [];

  async function submit() {
    if (!a) return;
    if (!file && !text.trim()) { toast.error('Add text or attach a file.'); return; }
    setBusy(true);
    setProgress(0);
    try {
      await assignmentApi.submit(a.uuid, { file: file ?? undefined, answer_text: text || undefined }, setProgress);
      toast.success('Submission received!');
      setFile(null); setText('');
      qc.invalidateQueries({ queryKey: ['assignment', uuid] });
      qc.invalidateQueries({ queryKey: ['student-assignments'] });
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Submission failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !a) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <Link href="/student/assignments" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </Link>

      {/* Header card */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{a.title}</h1>
            {a.course && <p className="text-sm text-slate-500 mt-1">📚 {a.course.title}{a.lesson ? ` · ${a.lesson.title}` : ''}</p>}
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-black text-slate-700">{a.max_points}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">points</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          {a.due_date && (
            <span className={`px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${
              overdue && !sub ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="w-3 h-3" />
              Due {new Date(a.due_date).toLocaleString()}
              {overdue && !sub && ' · OVERDUE'}
            </span>
          )}
          <span className="px-2 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
            Accepts: {allowed.map((t) => '.' + t).join(', ')}
          </span>
          <span className="px-2 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
            Max {ASSIGNMENT_MAX_MB} MB
          </span>
        </div>
      </div>

      {/* Instructions + brief download */}
      <div className="card p-6 mb-4">
        <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" /> Assignment Brief
        </h2>
        {a.instructions && (
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap mb-4">{a.instructions}</div>
        )}
        {a.brief ? (
          <a
            href={a.brief.download_url}
            target="_blank"
            rel="noopener noreferrer"
            download={a.brief.file_name}
            className="btn-primary w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            Download brief: {a.brief.file_name} ({fmtSize(a.brief.file_size)})
          </a>
        ) : !a.instructions && (
          <p className="text-slate-500 italic text-sm">Your trainer has not uploaded a brief document yet.</p>
        )}
      </div>

      {/* Grade banner (if graded) */}
      {graded && sub && (
        <div className="card p-6 mb-4 border-l-4 border-emerald-500 bg-emerald-50/50">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-emerald-600" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Graded</div>
              <div className="text-3xl font-black text-emerald-900">{sub.grade} / {a.max_points}</div>
            </div>
          </div>
          {sub.feedback && (
            <div className="mt-3 p-3 bg-white rounded border border-emerald-200 text-sm text-slate-800 whitespace-pre-wrap">
              <strong>Feedback:</strong> {sub.feedback}
            </div>
          )}
        </div>
      )}

      {/* Prior submission */}
      {sub && !graded && (
        <div className="card p-4 mb-4 border-l-4 border-blue-500 bg-blue-50/50">
          <div className="text-xs font-semibold uppercase text-blue-700 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Submitted {new Date(sub.submitted_at).toLocaleString()}
          </div>
          {sub.file_name && sub.file_url && (
            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline text-sm">
              📎 {sub.file_name} ({fmtSize(sub.file_size ?? 0)})
            </a>
          )}
          {sub.answer_text && (
            <div className="mt-2 p-2 bg-white rounded text-sm text-slate-700 whitespace-pre-wrap">{sub.answer_text}</div>
          )}
          <p className="mt-2 text-xs text-slate-600">You can re-submit before your trainer grades your work — this will replace the file above.</p>
        </div>
      )}

      {/* Submit form (if not graded) */}
      {!graded && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-brand-600" />
            {sub ? 'Re-submit your answer' : 'Submit your answer'}
          </h2>

          <div className="mb-4">
            <label className="label">Answer file (optional)</label>
            <input
              type="file"
              className="input"
              accept={allowed.length > 0 ? allowed.map((t) => '.' + t).join(',') : ASSIGNMENT_ACCEPT_ATTR}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
            {file && (
              <p className="text-xs text-slate-700 mt-1">
                Selected: <strong>{file.name}</strong> ({fmtSize(file.size)})
              </p>
            )}
            {file && file.size > ASSIGNMENT_MAX_MB * 1024 * 1024 && (
              <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> File exceeds {ASSIGNMENT_MAX_MB} MB limit.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="label">Additional notes (optional)</label>
            <textarea
              rows={4}
              className="input"
              placeholder="Explain your approach or add context…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
            />
          </div>

          {busy && progress > 0 && progress < 100 && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">Uploading… {progress}%</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy || (!file && !text.trim())}
            className="btn-primary w-full justify-center"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Send className="w-4 h-4" /> {sub ? 'Re-submit Answer' : 'Submit Answer'}</>)}
          </button>
        </div>
      )}

      <AssignmentDiscussions assignmentUuid={a.uuid} assignmentTitle={a.title} />
    </div>
  );
}

function AssignmentDiscussions({ assignmentUuid, assignmentTitle }: { assignmentUuid: string; assignmentTitle: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['forum', 'threads', 'assignment', assignmentUuid],
    queryFn: () => forumApi.threads({ assignment_uuid: assignmentUuid, sort: 'recent' }),
  });

  return (
    <div className="card p-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <MessagesSquare className="w-5 h-5 text-brand-600" /> Discussion
        </h2>
        <Link
          href={`/forum/new?category=assignments&assignment_uuid=${assignmentUuid}`}
          className="btn-secondary text-sm"
        >
          Start a new discussion
        </Link>
      </div>
      {isLoading ? (
        <div className="text-center p-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-600" /></div>
      ) : (data?.data.length ?? 0) === 0 ? (
        <p className="text-sm text-slate-500">
          No discussions for &ldquo;{assignmentTitle}&rdquo; yet. Ask a question or share what you tried &mdash; peers can help.
        </p>
      ) : (
        <div className="space-y-2">
          {data?.data.map((t) => (
            <Link
              key={t.uuid}
              href={`/forum/thread/${t.uuid}`}
              className="block p-3 rounded border border-slate-200 hover:bg-slate-50 transition"
            >
              <div className="font-semibold text-slate-900 truncate">{t.title}</div>
              <div className="text-xs text-slate-500 mt-1">
                by {t.author?.name} · {t.replies_count} replies · {t.views_count} views
                {t.has_accepted_answer && <span className="ml-2 text-emerald-700 font-semibold">✓ Solved</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
