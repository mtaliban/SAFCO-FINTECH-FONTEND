'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

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

export const PIE_COLORS = [
  COLORS.brand, COLORS.navy, COLORS.green, COLORS.amber,
  COLORS.purple, COLORS.blue, COLORS.red, COLORS.slate,
];

/* ------------------------------------------------------------------ *
 * StatCard — white card with coloured left-border + icon square
 * ------------------------------------------------------------------ */
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

  const cfg = {
    brand:  { border: 'border-l-orange-500',  icon: 'bg-orange-50  text-orange-600',  num: 'text-orange-600' },
    navy:   { border: 'border-l-blue-700',    icon: 'bg-blue-50    text-blue-700',    num: 'text-blue-700' },
    green:  { border: 'border-l-emerald-500', icon: 'bg-emerald-50 text-emerald-600', num: 'text-emerald-600' },
    amber:  { border: 'border-l-amber-500',   icon: 'bg-amber-50   text-amber-600',   num: 'text-amber-600' },
    red:    { border: 'border-l-red-500',     icon: 'bg-red-50     text-red-600',     num: 'text-red-600' },
    purple: { border: 'border-l-purple-500',  icon: 'bg-purple-50  text-purple-600',  num: 'text-purple-600' },
  }[accent];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${cfg.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        {icon && (
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.icon}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900 tabular-nums">{displayValue}</span>
        {suffix && showSuffix && (
          <span className={`text-base font-bold ${cfg.num}`}>{suffix}</span>
        )}
      </div>
      {delta && (
        <div className={`text-xs mt-2 font-semibold flex items-center gap-1 ${delta.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {delta.value >= 0 ? '↑' : '↓'} {Math.abs(delta.value)}%
          <span className="text-slate-400 font-normal">{delta.label ?? 'vs last period'}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * HeroMetric — glassmorphism chip for dark hero banners
 * ------------------------------------------------------------------ */
export function HeroMetric({
  label, value, suffix, icon,
}: {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
  icon?: React.ReactNode;
}) {
  const display = value === null || value === undefined ? '—' : value;
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white tabular-nums">{display}</span>
        {suffix && value !== null && value !== undefined && (
          <span className="text-sm text-white/70 font-semibold">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * RingProgress — SVG circular progress indicator
 * ------------------------------------------------------------------ */
export function RingProgress({
  percent, size = 64, strokeWidth = 6, color = COLORS.brand,
}: {
  percent: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(percent, 0), 100) / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-slate-700 tabular-nums">{Math.round(percent)}%</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * DashBarChart — vertical bar chart
 * ------------------------------------------------------------------ */
export function DashBarChart({ data, xKey, bars, height = 240 }: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  bars: Array<{ dataKey: string; name?: string; color?: string }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} angle={-12} textAnchor="end" height={56} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
        />
        {bars.map((b, i) => (
          <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name ?? b.dataKey}
            fill={b.color ?? PIE_COLORS[i % PIE_COLORS.length]} radius={[5, 5, 0, 0]} maxBarSize={48} />
        ))}
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * DashAreaChart — area chart with gradient fill (premium score trend)
 * ------------------------------------------------------------------ */
export function DashAreaChart({ data, xKey, lineKey, height = 220, color = COLORS.brand }: {
  data: Array<Record<string, string | number>>;
  xKey: string; lineKey: string; height?: number; color?: string;
}) {
  const gradId = `area-grad-${lineKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
          formatter={(v) => [`${Number(v ?? 0).toFixed(1)}%`, 'Score']}
        />
        <Area
          type="monotone" dataKey={lineKey} stroke={color} strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={{ r: 4, fill: '#fff', stroke: color, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * DashLineChart — keep for backward compat
 * ------------------------------------------------------------------ */
export function DashLineChart({ data, xKey, lineKey, height = 220 }: {
  data: Array<Record<string, string | number>>;
  xKey: string; lineKey: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} />
        <Line type="monotone" dataKey={lineKey} stroke={COLORS.brand} strokeWidth={2.5}
          dot={{ r: 4, fill: COLORS.brand }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * DashDonut — donut / pie chart
 * ------------------------------------------------------------------ */
export function DashDonut({ data, height = 240 }: {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={58} outerRadius={92} paddingAngle={2}
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
          contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * ProgressBar
 * ------------------------------------------------------------------ */
export function ProgressBar({ percent, colorClass = 'bg-orange-500' }: {
  percent: number; colorClass?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${p}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * DashPanel — content panel with header divider
 * ------------------------------------------------------------------ */
export function DashPanel({
  title, subtitle, right, children, accent,
}: {
  title: string; subtitle?: string; right?: React.ReactNode;
  children: React.ReactNode;
  accent?: 'brand' | 'green' | 'navy' | 'amber';
}) {
  const topBorder = accent ? {
    brand: 'border-t-2 border-t-orange-500',
    green: 'border-t-2 border-t-emerald-500',
    navy:  'border-t-2 border-t-blue-800',
    amber: 'border-t-2 border-t-amber-500',
  }[accent] : '';

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${topBorder}`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * EmptyChart
 * ------------------------------------------------------------------ */
export function EmptyChart({ msg }: { msg: string }) {
  return (
    <div className="py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl">
      <div className="text-slate-300 text-4xl mb-3">📊</div>
      <p className="text-sm text-slate-500 max-w-xs">{msg}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * WindowPicker — time window selector (light + dark variants)
 * ------------------------------------------------------------------ */
type WindowDays = 7 | 30 | 90 | 365 | null;

const WIN_OPTS: { v: WindowDays; label: string }[] = [
  { v: 7, label: '7d' },
  { v: 30, label: '30d' },
  { v: 90, label: '90d' },
  { v: 365, label: '1y' },
  { v: null, label: 'All' },
];

export function WindowPicker({
  value, onChange, variant = 'light',
}: {
  value: WindowDays;
  onChange: (v: WindowDays) => void;
  variant?: 'light' | 'dark';
}) {
  const wrap = variant === 'dark'
    ? 'bg-white/10 border border-white/20'
    : 'bg-white border border-slate-200';

  return (
    <div className={`inline-flex rounded-lg p-0.5 ${wrap}`}>
      {WIN_OPTS.map((o) => {
        const active = value === o.v;
        const cls = active
          ? variant === 'dark' ? 'bg-white/20 text-white' : 'bg-orange-500 text-white shadow-sm'
          : variant === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900';
        return (
          <button
            key={String(o.v ?? 'all')}
            onClick={() => onChange(o.v)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${cls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Loading skeletons
 * ------------------------------------------------------------------ */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse shadow-sm">
          <div className="h-3 w-20 bg-slate-200 rounded mb-4" />
          <div className="h-9 w-28 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-xl bg-slate-100 animate-pulse" style={{ height }} />
  );
}
