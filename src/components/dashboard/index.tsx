'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

/**
 * SRS Module 11 — shared dashboard primitives.
 * SAFCO palette: orange (primary), navy (data), amber/green/red (status).
 */

export const COLORS = {
  brand: '#f97316',
  navy: '#1e3a8a',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
  purple: '#8b5cf6',
  blue: '#0ea5e9',
};

export const PIE_COLORS = [COLORS.brand, COLORS.navy, COLORS.green, COLORS.amber, COLORS.purple, COLORS.blue, COLORS.red, COLORS.slate];

/* ---------------- StatCard ---------------- */
export function StatCard({
  label, value, icon, delta, accent = 'brand', suffix,
}: {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ReactNode;
  delta?: { value: number; label?: string };
  accent?: 'brand' | 'navy' | 'green' | 'amber' | 'red' | 'purple';
  suffix?: string;
}) {
  const displayValue = value === null || value === undefined ? '—' : value;
  const showSuffix = value !== null && value !== undefined;
  const bg = {
    brand: 'bg-orange-50 text-orange-700 border-orange-200',
    navy: 'bg-navy-50 text-navy-700 border-navy-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }[accent];
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase font-bold tracking-widest opacity-80">{label}</div>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-3xl font-black">{displayValue}</div>
        {suffix && showSuffix && <div className="text-sm opacity-70 font-semibold">{suffix}</div>}
      </div>
      {delta && (
        <div className={`text-xs mt-1 font-semibold ${delta.value >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
          {delta.value >= 0 ? '↑' : '↓'} {Math.abs(delta.value)}% {delta.label ?? ''}
        </div>
      )}
    </div>
  );
}

/* ---------------- Bar chart ---------------- */
export function DashBarChart({ data, xKey, bars, height = 240 }: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  bars: Array<{ dataKey: string; name?: string; color?: string }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        {bars.map((b, i) => (
          <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name ?? b.dataKey} fill={b.color ?? PIE_COLORS[i % PIE_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Line chart ---------------- */
export function DashLineChart({ data, xKey, lineKey, height = 220 }: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  lineKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Line type="monotone" dataKey={lineKey} stroke={COLORS.brand} strokeWidth={3} dot={{ r: 4, fill: COLORS.brand }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Donut chart ---------------- */
export function DashDonut({ data, height = 240 }: {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%" cy="50%"
          innerRadius={55} outerRadius={90}
          paddingAngle={2}
          label={({ percent }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
          labelLine={false}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => {
            const n = Number(v ?? 0);
            return [`${n} (${total ? Math.round((n / total) * 100) : 0}%)`, String(name ?? '')];
          }}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Progress bar row ---------------- */
export function ProgressBar({ percent, colorClass = 'bg-brand-500' }: { percent: number; colorClass?: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full ${colorClass} transition-all`} style={{ width: `${p}%` }} />
    </div>
  );
}

/* ---------------- Panel wrapper ---------------- */
export function DashPanel({ title, subtitle, right, children }: {
  title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ---------------- Empty state helper ---------------- */
export function EmptyChart({ msg }: { msg: string }) {
  return (
    <div className="p-8 text-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
      {msg}
    </div>
  );
}

/* ---------------- Window picker (?days=X) ---------------- */
export function WindowPicker({
  value, onChange,
}: {
  value: 7 | 30 | 90 | 365 | null;
  onChange: (v: 7 | 30 | 90 | 365 | null) => void;
}) {
  const opts: { v: 7 | 30 | 90 | 365 | null; label: string }[] = [
    { v: 7, label: '7d' },
    { v: 30, label: '30d' },
    { v: 90, label: '90d' },
    { v: 365, label: '1y' },
    { v: null, label: 'All' },
  ];
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      {opts.map((o) => (
        <button
          key={String(o.v ?? 'all')}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
            value === o.v
              ? 'bg-brand-500 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={value === o.v}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Loading skeleton for a StatCard row ---------------- */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="mt-3 h-8 w-24 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Chart skeleton ---------------- */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-lg bg-slate-100 animate-pulse" style={{ height }} />
  );
}
