'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Globe, Shield, Zap, BookOpen, Bell,
  Save, RotateCcw, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi, type SystemSetting, type SettingsGrouped } from '@/lib/admin/settingsApi';

type Group = 'general' | 'user_policy' | 'quiz' | 'course' | 'notifications';

const TABS: { key: Group; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'general',       label: 'General',          icon: Globe,    desc: 'Site name, timezone, maintenance mode' },
  { key: 'user_policy',   label: 'User Policies',    icon: Shield,   desc: 'Login rules, session, verification' },
  { key: 'quiz',          label: 'Quizzes',          icon: Zap,      desc: 'Default pass score, attempts, retakes' },
  { key: 'course',        label: 'Courses',          icon: BookOpen, desc: 'Approval, enrollment, certificates' },
  { key: 'notifications', label: 'Notifications',    icon: Bell,     desc: 'Email, SMS, digest settings' },
];

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<Group>('general');
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [initialised, setInitialised] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: settingsApi.all,
  });

  // Seed local state once on first load
  if (data && !initialised) {
    const init: Record<string, string> = {};
    Object.values(data).flat().forEach((s) => { init[s.key] = s.value ?? ''; });
    setLocalValues(init);
    setInitialised(true);
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = {};
      dirty.forEach((key) => { payload[key] = localValues[key] ?? ''; });
      return settingsApi.update(payload);
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
      setDirty(new Set());
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const resetMut = useMutation({
    mutationFn: (key: string) => settingsApi.reset(key),
    onSuccess: (updated, key) => {
      toast.success(`"${key}" reset to default`);
      setLocalValues((v) => ({ ...v, [key]: (updated as unknown as SystemSetting).value ?? '' }));
      setDirty((d) => { const n = new Set(d); n.delete(key); return n; });
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: () => toast.error('Reset failed'),
  });

  function handleChange(key: string, val: string) {
    setLocalValues((v) => ({ ...v, [key]: val }));
    setDirty((d) => new Set(d).add(key));
  }

  const settings = data?.[activeTab] ?? [];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200 animate-pulse h-12" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold uppercase tracking-widest mb-1">
            <Settings className="w-3.5 h-3.5" /> System Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Configure System</h1>
          <p className="text-slate-500 text-sm mt-1">Manage global defaults and policies for the entire platform.</p>
        </div>
        {dirty.size > 0 && (
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="self-start flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm text-sm"
          >
            {saveMut.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            Save {dirty.size} change{dirty.size !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ── MAINTENANCE WARNING ── */}
      {localValues['general.maintenance_mode'] === '1' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-800 text-sm">Maintenance Mode is ON</div>
            <div className="text-xs text-amber-700 mt-0.5">The platform is currently unavailable to regular users. Turn it off when ready.</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">

        {/* ── SIDEBAR TABS ── */}
        <nav className="lg:col-span-1 space-y-1">
          {TABS.map(({ key, label, icon: Icon, desc }) => {
            const groupDirty = Array.from(dirty).some((k) => k.startsWith(key + '.'));
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition text-sm ${
                  activeTab === key
                    ? 'bg-orange-50 border border-orange-200 text-orange-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === key ? 'text-orange-500' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <div className={`font-semibold leading-tight flex items-center gap-1.5 ${activeTab === key ? 'text-orange-700' : ''}`}>
                    {label}
                    {groupDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* ── SETTINGS PANEL ── */}
        <div className="lg:col-span-3 space-y-3">
          {settings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Settings className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <div className="text-slate-500">No settings found for this group.</div>
            </div>
          ) : (
            settings.map((s) => (
              <SettingRow
                key={s.key}
                setting={s}
                value={localValues[s.key] ?? s.value ?? ''}
                isDirty={dirty.has(s.key)}
                onChange={(val) => handleChange(s.key, val)}
                onReset={() => resetMut.mutate(s.key)}
                resetting={resetMut.isPending && resetMut.variables === s.key as unknown}
              />
            ))
          )}
        </div>
      </div>

      {/* ── BOTTOM SAVE BAR ── */}
      {dirty.size > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between gap-4 bg-white border border-orange-200 shadow-lg rounded-2xl px-5 py-3">
          <div className="text-sm text-slate-700">
            <span className="font-bold text-orange-600">{dirty.size}</span> unsaved change{dirty.size !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // revert to server values
                const initial: Record<string, string> = {};
                Object.values(data ?? {}).flat().forEach((s) => { initial[s.key] = s.value ?? ''; });
                setLocalValues(initial);
                setDirty(new Set());
              }}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Discard
            </button>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-5 py-2 rounded-xl transition shadow-sm text-sm"
            >
              {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Setting Row Component ─────────────────────────────────────────────────────

interface SettingRowProps {
  setting: SystemSetting;
  value: string;
  isDirty: boolean;
  onChange: (val: string) => void;
  onReset: () => void;
  resetting: boolean;
}

function SettingRow({ setting, value, isDirty, onChange, onReset, resetting }: SettingRowProps) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition ${
      isDirty ? 'border-orange-300 shadow-orange-50' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{setting.label}</span>
            {isDirty && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Modified
              </span>
            )}
          </div>
          {setting.description && (
            <p className="text-xs text-slate-400 mt-0.5">{setting.description}</p>
          )}
          <p className="text-[10px] text-slate-300 font-mono mt-1">{setting.key}</p>
        </div>
        <button
          onClick={onReset}
          disabled={resetting}
          title="Reset to default"
          className="shrink-0 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg transition disabled:opacity-40"
        >
          {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          Reset
        </button>
      </div>

      {/* Input rendered by type */}
      {setting.type === 'boolean' ? (
        <BooleanToggle value={value} onChange={onChange} />
      ) : setting.type === 'integer' ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full sm:w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : setting.key === 'notifications.digest_frequency' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="off">Off</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      ) : setting.key === 'general.timezone' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      ) : setting.key === 'general.maintenance_message' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      ) : (
        <input
          type={setting.key.includes('email') ? 'email' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      )}
    </div>
  );
}

function BooleanToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isOn = value === '1' || value === 'true';
  return (
    <button
      type="button"
      onClick={() => onChange(isOn ? '0' : '1')}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
        isOn
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}
    >
      <div className={`w-9 h-5 rounded-full transition-colors relative ${isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isOn ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      {isOn
        ? <><CheckCircle2 className="w-4 h-4" /> Enabled</>
        : <>Disabled</>}
    </button>
  );
}

const TIMEZONES = [
  'Africa/Nairobi', 'Africa/Dar_es_Salaam', 'Africa/Kampala', 'Africa/Kigali',
  'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Accra',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'UTC',
];
