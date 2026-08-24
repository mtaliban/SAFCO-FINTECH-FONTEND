'use client';

import { GraduationCap, ShieldAlert, Lock, Video } from 'lucide-react';
import type { AntiCheatSettings, ExamType, QuizFormPayload } from '@/lib/quiz/api';

interface Props {
  value: Partial<QuizFormPayload>;
  onChange: (patch: Partial<QuizFormPayload>) => void;
}

/**
 * SRS Module 8 — Examination System fields.
 * Shown only when mode='exam'. Sets exam_type + anti-cheat rules.
 * Final Certification forces max_attempts=1.
 */
export function ExamSection({ value, onChange }: Props) {
  if (value.mode !== 'exam') return null;

  const examType: ExamType = (value.exam_type as ExamType) ?? 'practice';
  const ac: AntiCheatSettings = value.anti_cheat_settings ?? {};

  function setExamType(t: ExamType) {
    const patch: Partial<QuizFormPayload> = { exam_type: t };
    if (t === 'final_certification') patch.max_attempts = 1;
    if (t === 'practice') patch.max_attempts = value.max_attempts ?? 999;
    onChange(patch);
  }

  function setAC(patch: Partial<AntiCheatSettings>) {
    onChange({ anti_cheat_settings: { ...ac, ...patch } });
  }

  return (
    <>
      {/* -------- Exam Type -------- */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900">Examination Type</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <ExamCard
            selected={examType === 'practice'}
            onClick={() => setExamType('practice')}
            title="Practice Test"
            subtitle="Unlimited attempts"
            desc="Learners rehearse freely. Correct answers shown after submission."
            color="emerald"
          />
          <ExamCard
            selected={examType === 'mock'}
            onClick={() => setExamType('mock')}
            title="Mock Exam"
            subtitle="Limited attempts"
            desc="Simulates the real exam. Configurable max attempts (see Grading)."
            color="amber"
          />
          <ExamCard
            selected={examType === 'final_certification'}
            onClick={() => setExamType('final_certification')}
            title="Final Certification"
            subtitle="Single attempt · locked"
            desc="Real exam. Only one attempt allowed. Certificate on pass."
            color="red"
          />
        </div>

        {examType === 'final_certification' && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <Lock className="w-4 h-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              Final Certification is locked to <strong>1 attempt</strong>. Max Attempts field in Grading has no effect.
            </div>
          </div>
        )}
      </div>

      {/* -------- Anti-Cheat -------- */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900">Anti-Cheating</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <CheckRow
            label="Browser Lock"
            hint="Enforce fullscreen; block exiting during exam."
            checked={!!ac.browser_lock}
            onChange={(v) => setAC({ browser_lock: v })}
          />
          <CheckRow
            label="Disable Copy / Paste"
            hint="Block Ctrl+C, Ctrl+V, and clipboard events on the exam page."
            checked={!!ac.disable_copy_paste}
            onChange={(v) => setAC({ disable_copy_paste: v })}
          />
          <CheckRow
            label="Disable Right-Click"
            hint="Block context menu that could expose Inspect / Copy Image."
            checked={!!ac.disable_right_click}
            onChange={(v) => setAC({ disable_right_click: v })}
          />
          <div className="p-3 rounded-lg border border-slate-200 opacity-60">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Video className="w-4 h-4" /> Webcam Monitoring
              <span className="ml-auto text-[10px] font-bold uppercase text-amber-600">Coming soon</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Live proctoring with webcam feed (Future — SRS deferred).
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="label">Tab-Switch Limit</label>
            <input
              type="number" min={0} max={20} className="input"
              value={ac.tab_switch_limit ?? 0}
              onChange={(e) => setAC({ tab_switch_limit: Number(e.target.value) })}
            />
            <p className="help">Show warning when the learner switches tabs this many times.</p>
          </div>
          <div>
            <label className="label">Max Total Violations (auto-submit)</label>
            <input
              type="number" min={0} max={20} className="input"
              value={ac.max_violations ?? 0}
              onChange={(e) => setAC({ max_violations: Number(e.target.value) })}
            />
            <p className="help">Auto-submit the exam once this many violations logged. 0 = no auto-submit.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function ExamCard({
  selected, onClick, title, subtitle, desc, color,
}: {
  selected: boolean; onClick: () => void; title: string; subtitle: string; desc: string;
  color: 'emerald' | 'amber' | 'red';
}) {
  const tone: Record<typeof color, { border: string; bg: string; text: string }> = {
    emerald: { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    amber: { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
    red: { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700' },
  };
  const t = tone[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-lg border-2 text-left transition ${
        selected ? `${t.border} ${t.bg}` : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      <div className={`font-bold ${selected ? t.text : 'text-slate-900'}`}>{title}</div>
      <div className={`text-xs mt-0.5 font-semibold uppercase ${selected ? t.text : 'text-slate-500'}`}>{subtitle}</div>
      <div className="text-xs text-slate-600 mt-2 leading-relaxed">{desc}</div>
    </button>
  );
}

function CheckRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-300 cursor-pointer">
      <input type="checkbox" className="w-5 h-5 mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
      </div>
    </label>
  );
}
