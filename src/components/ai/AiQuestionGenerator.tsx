'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, Sparkles, Upload, Type, BookOpen, Loader2, Check,
  ChevronDown, ChevronUp, FileText, AlertCircle, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiApi, type AiGeneratedQuestion } from '@/lib/ai/api';
import { questionBankApi } from '@/lib/questionBank/api';
import { quizApi } from '@/lib/quiz/api';

type SourceTab = 'upload' | 'topic' | 'text';
type QType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_blank' | 'mixed';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

interface DraftQuestion extends AiGeneratedQuestion {
  _id: string;
  selected: boolean;
  expanded: boolean;
}

interface Props {
  quizUuid?: string;
  defaultBankUuid?: string;
  onClose: () => void;
  onImported: () => void;
}

const Q_TYPE_OPTS: { value: QType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
  { value: 'mixed', label: 'Mixed (All Types)' },
];

const DIFF_OPTS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed Difficulty' },
];

const COUNT_OPTS = [5, 10, 15, 20, 25, 30];

const TYPE_BADGE: Record<string, string> = {
  multiple_choice: 'bg-blue-100 text-blue-700',
  true_false: 'bg-emerald-100 text-emerald-700',
  short_answer: 'bg-navy-50 text-navy-500',
  fill_in_blank: 'bg-amber-100 text-amber-700',
};

export function AiQuestionGenerator({ quizUuid, defaultBankUuid, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<SourceTab>('topic');
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [qType, setQType] = useState<QType>('multiple_choice');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  const [bankUuid, setBankUuid] = useState(defaultBankUuid ?? '');
  const [saving, setSaving] = useState(false);

  const { data: banksResp } = useQuery({
    queryKey: ['question-banks-list'],
    queryFn: () => questionBankApi.list({ per_page: '50' }),
  });
  const banks = banksResp?.data ?? [];

  const selected = questions.filter((q) => q.selected);
  const allSelected = questions.length > 0 && selected.length === questions.length;

  async function generate() {
    if (tab === 'topic' && !topic.trim()) { toast.error('Enter a topic first'); return; }
    if (tab === 'text' && !text.trim()) { toast.error('Paste some text first'); return; }
    if (tab === 'upload' && !file) { toast.error('Upload a file first'); return; }

    setGenerating(true);
    setQuestions([]);
    try {
      let result: { questions: AiGeneratedQuestion[] };
      if (tab === 'upload' && file) {
        result = await aiApi.generateFromFile(file, { question_type: qType, count, difficulty, language });
      } else {
        result = await aiApi.generateFromText({
          source_type: tab as 'text' | 'topic',
          text: tab === 'text' ? text : undefined,
          topic: tab === 'topic' ? topic : undefined,
          question_type: qType,
          count,
          difficulty,
          language,
        });
      }
      setQuestions(
        (result.questions ?? []).map((q, i) => ({
          ...q,
          _id: `gen-${i}-${Date.now()}`,
          selected: true,
          expanded: false,
        })),
      );
      toast.success(`${result.questions?.length ?? 0} questions generated`);
    } catch {
      toast.error('AI generation failed — try a different prompt or try again');
    } finally {
      setGenerating(false);
    }
  }

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  async function saveAndAttach() {
    if (selected.length === 0) { toast.error('Select at least one question'); return; }
    if (!bankUuid) { toast.error('Select a question bank to save to'); return; }
    setSaving(true);
    try {
      const created = await Promise.all(
        selected.map((q) => {
          const validDifficulty = (['easy', 'medium', 'hard'] as const).includes(
            q.difficulty as 'easy' | 'medium' | 'hard',
          ) ? q.difficulty as 'easy' | 'medium' | 'hard' : 'medium';

          const options = q.options.map((o, idx) => ({ id: LETTERS[idx] ?? String(idx), label: o.label }));
          const correctIds = q.options
            .map((o, idx) => o.is_correct ? (LETTERS[idx] ?? String(idx)) : null)
            .filter(Boolean) as string[];
          const qtype = q.type as string;
          const correctAnswer = qtype === 'multiple_choice'
            ? correctIds.slice(0, 1)
            : qtype === 'multiple_select'
            ? correctIds
            : q.correct_answer;

          return questionBankApi.createQuestion(bankUuid, {
            text: q.text,
            type: q.type,
            options: options as never,
            correct_answer: correctAnswer,
            explanation: q.explanation,
            difficulty: validDifficulty,
            points: q.points,
            time_limit_seconds: q.time_limit_seconds,
            tags: [...(q.tags ?? []), 'ai_generated'],
          });
        }),
      );
      const ids = created.map((c) => c.id);
      if (quizUuid) {
        await quizApi.attachQuestions(quizUuid, ids);
        toast.success(`${ids.length} question${ids.length === 1 ? '' : 's'} added to quiz`);
      } else {
        toast.success(`${ids.length} question${ids.length === 1 ? '' : 's'} saved to question bank`);
      }
      onImported();
    } catch {
      toast.error('Failed to save questions — check your question bank selection');
    } finally {
      setSaving(false);
    }
  }

  function toggleAll() {
    setQuestions((qs) => qs.map((q) => ({ ...q, selected: !allSelected })));
  }

  function toggleOne(id: string) {
    setQuestions((qs) => qs.map((q) => q._id === id ? { ...q, selected: !q.selected } : q));
  }

  function toggleExpand(id: string) {
    setQuestions((qs) => qs.map((q) => q._id === id ? { ...q, expanded: !q.expanded } : q));
  }

  const canGenerate = !generating && (
    (tab === 'topic' && topic.trim().length >= 3) ||
    (tab === 'text' && text.trim().length >= 20) ||
    (tab === 'upload' && !!file)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden">

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #7c3aed 100%)' }}
          className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">AI Question Generator</h2>
              <p className="text-navy-500 text-xs">Generate MCQs, Exams & Assignments from any source</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">

          {/* ── Left — Config ── */}
          <div className="p-6 space-y-5">

            {/* Source tabs */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Source</div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {([
                  { key: 'topic', label: 'By Topic', icon: <Type className="w-3.5 h-3.5" /> },
                  { key: 'text',  label: 'Paste Text', icon: <BookOpen className="w-3.5 h-3.5" /> },
                  { key: 'upload', label: 'Upload File', icon: <Upload className="w-3.5 h-3.5" /> },
                ] as const).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition ${
                      tab === key ? 'bg-white shadow text-navy-500' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source input */}
            {tab === 'topic' && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Topic or Subject
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-navy-300 focus:border-navy-200 outline-none transition"
                  placeholder="e.g. SUMIFS function in Excel, IFRS 9 Financial Instruments, ERP Module Configuration..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            )}

            {tab === 'text' && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Paste Your Notes
                </label>
                <textarea
                  rows={7}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-navy-300 focus:border-navy-200 outline-none transition resize-none"
                  placeholder="Paste lecture notes, textbook excerpts, course content, or any text here…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="text-right text-xs text-slate-400 mt-1">{text.length} chars</div>
              </div>
            )}

            {tab === 'upload' && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Upload File
                </label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition ${
                    file ? 'border-navy-200 bg-navy-50' : 'border-slate-300 hover:border-navy-200 hover:bg-slate-50'
                  }`}
                >
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-navy-500" />
                      <div className="text-sm font-bold text-navy-500">{file.name}</div>
                      <div className="text-xs text-navy-500">{(file.size / 1024).toFixed(0)} KB · Click to change</div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400" />
                      <div className="text-sm font-semibold text-slate-600">Drop PDF, PowerPoint, or Excel here</div>
                      <div className="text-xs text-slate-400">.pdf · .pptx · .xlsx · .docx</div>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.pptx,.ppt,.xlsx,.xls,.docx,.doc"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {/* Config grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Question Type</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-navy-300 outline-none"
                  value={qType}
                  onChange={(e) => setQType(e.target.value as QType)}
                >
                  {Q_TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Count</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-navy-300 outline-none"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {COUNT_OPTS.map((n) => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Difficulty</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-navy-300 outline-none"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  {DIFF_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Language</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-navy-300 outline-none"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'sw')}
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!canGenerate}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canGenerate ? 'linear-gradient(135deg, #4338ca, #7c3aed)' : undefined, backgroundColor: canGenerate ? undefined : '#e2e8f0', color: canGenerate ? 'white' : '#94a3b8' }}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating…' : 'Generate Questions'}
            </button>

            {/* Model note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-navy-50 border border-navy-200">
              <AlertCircle className="w-4 h-4 text-navy-500 shrink-0 mt-0.5" />
              <p className="text-xs text-navy-500 leading-relaxed">
                Questions are AI-generated and may need review. Always verify accuracy before publishing.
              </p>
            </div>
          </div>

          {/* ── Right — Preview ── */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Generated Questions {questions.length > 0 && `(${selected.length} / ${questions.length} selected)`}
              </div>
              {questions.length > 0 && (
                <button onClick={toggleAll} className="text-xs font-bold text-navy-500 hover:text-navy-500">
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                {generating ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4 animate-pulse">
                      <Sparkles className="w-8 h-8 text-navy-500" />
                    </div>
                    <p className="font-bold text-slate-700">AI is generating questions…</p>
                    <p className="text-sm text-slate-400 mt-1">This may take 10–30 seconds</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-600">Questions will appear here</p>
                    <p className="text-sm text-slate-400 mt-1">Configure your source and click Generate</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-96 lg:max-h-none">
                {questions.map((q) => (
                  <div
                    key={q._id}
                    className={`border rounded-xl transition ${
                      q.selected ? 'border-navy-200 bg-navy-50/50' : 'border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <button
                        onClick={() => toggleOne(q._id)}
                        className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition border-2 ${
                          q.selected ? 'bg-navy-50 border-navy-200' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {q.selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${TYPE_BADGE[q.type] ?? 'bg-slate-100 text-slate-600'}`}>
                            {q.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{q.difficulty}</span>
                          <span className="text-[10px] text-slate-400">{q.points} pts · {q.time_limit_seconds}s</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{q.text}</p>
                      </div>
                      <button
                        onClick={() => toggleExpand(q._id)}
                        className="shrink-0 p-1 text-slate-400 hover:text-slate-600"
                      >
                        {q.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {q.expanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {q.type === 'multiple_choice' && q.options?.length > 0 && (
                          <div className="space-y-1">
                            {q.options.map((o, i) => (
                              <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                                o.is_correct ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-white text-slate-600'
                              }`}>
                                {o.is_correct
                                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                                {o.label}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === 'true_false' && (
                          <div className="text-xs text-slate-600 bg-white p-2 rounded-lg">
                            Correct answer: <strong>{String(q.correct_answer)}</strong>
                          </div>
                        )}
                        {(q.type === 'short_answer' || q.type === 'fill_in_blank') && q.correct_answer != null && (
                          <div className="text-xs text-slate-600 bg-white p-2 rounded-lg">
                            Expected: <strong>{String(q.correct_answer)}</strong>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg leading-relaxed">
                            <span className="font-bold">Explanation: </span>{q.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Save controls */}
            {questions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                {!defaultBankUuid && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Save to Question Bank
                    </label>
                    <select
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-navy-300 outline-none"
                      value={bankUuid}
                      onChange={(e) => setBankUuid(e.target.value)}
                    >
                      <option value="">— Select a question bank —</option>
                      {banks.map((b) => (
                        <option key={b.uuid} value={b.uuid}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={saveAndAttach}
                  disabled={saving || selected.length === 0 || !bankUuid}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-white font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? 'Saving…' : quizUuid
                    ? `Import ${selected.length} Question${selected.length === 1 ? '' : 's'} to Quiz`
                    : `Save ${selected.length} Question${selected.length === 1 ? '' : 's'} to Bank`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
