'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Loader2, Send, ArrowLeft, HelpCircle, Lightbulb,
  ClipboardList, Tag, X, Lightbulb as TipIcon, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { forumApi, type CategorySlug } from '@/lib/forum/api';

const ICON_MAP: Record<string, React.ElementType> = { HelpCircle, Lightbulb, ClipboardList };
const iconFor = (icon: string | null): React.ElementType => ICON_MAP[icon ?? ''] ?? HelpCircle;

const TIPS: Record<CategorySlug, string[]> = {
  questions: [
    'Be specific — describe exactly what you tried and what happened.',
    'Include error messages word-for-word when applicable.',
    'Mention which course or lesson you are working on.',
    'Avoid "it doesn\'t work" — explain what you expected vs. what occurred.',
  ],
  ideas: [
    'Explain the problem your idea solves for other learners.',
    'Describe how you envision the idea working in practice.',
    'Consider challenges or trade-offs others might raise.',
  ],
  assignments: [
    'Reference the specific assignment section you need help with.',
    'Show your work — share what you have attempted so far.',
    'Do not share full assignment answers; focus on your specific blocker.',
  ],
};

export default function NewThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: cats } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => forumApi.categories(),
  });

  const [category, setCategory] = useState<CategorySlug>(
    (searchParams.get('category') as CategorySlug) || 'questions',
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const initialAssignmentUuid = searchParams.get('assignment_uuid') ?? '';
  const initialAssignmentId   = searchParams.get('assignment_id') ?? '';
  const [assignmentUuid, setAssignmentUuid] = useState(initialAssignmentUuid);
  const [assignmentId, setAssignmentId]     = useState(initialAssignmentId);

  const selected = cats?.categories.find((c) => c.slug === category);
  const needsAssignment = selected?.requires_course_context;
  const hasAssignmentContext = Boolean(assignmentUuid || assignmentId);

  const addTag = (raw: string) => {
    const t = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').trim();
    if (t && !tags.includes(t) && tags.length < 6) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  };

  const createMut = useMutation({
    mutationFn: () => forumApi.createThread({
      category,
      title,
      body,
      assignment_uuid: needsAssignment && assignmentUuid ? assignmentUuid : undefined,
      assignment_id: needsAssignment && !assignmentUuid && assignmentId ? Number(assignmentId) : undefined,
      tags,
    }),
    onSuccess: (r) => {
      toast.success('Discussion started!');
      router.push(`/forum/thread/${r.uuid}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to post'),
  });

  const canSubmit = title.trim().length >= 5 && body.trim().length >= 10
    && (!needsAssignment || hasAssignmentContext)
    && !createMut.isPending;

  const tips = TIPS[category] ?? TIPS.questions;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)' }}>
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Link href="/forum"
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white font-semibold text-sm mb-4 transition">
            <ArrowLeft className="w-4 h-4" /> Back to forum
          </Link>
          <h1 className="text-3xl font-black text-white">Start a discussion</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Share your question or idea with the SAFCO FINTECH learning community.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── FORM ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Category selector */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="font-bold text-slate-900 text-sm">Choose a category</div>
              </div>
              <div className="p-5 grid grid-cols-3 gap-3">
                {cats?.categories.map((c) => {
                  const Icon = iconFor(c.icon);
                  const active = category === c.slug;
                  return (
                    <button
                      key={c.slug}
                      onClick={() => setCategory(c.slug as CategorySlug)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-slate-600'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active ? 'bg-indigo-100' : 'bg-slate-100'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-sm">{c.name}</div>
                      {c.description && (
                        <div className="text-[11px] text-slate-500 leading-tight">{c.description}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignment context */}
            {needsAssignment && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <label className="block">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Assignment reference</div>
                  {hasAssignmentContext ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-semibold">
                      <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" />
                      Attached to assignment {assignmentUuid || `#${assignmentId}`}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={assignmentUuid}
                      onChange={(e) => setAssignmentUuid(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                      placeholder="Assignment UUID (open from an assignment page to prefill)"
                    />
                  )}
                </label>
              </div>
            )}

            {/* Title + body */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="font-bold text-slate-900 text-sm">Write your post</div>
              </div>
              <div className="p-5 space-y-4">
                <label className="block">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">
                    {category === 'questions' ? 'Question' : 'Title'} *
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium"
                    placeholder={
                      category === 'questions' ? 'What is your question? Be specific and clear.'
                      : category === 'ideas' ? 'Summarize your idea in one sentence.'
                      : 'Which aspect of the assignment do you need help with?'
                    }
                    maxLength={220}
                  />
                  <div className={`text-xs mt-1.5 text-right font-medium ${title.length > 200 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {title.length} / 220
                  </div>
                </label>

                <label className="block">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Body *</div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full min-h-[260px] rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 text-sm leading-relaxed resize-y"
                    placeholder={
                      category === 'questions'
                        ? 'Describe the problem in detail:\n• What have you tried?\n• What did you expect to happen?\n• What actually happened?\n• Include any relevant error messages.'
                        : 'Provide context and details to help others understand and engage with your post…'
                    }
                  />
                  <div className={`text-xs mt-1.5 text-right font-medium ${body.length > 4500 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {body.length} chars · Use @name to mention someone
                  </div>
                </label>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-3">Tags (optional, max 6)</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                    <Tag className="w-3 h-3" />{t}
                    <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="ml-0.5 text-indigo-400 hover:text-indigo-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {tags.length < 6 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  placeholder="e.g. excel, pivot-tables, vlookup — press Enter to add"
                />
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between">
              <Link href="/forum" className="text-sm font-bold text-slate-500 hover:text-slate-700 transition">
                Cancel
              </Link>
              <button
                disabled={!canSubmit}
                onClick={() => createMut.mutate()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-7 py-3 rounded-xl transition shadow-sm text-sm"
              >
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post discussion
              </button>
            </div>
          </div>

          {/* ── TIPS SIDEBAR ── */}
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 font-bold text-indigo-900 mb-3 text-sm">
                <TipIcon className="w-4 h-4 text-indigo-600" /> Tips for a great post
              </div>
              <ul className="space-y-2.5">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-indigo-800 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm">
                <Info className="w-4 h-4 text-slate-500" /> Community guidelines
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>· Be respectful and constructive at all times.</li>
                <li>· Search first — your question may already be answered.</li>
                <li>· Stay on topic and relevant to the course material.</li>
                <li>· Do not share personal information publicly.</li>
                <li>· Report inappropriate content using the flag button.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
