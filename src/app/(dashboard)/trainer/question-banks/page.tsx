'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Library, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { questionBankApi } from '@/lib/questionBank/api';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '@/lib/course/api';

export default function QuestionBanksPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['question-banks', search, category],
    queryFn: () => questionBankApi.list({ ...(search ? { search } : {}), ...(category ? { category } : {}) }),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Library className="w-7 h-7 text-orange-500" /> Question Banks
          </h1>
          <p className="text-slate-600 mt-1">Collections of reusable questions (SRS Module 5).</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Bank
        </button>
      </div>

      <div className="card p-4 mb-4 flex gap-2 flex-wrap">
        <div className="flex items-center flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search banks by name…"
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input max-w-[200px]"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | '')}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : !data?.data?.length ? (
        <div className="card p-12 text-center">
          <Library className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No banks yet</h3>
          <p className="text-slate-500 mb-6">Anza kwa kutengeneza bank yako ya kwanza.</p>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Tengeneza Bank
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((b) => (
            <Link key={b.uuid} href={`/trainer/question-banks/${b.uuid}`} className="card p-5 hover:shadow-md hover:border-brand-300 transition">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-brand-100 text-brand-700 capitalize">
                  {CATEGORY_LABEL[b.category as keyof typeof CATEGORY_LABEL] ?? b.category}
                </span>
                <span className="text-xs text-slate-500 uppercase font-semibold">{b.difficulty}</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{b.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-3 min-h-[2.5rem]">{b.description ?? ' '}</p>
              <div className="text-sm text-slate-600 font-semibold">
                {b.questions_count ?? b.total_questions ?? 0} questions
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && <NewBankModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewBankModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<{ name: string; description: string; category: Category; difficulty: string }>({
    name: '',
    description: '',
    category: 'excel',
    difficulty: 'beginner',
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!f.name.trim()) return;
    setBusy(true);
    try {
      const b = await questionBankApi.create(f);
      toast.success('Bank imetengenezwa!');
      qc.invalidateQueries({ queryKey: ['question-banks'] });
      window.location.href = `/trainer/question-banks/${b.uuid}`;
    } catch { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">New Question Bank</h3>
        <div className="space-y-4">
          <div><label className="label">Name *</label>
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Excel Basics Bank" />
          </div>
          <div><label className="label">Description</label>
            <textarea rows={2} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label>
              <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <div><label className="label">Difficulty</label>
              <select className="input" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>
                {['beginner','intermediate','advanced','expert'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={busy} className="btn-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Bank'}
          </button>
        </div>
      </div>
    </div>
  );
}
