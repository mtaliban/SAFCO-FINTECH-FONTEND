'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen, GraduationCap, Clock, Tag, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES, CATEGORY_LABEL, LEVELS, courseApi, instructorApi, type Category, type Level } from '@/lib/course/api';

const CATEGORY_ICON: Record<string, string> = {
  excel: '📊', power_query: '🔄', power_bi: '📈', accounting: '🏦',
  finance: '💰', ifrs: '📋', erp_systems: '⚙️', coding: '💻',
  data_analytics: '🔬', microsoft_office: '💼', general: '📚',
};

const LEVEL_META: Record<string, { emoji: string; desc: string }> = {
  beginner:     { emoji: '🌱', desc: 'Hakuna uzoefu unaohitajika' },
  intermediate: { emoji: '📈', desc: 'Uzoefu wa msingi unahitajika' },
  advanced:     { emoji: '🚀', desc: 'Uzoefu mkubwa unahitajika' },
  expert:       { emoji: '⚡', desc: 'Wataalamu pekee' },
};

type FormData = {
  title: string;
  description?: string;
  category: Category;
  level: Level;
  duration_hours?: number;
  instructor_uuid?: string;
};

const STEPS = [
  'Taarifa za Msingi',
  'Ongeza Modules',
  'Ongeza Lessons',
  'Pakia Maudhui',
  'Ongeza Assignments',
  'Submit kwa Ukaguzi',
];

export default function NewCoursePage() {
  const router = useRouter();
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorApi.list(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: { category: 'excel', level: 'beginner', duration_hours: 10 },
  });

  const selectedCategory = watch('category');
  const selectedLevel    = watch('level');

  async function onSubmit(data: FormData) {
    try {
      const c = await courseApi.create(data);
      toast.success('Course imetengenezwa! Ongeza modules na lessons sasa.');
      router.push(`/trainer/courses/${c.uuid}/edit`);
    } catch { /* handled by interceptor */ }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tengeneza Course Mpya</h1>
          <p className="text-slate-500 text-sm">Hatua ya 1 ya 6 — Anza na taarifa za msingi za course yako</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          <form id="create-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Title + Description */}
            <div className="card p-6">
              <h2 className="font-bold text-slate-900 mb-0.5 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                <Tag className="w-3.5 h-3.5" /> Kichwa na Maelezo
              </h2>
              <p className="text-xs text-slate-400 mb-4">Jina zuri linawavutia wanafunzi — liwe wazi na la kuvutia</p>
              <input
                className="input text-base font-medium"
                placeholder="Mfano: Advanced Excel & Power Query — Kutoka Sifuri Hadi Mtaalamu"
                {...register('title', { required: 'Kichwa cha course kinahitajika' })}
              />
              {errors.title && (
                <p className="text-red-600 text-xs mt-1.5">{errors.title.message}</p>
              )}
              <label className="label mt-4">Maelezo Mafupi (optional)</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Ni mafunzo gani yanayopatikana? Mwanafunzi atajifunza nini? Ni watu wa kiwango gani wanaofaa?"
                {...register('description')}
              />
            </div>

            {/* Category */}
            <div className="card p-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Aina ya Course</h2>
              <p className="text-xs text-slate-400 mb-4">Chagua category inayofaa zaidi kwa maudhui ya course yako</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.filter((c) => c !== 'general').map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition ${
                      selectedCategory === cat
                        ? 'border-navy-500 bg-navy-50 text-navy-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{CATEGORY_ICON[cat]}</span>
                    <span className="text-xs font-semibold leading-tight">{CATEGORY_LABEL[cat]}</span>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('category')} />
            </div>

            {/* Level */}
            <div className="card p-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Kiwango cha Ugumu</h2>
              <p className="text-xs text-slate-400 mb-4">Ni watu wa uzoefu gani wanaofaa kwa course hii?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {LEVELS.map((lvl) => {
                  const meta = LEVEL_META[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setValue('level', lvl)}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center transition ${
                        selectedLevel === lvl
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{meta.emoji}</span>
                      <span className="text-xs font-bold capitalize">{lvl}</span>
                      <span className="text-[10px] text-slate-400 leading-tight">{meta.desc}</span>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register('level')} />
            </div>

            {/* Duration + Instructor */}
            <div className="card p-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Muda wa Course (masaa)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className="input"
                    placeholder="10"
                    {...register('duration_hours', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-slate-400 mt-1">Jumla ya muda wa video + masomo</p>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Instructor
                  </label>
                  <select className="input" {...register('instructor_uuid')}>
                    <option value="">— Mimi mwenyewe —</option>
                    {(instructors?.data ?? []).map((i) => (
                      <option key={i.uuid} value={i.uuid}>{i.name} ({i.email})</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Trainer atakayefundisha course hii</p>
                </div>
              </div>
            </div>
          </form>

          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              ← Rudi Nyuma
            </button>
            <button
              type="submit"
              form="create-form"
              disabled={isSubmitting}
              className="btn-primary px-8"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Inaunda...</>
                : 'Tengeneza Course →'
              }
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Step tracker */}
          <div className="card p-5 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
            <h3 className="font-bold text-orange-900 text-sm mb-4">Mchakato wa Kutengeneza Course</h3>
            <div className="space-y-2.5">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 text-xs ${
                    i === 0 ? 'text-orange-700 font-semibold' : 'text-orange-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    i === 0
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-orange-200 text-orange-300'
                  }`}>
                    {i === 0
                      ? <CheckCircle2 className="w-3 h-3" />
                      : <span className="text-[9px] font-bold">{i + 1}</span>
                    }
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card p-5 border-navy-100 bg-gradient-to-br from-navy-50 to-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-navy-600 shrink-0" />
              <h3 className="font-bold text-navy-900 text-sm">Siri za Course Nzuri</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                'Kichwa chenye nguvu kinachobainisha mada wazi',
                'Maelezo yanayoonyesha manufaa halisi ya mwanafunzi',
                'Modules zilizopangwa kwa mpangilio wa mantiki',
                'Video za ubora wa juu na PDF za kumbukumbu',
                'Mazoezi ya vitendo — si nadharia tu',
                'Quiz mwishoni mwa kila module kuthibitisha uelewa',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                  <span className="w-4 h-4 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Category chips */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Categories zinazopatikana:</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c !== 'general').map((c) => (
                <span
                  key={c}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium"
                >
                  {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
