'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  questionBankApi,
  QUESTION_TYPES,
  QUESTION_TYPE_LABEL,
  type Question,
  type QuestionType,
} from '@/lib/questionBank/api';

type EditorForm = {
  type: QuestionType;
  text: string;
  explanation: string;
  points: number;
  time_limit_seconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  // Multiple choice / multiple select / true false
  choiceOptions: { id: string; label: string }[];
  correctSingle: string;          // MC + TF
  correctMulti: string[];         // MS
  // Fill in blank
  acceptableAnswers: string[];    // FIB
  // Matching
  pairs: { left: string; right: string }[];
  // Short answer
  keywords: string[];             // SA metadata.accept_keywords
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyForm(type: QuestionType = 'multiple_choice'): EditorForm {
  const base: EditorForm = {
    type,
    text: '',
    explanation: '',
    points: 100,
    time_limit_seconds: 30,
    difficulty: 'medium',
    tags: '',
    choiceOptions: [
      { id: 'A', label: '' },
      { id: 'B', label: '' },
    ],
    correctSingle: 'A',
    correctMulti: [],
    acceptableAnswers: [''],
    pairs: [{ left: '', right: '' }, { left: '', right: '' }],
    keywords: [],
  };
  if (type === 'true_false') {
    base.choiceOptions = [
      { id: 'true', label: 'True' },
      { id: 'false', label: 'False' },
    ];
    base.correctSingle = 'true';
  }
  return base;
}

function fromExisting(q: Question): EditorForm {
  const f = emptyForm(q.type);
  f.text = q.text ?? '';
  f.explanation = q.explanation ?? '';
  f.points = q.points ?? 100;
  f.time_limit_seconds = q.time_limit_seconds ?? 30;
  f.difficulty = (q.difficulty as EditorForm['difficulty']) ?? 'medium';
  f.tags = (q.tags ?? []).join(', ');

  const opts = (q.options ?? []) as unknown as Array<Record<string, unknown>>;

  switch (q.type) {
    case 'multiple_choice': {
      f.choiceOptions = opts.length
        ? opts.map((o, i) => ({ id: String(o.id ?? LETTERS[i]), label: String(o.label ?? '') }))
        : f.choiceOptions;
      const c = q.correct_answer;
      f.correctSingle = Array.isArray(c) ? String(c[0] ?? f.choiceOptions[0]?.id ?? 'A') : String(c ?? 'A');
      break;
    }
    case 'true_false': {
      const c = q.correct_answer;
      const first = Array.isArray(c) ? c[0] : c;
      const b = first === true || String(first).toLowerCase() === 'true';
      f.correctSingle = b ? 'true' : 'false';
      break;
    }
    case 'multiple_select': {
      f.choiceOptions = opts.length
        ? opts.map((o, i) => ({ id: String(o.id ?? LETTERS[i]), label: String(o.label ?? '') }))
        : f.choiceOptions;
      f.correctMulti = Array.isArray(q.correct_answer) ? (q.correct_answer as unknown[]).map(String) : [];
      break;
    }
    case 'fill_in_blank': {
      const c = q.correct_answer;
      f.acceptableAnswers = Array.isArray(c) && c.length ? (c as unknown[]).map(String) : [''];
      break;
    }
    case 'matching': {
      f.pairs = opts.length
        ? opts.map((o) => ({ left: String(o.left ?? ''), right: String(o.right ?? '') }))
        : f.pairs;
      break;
    }
    case 'short_answer': {
      const kw = (q.metadata?.accept_keywords ?? []) as unknown;
      f.keywords = Array.isArray(kw) ? (kw as unknown[]).map(String) : [];
      break;
    }
  }
  return f;
}

function buildPayload(f: EditorForm): Partial<Question> {
  const base: Partial<Question> = {
    type: f.type,
    text: f.text.trim(),
    explanation: f.explanation.trim() || null,
    points: Number(f.points) || 0,
    time_limit_seconds: Number(f.time_limit_seconds),
    difficulty: f.difficulty,
    tags: f.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };

  switch (f.type) {
    case 'multiple_choice': {
      const options = f.choiceOptions
        .filter((o) => o.label.trim())
        .map((o, i) => ({ id: LETTERS[i], label: o.label.trim() }));
      return {
        ...base,
        options: options as unknown as Question['options'],
        correct_answer: [f.correctSingle],
      };
    }
    case 'true_false': {
      const options = [
        { id: 'true', label: 'True' },
        { id: 'false', label: 'False' },
      ];
      return {
        ...base,
        options: options as unknown as Question['options'],
        correct_answer: [f.correctSingle === 'true'],
      };
    }
    case 'multiple_select': {
      const options = f.choiceOptions
        .filter((o) => o.label.trim())
        .map((o, i) => ({ id: LETTERS[i], label: o.label.trim() }));
      return {
        ...base,
        options: options as unknown as Question['options'],
        correct_answer: f.correctMulti,
      };
    }
    case 'fill_in_blank': {
      const answers = f.acceptableAnswers.map((a) => a.trim()).filter(Boolean);
      return {
        ...base,
        options: null,
        correct_answer: answers,
      };
    }
    case 'matching': {
      const pairs = f.pairs.filter((p) => p.left.trim() && p.right.trim());
      const options = pairs.map((p, i) => ({ id: String(i + 1), left: p.left.trim(), right: p.right.trim() }));
      const correct: Record<string, string> = {};
      pairs.forEach((p) => { correct[p.left.trim()] = p.right.trim(); });
      return {
        ...base,
        options: options as unknown as Question['options'],
        correct_answer: correct as unknown as Question['correct_answer'],
      };
    }
    case 'short_answer': {
      const kw = f.keywords.map((k) => k.trim()).filter(Boolean);
      return {
        ...base,
        options: null,
        correct_answer: null,
        metadata: kw.length ? { accept_keywords: kw } : null,
      };
    }
  }
}

function validate(f: EditorForm): string | null {
  if (!f.text.trim()) return 'Question text is required.';
  return null;
}

interface Props {
  bankUuid: string;
  question: Question | null; // null → create
  onClose: () => void;
  onSaved: () => void;
}

export function QuestionEditor({ bankUuid, question, onClose, onSaved }: Props) {
  const [f, setF] = useState<EditorForm>(() =>
    question ? fromExisting(question) : emptyForm(),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF(question ? fromExisting(question) : emptyForm());
  }, [question]);

  function updateType(next: QuestionType) {
    setF((prev) => {
      const empty = emptyForm(next);
      // Preserve shared fields
      empty.text = prev.text;
      empty.explanation = prev.explanation;
      empty.points = prev.points;
      empty.time_limit_seconds = prev.time_limit_seconds;
      empty.difficulty = prev.difficulty;
      empty.tags = prev.tags;
      return empty;
    });
  }

  async function save() {
    const err = validate(f);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const payload = buildPayload(f);
      if (question) {
        await questionBankApi.updateQuestion(question.id, payload);
        toast.success('Question updated');
      } else {
        await questionBankApi.createQuestion(bankUuid, payload);
        toast.success('Question added');
      }
      onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-900">
            {question ? 'Edit Question' : 'New Question'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="label">Type *</label>
            <select
              className="input"
              value={f.type}
              onChange={(e) => updateType(e.target.value as QuestionType)}
              disabled={!!question}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>
              ))}
            </select>
            {question && <p className="text-xs text-slate-500 mt-1">Type cannot be changed after creation.</p>}
          </div>

          <div>
            <label className="label">Question text *</label>
            <textarea
              rows={3}
              className="input"
              placeholder="What is 2 + 2?"
              value={f.text}
              onChange={(e) => setF({ ...f, text: e.target.value })}
            />
            {f.type === 'fill_in_blank' && (
              <p className="text-xs text-slate-500 mt-1">
                Tip: Use <code className="bg-slate-100 px-1 rounded">___</code> to mark the blank in your question.
              </p>
            )}
          </div>

          <TypeFields f={f} setF={setF} />

          <div>
            <label className="label">Explanation (shown after answer)</label>
            <textarea
              rows={2}
              className="input"
              placeholder="Optional: explain why the correct answer is correct."
              value={f.explanation}
              onChange={(e) => setF({ ...f, explanation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Points</label>
              <input
                type="number"
                min={0}
                max={10000}
                className="input"
                value={f.points}
                onChange={(e) => setF({ ...f, points: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Time limit (s)</label>
              <select
                className="input"
                value={f.time_limit_seconds}
                onChange={(e) => setF({ ...f, time_limit_seconds: Number(e.target.value) })}
              >
                {[5, 10, 15, 20, 30, 45, 60, 90, 120, 240].map((s) => (
                  <option key={s} value={s}>{s}s</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select
                className="input"
                value={f.difficulty}
                onChange={(e) => setF({ ...f, difficulty: e.target.value as EditorForm['difficulty'] })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              className="input"
              placeholder="excel, vlookup, formulas"
              value={f.tags}
              onChange={(e) => setF({ ...f, tags: e.target.value })}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={busy} className="btn-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : question ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeFields({ f, setF }: { f: EditorForm; setF: (v: EditorForm) => void }) {
  switch (f.type) {
    case 'multiple_choice':
      return <ChoiceFields f={f} setF={setF} mode="single" />;
    case 'true_false':
      return <TrueFalseFields f={f} setF={setF} />;
    case 'multiple_select':
      return <ChoiceFields f={f} setF={setF} mode="multi" />;
    case 'fill_in_blank':
      return <FillBlankFields f={f} setF={setF} />;
    case 'matching':
      return <MatchingFields f={f} setF={setF} />;
    case 'short_answer':
      return <ShortAnswerFields f={f} setF={setF} />;
  }
}

function ChoiceFields({ f, setF, mode }: { f: EditorForm; setF: (v: EditorForm) => void; mode: 'single' | 'multi' }) {
  const opts = f.choiceOptions;
  const ids = useMemo(() => opts.map((_, i) => LETTERS[i]), [opts]);

  function update(i: number, label: string) {
    const next = opts.map((o, idx) => (idx === i ? { ...o, label } : o));
    setF({ ...f, choiceOptions: next });
  }
  function addOne() {
    if (opts.length >= 6) return;
    const nextIdx = opts.length;
    setF({ ...f, choiceOptions: [...opts, { id: LETTERS[nextIdx], label: '' }] });
  }
  function removeOne(i: number) {
    if (opts.length <= 2) return;
    const removedId = ids[i];
    const next = opts.filter((_, idx) => idx !== i).map((o, idx) => ({ ...o, id: LETTERS[idx] }));
    let correctSingle = f.correctSingle;
    let correctMulti = f.correctMulti;
    if (mode === 'single' && correctSingle === removedId) correctSingle = 'A';
    if (mode === 'multi') correctMulti = correctMulti.filter((id) => id !== removedId);
    setF({ ...f, choiceOptions: next, correctSingle, correctMulti });
  }

  return (
    <div>
      <label className="label">Options {mode === 'single' ? '(pick one correct)' : '(pick all correct)'} *</label>
      <div className="space-y-2">
        {opts.map((o, i) => {
          const id = ids[i];
          const isCorrect = mode === 'single' ? f.correctSingle === id : f.correctMulti.includes(id);
          return (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border-2 transition ${isCorrect ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
              <input
                type={mode === 'single' ? 'radio' : 'checkbox'}
                name="correct-choice"
                className="w-5 h-5"
                checked={isCorrect}
                onChange={() => {
                  if (mode === 'single') setF({ ...f, correctSingle: id });
                  else {
                    const has = f.correctMulti.includes(id);
                    const next = has ? f.correctMulti.filter((x) => x !== id) : [...f.correctMulti, id];
                    setF({ ...f, correctMulti: next });
                  }
                }}
              />
              <span className="w-6 text-center font-bold text-slate-600">{id}</span>
              <input
                className="input flex-1"
                placeholder={`Option ${id}`}
                value={o.label}
                onChange={(e) => update(i, e.target.value)}
              />
              <button
                onClick={() => removeOne(i)}
                disabled={opts.length <= 2}
                className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30"
                title="Remove option"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      {opts.length < 6 && (
        <button onClick={addOne} type="button" className="mt-2 text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add option
        </button>
      )}
    </div>
  );
}

function TrueFalseFields({ f, setF }: { f: EditorForm; setF: (v: EditorForm) => void }) {
  return (
    <div>
      <label className="label">Correct answer *</label>
      <div className="grid grid-cols-2 gap-3">
        {(['true', 'false'] as const).map((v) => (
          <label
            key={v}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition font-bold ${
              f.correctSingle === v
                ? v === 'true' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                : 'border-slate-200 text-slate-500'
            }`}
          >
            <input
              type="radio"
              name="tf-correct"
              checked={f.correctSingle === v}
              onChange={() => setF({ ...f, correctSingle: v })}
              className="sr-only"
            />
            {v === 'true' ? 'TRUE' : 'FALSE'}
          </label>
        ))}
      </div>
    </div>
  );
}

function FillBlankFields({ f, setF }: { f: EditorForm; setF: (v: EditorForm) => void }) {
  const answers = f.acceptableAnswers;
  function update(i: number, val: string) {
    setF({ ...f, acceptableAnswers: answers.map((a, idx) => (idx === i ? val : a)) });
  }
  function add() { setF({ ...f, acceptableAnswers: [...answers, ''] }); }
  function remove(i: number) {
    if (answers.length <= 1) return;
    setF({ ...f, acceptableAnswers: answers.filter((_, idx) => idx !== i) });
  }
  return (
    <div>
      <label className="label">Acceptable answers * (case-insensitive; any match = correct)</label>
      <div className="space-y-2">
        {answers.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input flex-1"
              placeholder={i === 0 ? 'e.g. VLOOKUP' : 'Alternative spelling / synonym'}
              value={a}
              onChange={(e) => update(i, e.target.value)}
            />
            <button
              onClick={() => remove(i)}
              disabled={answers.length <= 1}
              className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} type="button" className="mt-2 text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
        <Plus className="w-4 h-4" /> Add alternative
      </button>
    </div>
  );
}

function MatchingFields({ f, setF }: { f: EditorForm; setF: (v: EditorForm) => void }) {
  const pairs = f.pairs;
  function update(i: number, side: 'left' | 'right', val: string) {
    setF({ ...f, pairs: pairs.map((p, idx) => (idx === i ? { ...p, [side]: val } : p)) });
  }
  function add() { setF({ ...f, pairs: [...pairs, { left: '', right: '' }] }); }
  function remove(i: number) {
    if (pairs.length <= 2) return;
    setF({ ...f, pairs: pairs.filter((_, idx) => idx !== i) });
  }
  return (
    <div>
      <label className="label">Matching pairs * (student matches left → right)</label>
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input flex-1"
              placeholder="Left (prompt)"
              value={p.left}
              onChange={(e) => update(i, 'left', e.target.value)}
            />
            <span className="text-slate-400">→</span>
            <input
              className="input flex-1"
              placeholder="Right (match)"
              value={p.right}
              onChange={(e) => update(i, 'right', e.target.value)}
            />
            <button
              onClick={() => remove(i)}
              disabled={pairs.length <= 2}
              className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30"
              title="Remove pair"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} type="button" className="mt-2 text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
        <Plus className="w-4 h-4" /> Add pair
      </button>
    </div>
  );
}

function ShortAnswerFields({ f, setF }: { f: EditorForm; setF: (v: EditorForm) => void }) {
  const [input, setInput] = useState('');
  const kw = f.keywords;
  function add() {
    const v = input.trim();
    if (!v || kw.includes(v)) { setInput(''); return; }
    setF({ ...f, keywords: [...kw, v] });
    setInput('');
  }
  function remove(w: string) {
    setF({ ...f, keywords: kw.filter((x) => x !== w) });
  }
  return (
    <div>
      <label className="label">Auto-grade keywords (optional)</label>
      <p className="text-xs text-slate-500 mb-2">
        If any keyword is found in the student's response (case-insensitive), it will auto-mark as correct.
        Leave empty to require manual grading.
      </p>
      <div className="flex gap-2 mb-2">
        <input
          className="input flex-1"
          placeholder="Enter a keyword and press Add"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button onClick={add} type="button" className="btn-secondary">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {kw.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {kw.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
              {w}
              <button onClick={() => remove(w)} className="text-brand-500 hover:text-brand-800">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
