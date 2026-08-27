'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, Plus, Search, Pencil, Trash2, HelpCircle,
  CheckSquare, ToggleRight, ListChecks, PenLine, Shuffle, Type,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  questionBankApi,
  QUESTION_TYPES,
  QUESTION_TYPE_LABEL,
  type Question,
  type QuestionType,
} from '@/lib/questionBank/api';
import { CATEGORY_LABEL } from '@/lib/course/api';
import { QuestionEditor } from './QuestionEditor';

const TYPE_ICON: Record<QuestionType, React.ComponentType<{ className?: string }>> = {
  multiple_choice: CheckSquare,
  true_false: ToggleRight,
  multiple_select: ListChecks,
  fill_in_blank: PenLine,
  matching: Shuffle,
  short_answer: Type,
};

const TYPE_COLOR: Record<QuestionType, string> = {
  multiple_choice: 'bg-navy-100 text-navy-600',
  true_false: 'bg-emerald-100 text-emerald-700',
  multiple_select: 'bg-navy-100 text-navy-600',
  fill_in_blank: 'bg-amber-100 text-amber-700',
  matching: 'bg-pink-100 text-pink-700',
  short_answer: 'bg-slate-200 text-slate-700',
};

export default function QuestionBankDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<QuestionType | ''>('');
  const [difficulty, setDifficulty] = useState<'' | 'easy' | 'medium' | 'hard'>('');
  const [editor, setEditor] = useState<{ open: boolean; question: Question | null }>({ open: false, question: null });

  const { data: bank, isLoading: bankLoading } = useQuery({
    queryKey: ['question-bank', uuid],
    queryFn: () => questionBankApi.get(uuid),
  });

  const { data: qs, isLoading: qsLoading } = useQuery({
    queryKey: ['question-bank-questions', uuid, search, type, difficulty],
    queryFn: () =>
      questionBankApi.listQuestions(uuid, {
        ...(search ? { search } : {}),
        ...(type ? { type } : {}),
        ...(difficulty ? { difficulty } : {}),
      }),
  });

  async function handleDelete(q: Question) {
    if (!confirm(`Delete this question? This cannot be undone.\n\n"${q.text.slice(0, 80)}${q.text.length > 80 ? '…' : ''}"`)) return;
    try {
      await questionBankApi.deleteQuestion(q.id);
      toast.success('Question deleted');
      qc.invalidateQueries({ queryKey: ['question-bank-questions', uuid] });
      qc.invalidateQueries({ queryKey: ['question-bank', uuid] });
    } catch {
      toast.error('Delete failed');
    }
  }

  function onEditorSaved() {
    setEditor({ open: false, question: null });
    qc.invalidateQueries({ queryKey: ['question-bank-questions', uuid] });
    qc.invalidateQueries({ queryKey: ['question-bank', uuid] });
    qc.invalidateQueries({ queryKey: ['question-banks'] });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <Link href="/trainer/question-banks" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Question Banks
      </Link>

      {bankLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : !bank ? (
        <div className="card p-12 text-center text-slate-500">Bank not found.</div>
      ) : (
        <>
          <div className="card p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded-full font-semibold bg-brand-100 text-brand-700 capitalize">
                    {CATEGORY_LABEL[bank.category as keyof typeof CATEGORY_LABEL] ?? bank.category}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 uppercase">
                    {bank.difficulty}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{bank.name}</h1>
                {bank.description && <p className="text-slate-600">{bank.description}</p>}
                <div className="mt-3 text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">{qs?.meta?.total ?? bank.total_questions ?? 0}</span> total questions
                </div>
              </div>
              <button onClick={() => setEditor({ open: true, question: null })} className="btn-primary shrink-0">
                <Plus className="w-4 h-4" /> New Question
              </button>
            </div>
          </div>

          <div className="card p-4 mb-4 flex gap-2 flex-wrap">
            <div className="flex items-center flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                placeholder="Search questions…"
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input max-w-[200px]"
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType | '')}
            >
              <option value="">All types</option>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>
              ))}
            </select>
            <select
              className="input max-w-[160px]"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as '' | 'easy' | 'medium' | 'hard')}
            >
              <option value="">All difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {qsLoading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
          ) : !qs?.data?.length ? (
            <div className="card p-12 text-center">
              <HelpCircle className="w-16 h-16 mx-auto text-slate-300 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {search || type || difficulty ? 'No matching questions' : 'No questions yet'}
              </h3>
              <p className="text-slate-500 mb-6">
                {search || type || difficulty
                  ? 'Try adjusting your filters.'
                  : 'Anza kwa kuongeza swali lako la kwanza kwenye bank hii.'}
              </p>
              {!(search || type || difficulty) && (
                <button onClick={() => setEditor({ open: true, question: null })} className="btn-primary">
                  <Plus className="w-4 h-4" /> Ongeza Swali
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {qs.data.map((q) => {
                const Icon = TYPE_ICON[q.type];
                return (
                  <div key={q.id} className="card p-4 flex items-start gap-4 hover:border-brand-300 transition">
                    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLOR[q.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLOR[q.type]}`}>
                          {QUESTION_TYPE_LABEL[q.type]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 uppercase">
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-slate-500">{q.points} pts · {q.time_limit_seconds}s</span>
                      </div>
                      <p className="text-slate-900 font-medium line-clamp-2">{q.text}</p>
                      <QuestionPreview q={q} />
                      {q.tags && q.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.tags.map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => setEditor({ open: true, question: q })}
                        className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {editor.open && (
        <QuestionEditor
          bankUuid={uuid}
          question={editor.question}
          onClose={() => setEditor({ open: false, question: null })}
          onSaved={onEditorSaved}
        />
      )}
    </div>
  );
}

function QuestionPreview({ q }: { q: Question }) {
  const correct = q.correct_answer;

  switch (q.type) {
    case 'multiple_choice':
    case 'multiple_select': {
      const opts = (q.options ?? []) as Array<{ id?: string; label?: string }>;
      const correctIds = Array.isArray(correct) ? (correct as unknown[]).map(String) : [];
      return (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {opts.slice(0, 4).map((o, i) => {
            const id = String(o.id ?? '');
            const isCorrect = correctIds.includes(id);
            return (
              <div
                key={i}
                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                  isCorrect ? 'bg-green-50 text-green-700 font-semibold' : 'bg-slate-50 text-slate-600'
                }`}
              >
                <span className="font-bold">{id}.</span> <span className="truncate">{o.label ?? ''}</span>
              </div>
            );
          })}
        </div>
      );
    }
    case 'true_false': {
      const first = Array.isArray(correct) ? correct[0] : correct;
      const isTrue = first === true || String(first).toLowerCase() === 'true';
      return (
        <div className="mt-2 text-xs">
          Correct: <span className={`font-bold ${isTrue ? 'text-green-700' : 'text-red-700'}`}>{isTrue ? 'TRUE' : 'FALSE'}</span>
        </div>
      );
    }
    case 'fill_in_blank': {
      const answers = Array.isArray(correct) ? (correct as unknown[]).map(String) : [];
      if (!answers.length) return null;
      return (
        <div className="mt-2 text-xs text-slate-600">
          Accepts: {answers.map((a) => <span key={a} className="mx-1 px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-mono">{a}</span>)}
        </div>
      );
    }
    case 'matching': {
      const opts = (q.options ?? []) as Array<{ left?: string; right?: string }>;
      return (
        <div className="mt-2 text-xs text-slate-600">
          {opts.slice(0, 3).map((p, i) => (
            <div key={i}>
              <span className="font-medium">{p.left}</span> <span className="text-slate-400">→</span> <span className="text-green-700">{p.right}</span>
            </div>
          ))}
          {opts.length > 3 && <div className="text-slate-400">+{opts.length - 3} more…</div>}
        </div>
      );
    }
    case 'short_answer': {
      const kw = (q.metadata?.accept_keywords ?? []) as unknown;
      const list = Array.isArray(kw) ? (kw as unknown[]).map(String) : [];
      if (!list.length) {
        return <div className="mt-2 text-xs text-amber-700">Manual grading required (no keywords).</div>;
      }
      return (
        <div className="mt-2 text-xs text-slate-600">
          Keywords: {list.map((k) => <span key={k} className="mx-1 px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-mono">{k}</span>)}
        </div>
      );
    }
  }
}
