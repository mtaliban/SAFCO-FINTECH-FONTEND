'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { forumApi, type CategorySlug } from '@/lib/forum/api';

export default function NewThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: cats } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => forumApi.categories(),
  });

  const [category, setCategory] = useState<CategorySlug>(
    (searchParams.get('category') as CategorySlug) || 'questions'
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  // Prefer assignment_uuid from query (from assignment page); fallback to assignment_id.
  const initialAssignmentUuid = searchParams.get('assignment_uuid') ?? '';
  const initialAssignmentId = searchParams.get('assignment_id') ?? '';
  const [assignmentUuid, setAssignmentUuid] = useState<string>(initialAssignmentUuid);
  const [assignmentId, setAssignmentId] = useState<string>(initialAssignmentId);

  const selected = cats?.categories.find((c) => c.slug === category);
  const needsAssignment = selected?.requires_course_context;
  const hasAssignmentContext = Boolean(assignmentUuid || assignmentId);

  const createMut = useMutation({
    mutationFn: () => forumApi.createThread({
      category,
      title,
      body,
      assignment_uuid: needsAssignment && assignmentUuid ? assignmentUuid : undefined,
      assignment_id: needsAssignment && !assignmentUuid && assignmentId ? Number(assignmentId) : undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6),
    }),
    onSuccess: (r) => {
      toast.success('Discussion started');
      router.push(`/forum/thread/${r.uuid}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/forum" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to forum
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">Start a discussion</h1>

      <div className="card p-5 space-y-4">
        <div>
          <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Category</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {cats?.categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug as CategorySlug)}
                className={`p-3 rounded border-2 text-left transition ${
                  category === c.slug
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-slate-500 mt-1">{c.description}</div>
              </button>
            ))}
          </div>
        </div>

        {needsAssignment && (
          <div>
            <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Assignment</label>
            {hasAssignmentContext ? (
              <div className="mt-1 px-3 py-2 rounded bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
                ✓ Attached to assignment ({assignmentUuid || `#${assignmentId}`})
              </div>
            ) : (
              <input
                type="text"
                value={assignmentUuid}
                onChange={(e) => setAssignmentUuid(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Paste the assignment UUID (open from an assignment page for this to prefill)"
              />
            )}
          </div>
        )}

        <div>
          <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={
              category === 'questions'
                ? 'What is your question? Be specific.'
                : category === 'ideas'
                ? 'Summarize your idea'
                : 'What aspect of the assignment?'
            }
            maxLength={220}
          />
          <div className="text-xs text-slate-400 mt-1 text-right">{title.length}/220</div>
        </div>

        <div>
          <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full min-h-[220px] rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Add details: what have you tried, what did you expect, what actually happened?"
          />
          <div className="text-xs text-slate-500 mt-1">
            Use @name to mention someone. Markdown-lite: keep formatting simple.
          </div>
        </div>

        <div>
          <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Tags (optional)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. excel, pivot-tables, formula (comma-separated, max 6)"
          />
        </div>

        <div className="flex justify-end">
          <button
            disabled={
              title.trim().length < 5 || body.trim().length < 10 ||
              (needsAssignment && !hasAssignmentContext) ||
              createMut.isPending
            }
            onClick={() => createMut.mutate()}
            className="btn-primary"
          >
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post discussion
          </button>
        </div>
      </div>
    </div>
  );
}
