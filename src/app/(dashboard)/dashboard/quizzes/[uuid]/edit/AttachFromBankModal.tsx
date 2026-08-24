'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X, Search, ChevronRight, ArrowLeft, Library, Shuffle, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  questionBankApi,
  QUESTION_TYPES,
  QUESTION_TYPE_LABEL,
  type QuestionType,
} from '@/lib/questionBank/api';
import { quizApi } from '@/lib/quiz/api';

interface Props {
  quizUuid: string;
  attachedQuestionUuids: Set<string>; // to disable already-attached
  onClose: () => void;
  onAttached: () => void;
}

type Step = 'pick_bank' | 'pick_questions';

export function AttachFromBankModal({ quizUuid, attachedQuestionUuids, onClose, onAttached }: Props) {
  const [step, setStep] = useState<Step>('pick_bank');
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankUuid, setSelectedBankUuid] = useState<string | null>(null);

  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: ['banks-for-attach', bankSearch],
    queryFn: () => questionBankApi.list(bankSearch ? { search: bankSearch } : {}),
    enabled: step === 'pick_bank',
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 'pick_questions' && (
              <button onClick={() => setStep('pick_bank')} className="text-slate-500 hover:text-navy-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-xl font-bold text-slate-900">
              {step === 'pick_bank' ? 'Choose a Question Bank' : 'Pick Questions'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'pick_bank' ? (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                className="input pl-10"
                placeholder="Search banks…"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
              />
            </div>

            {banksLoading ? (
              <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600" /></div>
            ) : !banks?.data?.length ? (
              <div className="p-12 text-center text-slate-500">
                <Library className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                No banks found. Create one from the Question Banks page first.
              </div>
            ) : (
              <div className="space-y-2">
                {banks.data.map((b) => (
                  <button
                    key={b.uuid}
                    onClick={() => { setSelectedBankUuid(b.uuid); setStep('pick_questions'); }}
                    className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {b.questions_count ?? b.total_questions ?? 0} questions · {b.category} · {b.difficulty}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <PickQuestions
            bankUuid={selectedBankUuid!}
            quizUuid={quizUuid}
            attachedQuestionUuids={attachedQuestionUuids}
            onAttached={onAttached}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function PickQuestions({
  bankUuid, quizUuid, attachedQuestionUuids, onAttached, onClose,
}: {
  bankUuid: string;
  quizUuid: string;
  attachedQuestionUuids: Set<string>;
  onAttached: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<QuestionType | ''>('');
  const [difficulty, setDifficulty] = useState<'' | 'easy' | 'medium' | 'hard'>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [randomCount, setRandomCount] = useState<number>(5);

  const { data: qs, isLoading } = useQuery({
    queryKey: ['bank-questions-for-attach', bankUuid, search, type, difficulty],
    queryFn: () => questionBankApi.listQuestions(bankUuid, {
      per_page: '100',
      ...(search ? { search } : {}),
      ...(type ? { type } : {}),
      ...(difficulty ? { difficulty } : {}),
    }),
  });

  const attachableUuids = useMemo(
    () => (qs?.data ?? []).filter((q) => !attachedQuestionUuids.has(q.id)).map((q) => q.id),
    [qs, attachedQuestionUuids],
  );

  function toggle(uuid: string) {
    const next = new Set(selected);
    next.has(uuid) ? next.delete(uuid) : next.add(uuid);
    setSelected(next);
  }
  function selectAllVisible() {
    setSelected(new Set([...selected, ...attachableUuids]));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  async function attachSelected() {
    if (!selected.size) { toast.error('Pick at least one question.'); return; }
    setBusy(true);
    try {
      const res = await quizApi.attachQuestions(quizUuid, [...selected]);
      toast.success(`${res.attached} question(s) attached (total: ${res.total_questions})`);
      onAttached();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Attach failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function attachRandom() {
    setBusy(true);
    try {
      const res = await quizApi.attachRandom(quizUuid, bankUuid, Number(randomCount), {
        ...(type ? { type } : {}),
        ...(difficulty ? { difficulty } : {}),
      });
      if (res.attached === 0) {
        toast.error(`No matching questions available to attach (requested ${res.requested}).`);
      } else if (res.attached < res.requested) {
        toast.success(`Attached ${res.attached} of ${res.requested} random (bank exhausted or filter narrow).`);
      } else {
        toast.success(`${res.attached} random question(s) attached.`);
      }
      onAttached();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Attach failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input className="input pl-10" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input max-w-[200px]" value={type} onChange={(e) => setType(e.target.value as QuestionType | '')}>
            <option value="">All types</option>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>)}
          </select>
          <select className="input max-w-[140px]" value={difficulty} onChange={(e) => setDifficulty(e.target.value as '' | 'easy' | 'medium' | 'hard')}>
            <option value="">All difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <button onClick={selectAllVisible} className="text-brand-600 hover:text-brand-700 font-semibold">
              Select all ({attachableUuids.length})
            </button>
            {selected.size > 0 && (
              <>
                <span>·</span>
                <button onClick={clearSelection} className="text-slate-500 hover:text-slate-700">
                  Clear ({selected.size})
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={200} value={randomCount}
              onChange={(e) => setRandomCount(Number(e.target.value))}
              className="input w-20 py-1.5 text-sm"
            />
            <button onClick={attachRandom} disabled={busy} className="btn-secondary text-sm">
              <Shuffle className="w-4 h-4" /> Random
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600" /></div>
        ) : !qs?.data?.length ? (
          <div className="p-12 text-center text-slate-500">No questions match your filters.</div>
        ) : (
          <div className="space-y-2">
            {qs.data.map((q) => {
              const alreadyAttached = attachedQuestionUuids.has(q.id);
              const isSel = selected.has(q.id);
              return (
                <label
                  key={q.id}
                  className={`p-3 rounded-lg border-2 flex items-start gap-3 transition ${
                    alreadyAttached
                      ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                      : isSel
                      ? 'border-brand-500 bg-brand-50 cursor-pointer'
                      : 'border-slate-200 hover:border-brand-300 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 mt-0.5"
                    checked={alreadyAttached || isSel}
                    disabled={alreadyAttached}
                    onChange={() => toggle(q.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                        {QUESTION_TYPE_LABEL[q.type]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 uppercase">
                        {q.difficulty}
                      </span>
                      <span className="text-xs text-slate-500">{q.points} pts</span>
                      {alreadyAttached && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
                          ✓ Already in quiz
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-900 line-clamp-2">{q.text}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-6 py-3 flex justify-between items-center bg-slate-50">
        <div className="text-sm text-slate-600">
          {selected.size > 0 ? (
            <span><span className="font-bold text-brand-700">{selected.size}</span> selected</span>
          ) : (
            <span className="text-slate-500">Select questions or use Random to auto-pick.</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={attachSelected} disabled={busy || !selected.size} className="btn-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><CheckSquare className="w-4 h-4" /> Attach {selected.size || ''}</>)}
          </button>
        </div>
      </div>
    </>
  );
}
