'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, BarChart3, Users, BookOpen, Zap, Building2, Activity,
  Award, TrendingUp, GraduationCap, CreditCard, Download, Calendar,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  StatCard, DashDonut, DashPanel, EmptyChart, COLORS,
  DashBarChart,
} from '@/components/dashboard';

interface MonthlyRevenue { month: string; total_tzs: number; count: number }

interface AdminStats {
  users: { total: number; active: number; pending?: number; by_role: Record<string, number> };
  quizzes: { total: number; published: number; draft: number };
  courses: { total: number; published: number; pending_approval: number; draft: number };
  enrollments: { total: number; active: number; completed: number };
  certificates: { total: number; revoked: number };
  sessions: { total: number; active: number; completed: number };
  organizations: number;
  recent_logins_24h: number;
  revenue: {
    total_tzs: number;
    paid_invoices: number;
    pending_invoices: number;
    monthly: MonthlyRevenue[];
  };
}

function fmtTzs(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M TZS`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K TZS`;
  return `${n} TZS`;
}

export default function AdminReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo)   params.set('date_to', dateTo);
  const qs = params.toString();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats', qs],
    queryFn: () => apiRequest.get<AdminStats>(`/admin/stats${qs ? '?' + qs : ''}`),
  });

  async function handleExportBilling() {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? '';
    const token = useAuthStore.getState().token;
    const url   = `${base}/api/v1/admin/billing/export${qs ? '?' + qs : ''}`;
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token ?? ''}` } });
    const blob  = await res.blob();
    const link  = document.createElement('a');
    link.href   = URL.createObjectURL(blob);
    link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (isLoading || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const roleData = Object.entries(data.users.by_role).map(([role, count]) => ({
    name: role.replace(/_/g, ' '), value: count,
  }));

  const courseStatusData = [
    { name: 'Published',    value: data.courses.published,        color: COLORS.green },
    { name: 'Pending Appr', value: data.courses.pending_approval, color: COLORS.amber },
    { name: 'Draft',        value: data.courses.draft,            color: COLORS.slate },
  ];

  const revenueBarData = (data.revenue.monthly ?? []).map((m) => ({
    name: m.month.slice(5), // "MM" portion
    value: Math.round(m.total_tzs / 1000), // K TZS
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in space-y-6">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold uppercase tracking-widest mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">System Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Platform-wide health snapshot — users, courses, quizzes, revenue.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportBilling}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl transition text-sm"
          >
            <Download className="w-4 h-4" /> Export Billing CSV
          </button>
          <Link
            href="/admin/subscriptions"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition text-sm"
          >
            <CreditCard className="w-4 h-4" /> Manage Billing
          </Link>
        </div>
      </div>

      {/* ── DATE FILTER ── */}
      <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-slate-200 px-4 py-3">
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filter revenue by date:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <span className="text-slate-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-orange-600 hover:text-orange-800 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── REVENUE CARDS ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Revenue"
            value={fmtTzs(data.revenue.total_tzs)}
            icon={<TrendingUp className="w-5 h-5" />}
            accent="brand"
          />
          <StatCard
            label="Paid Invoices"
            value={data.revenue.paid_invoices}
            icon={<CreditCard className="w-5 h-5" />}
            accent="green"
          />
          <StatCard
            label="Pending Invoices"
            value={data.revenue.pending_invoices}
            icon={<CreditCard className="w-5 h-5" />}
            accent="amber"
          />
        </div>
      </div>

      {/* ── PLATFORM STATS ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Platform</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users"       value={data.users.total}          icon={<Users className="w-5 h-5" />}          accent="brand" />
          <StatCard label="Active Users"      value={data.users.active}         icon={<Users className="w-5 h-5" />}          accent="green" />
          <StatCard label="Organizations"     value={data.organizations}        icon={<Building2 className="w-5 h-5" />}      accent="amber" />
          <StatCard label="Logins (24h)"      value={data.recent_logins_24h}    icon={<Activity className="w-5 h-5" />}       accent="brand" />
          <StatCard label="Total Courses"     value={data.courses.total}        icon={<BookOpen className="w-5 h-5" />}       accent="green" />
          <StatCard label="Enrollments"       value={data.enrollments.total}    icon={<GraduationCap className="w-5 h-5" />}  accent="amber" />
          <StatCard label="Certificates Issued" value={data.certificates.total} icon={<Award className="w-5 h-5" />}         accent="brand" />
          <StatCard label="Total Quizzes"     value={data.quizzes.total}        icon={<Zap className="w-5 h-5" />}            accent="green" />
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DashPanel title="Users by Role">
          {roleData.length === 0
            ? <EmptyChart msg="No users yet." />
            : <DashDonut data={roleData} />}
        </DashPanel>

        <DashPanel title="Course Status Breakdown">
          {data.courses.total === 0
            ? <EmptyChart msg="No courses yet." />
            : <DashDonut data={courseStatusData} />}
        </DashPanel>
      </div>

      {revenueBarData.length > 0 && (
        <DashPanel title="Monthly Revenue (TZS '000 — last 6 months)">
          <DashBarChart
            data={revenueBarData}
            xKey="name"
            bars={[{ dataKey: 'value', name: 'Revenue (K TZS)', color: COLORS.brand }]}
          />
        </DashPanel>
      )}

      {/* ── QUICK LINKS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickLink href="/admin/certificates"         icon={<Award className="w-5 h-5" />}         title="Certificates"        subtitle="Search + revoke" />
        <QuickLink href="/admin/course-approvals"     icon={<BookOpen className="w-5 h-5" />}       title="Course Approvals"    subtitle="Review pending" />
        <QuickLink href="/admin/audit-log"            icon={<Activity className="w-5 h-5" />}       title="Audit Log"           subtitle="Security actions" />
        <QuickLink href="/admin/subscriptions"        icon={<CreditCard className="w-5 h-5" />}     title="All Invoices"        subtitle="Filter + export" />
      </div>

    </div>
  );
}

function QuickLink({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md hover:border-orange-200 transition group flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </Link>
  );
}
