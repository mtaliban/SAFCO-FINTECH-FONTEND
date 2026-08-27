'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserPlus, Building2, Award, TrendingUp, ArrowRight,
  CheckCircle2, Clock, XCircle, BarChart3, Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, type WindowDays } from '@/lib/dashboard/api';
import {
  HeroMetric, StatCard, DashBarChart, DashDonut, DashPanel, RingProgress,
  ProgressBar, EmptyChart, WindowPicker, StatCardSkeleton, ChartSkeleton, COLORS,
} from '@/components/dashboard';

export default function CorporateDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [days, setDays] = useState<WindowDays>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'corporate', days],
    queryFn: () => dashboardApi.corporate(days),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const firstName = user?.profile?.first_name ?? 'Manager';
  const orgName = user?.organization?.name ?? 'Organization';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-56 animate-pulse" style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%)' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
          <StatCardSkeleton count={5} />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><ChartSkeleton height={280} /></div>
            <ChartSkeleton height={280} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto text-slate-200 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Organization not linked</h2>
          <p className="text-slate-500 text-sm">Your account isn't attached to an organization yet. Contact your administrator.</p>
        </div>
      </div>
    );
  }

  const h = data.headline;

  const deptChartData = data.by_department.map((d) => ({
    label: d.department.length > 14 ? d.department.slice(0, 14) + '…' : d.department,
    Employees: d.employees,
    'Avg Progress %': d.avg_progress,
    'Avg Score %': d.avg_score ?? 0,
  }));

  const statusData = [
    { name: 'Not Started', value: data.status_distribution.find((s) => s.status === 'not_started')?.count ?? 0, color: COLORS.slate },
    { name: 'In Progress', value: data.status_distribution.find((s) => s.status === 'in_progress')?.count ?? 0, color: COLORS.amber },
    { name: 'Completed',   value: data.status_distribution.find((s) => s.status === 'completed')?.count ?? 0, color: COLORS.green },
  ].filter((s) => s.value > 0);

  const overallCompletion = h.completion_percent;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO BANNER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f2656 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-navy-500 text-[11px] font-bold uppercase tracking-widest mb-2">
                <Building2 className="w-3.5 h-3.5" /> SAFCO FINTECH LMS · {orgName}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Karibu, {firstName}!</h1>
              <div className="flex items-center gap-1.5 text-navy-500 text-sm mt-1">
                <Calendar className="w-3.5 h-3.5" /> {today}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <WindowPicker value={days} onChange={setDays} variant="dark" />
              <Link
                href="/corporate/invite"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                <UserPlus className="w-4 h-4" /> Invite Employee
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <HeroMetric icon={<Users className="w-4 h-4" />} label="Employees" value={h.employees_total} />
            <HeroMetric icon={<CheckCircle2 className="w-4 h-4" />} label="Trained" value={h.employees_trained} />
            <HeroMetric icon={<TrendingUp className="w-4 h-4" />} label="Completion" value={h.completion_percent} suffix="%" />
            <HeroMetric icon={<BarChart3 className="w-4 h-4" />} label="Avg Score" value={h.avg_score_percent} suffix="%" />
            <HeroMetric icon={<Award className="w-4 h-4" />} label="Certificates" value={h.certificates_earned} />
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Employees" value={h.employees_total} icon={<Users className="w-4 h-4" />} accent="brand" />
          <StatCard label="Employees Trained" value={h.employees_trained} icon={<CheckCircle2 className="w-4 h-4" />} accent="green" />
          <StatCard label="Completion" value={h.completion_percent} suffix="%" icon={<TrendingUp className="w-4 h-4" />} accent="navy" />
          <StatCard label="Avg Score" value={h.avg_score_percent} suffix="%" icon={<BarChart3 className="w-4 h-4" />} accent="purple" />
          <StatCard label="Certificates" value={h.certificates_earned} icon={<Award className="w-4 h-4" />} accent="amber" />
        </div>

        {/* Completion ring + status donut */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overall completion ring */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
            <RingProgress percent={overallCompletion} size={80} strokeWidth={8} color={COLORS.green} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Overall Completion</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{overallCompletion}%</div>
              <div className="text-xs text-slate-500 mt-1">
                {h.employees_trained} of {h.employees_total} employees trained
              </div>
            </div>
          </div>

          {/* Score ring */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
            <RingProgress percent={h.avg_score_percent} size={80} strokeWidth={8} color={COLORS.brand} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Average Score</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{h.avg_score_percent}%</div>
              <div className="text-xs text-slate-500 mt-1">Organisation-wide quiz performance</div>
            </div>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Award className="w-9 h-9 text-amber-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Certificates Earned</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{h.certificates_earned}</div>
              <div className="text-xs text-slate-500 mt-1">By your employees this period</div>
            </div>
          </div>
        </div>

        {/* Department performance + status distribution */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashPanel
              title="Department Performance"
              subtitle="Employees · Avg progress · Avg score by department"
              accent="navy"
            >
              {deptChartData.length === 0
                ? <EmptyChart msg="No departments found. Have employees set their department in their profile." />
                : <DashBarChart data={deptChartData} xKey="label" height={280} bars={[
                    { dataKey: 'Employees', color: COLORS.brand },
                    { dataKey: 'Avg Progress %', color: COLORS.navy },
                    { dataKey: 'Avg Score %', color: COLORS.green },
                  ]} />}
            </DashPanel>
          </div>

          <DashPanel title="Employee Status" subtitle="Training progress distribution">
            {statusData.length === 0
              ? <EmptyChart msg="No employees yet." />
              : <DashDonut data={statusData} height={280} />}
          </DashPanel>
        </div>

        {/* Top performers + Department table */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Leaderboard */}
          <DashPanel title="Top Performers" subtitle="Ranked by average quiz score" accent="amber">
            {data.top_performers.length === 0
              ? <EmptyChart msg="No employees have completed quizzes yet." />
              : (
                <ol className="space-y-2">
                  {data.top_performers.map((p, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                    const scoreColor = p.avg_score >= 80 ? 'text-emerald-600' : p.avg_score >= 60 ? 'text-amber-600' : 'text-red-500';
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/corporate/employees/${p.id}/report`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group"
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                            i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {medal ?? (i + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 truncate text-sm group-hover:text-navy-600 transition">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {p.department ?? 'Unassigned'} · {p.attempts} attempt{p.attempts !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className={`text-xl font-black tabular-nums ${scoreColor}`}>
                            {p.avg_score}%
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
          </DashPanel>

          {/* Department table */}
          <DashPanel title="Department Breakdown" subtitle="Detailed metrics per department">
            {data.by_department.length === 0
              ? <EmptyChart msg="No department data yet." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wide text-left">
                        <th className="pb-3">Department</th>
                        <th className="pb-3 text-right">Emp.</th>
                        <th className="pb-3 w-32">Progress</th>
                        <th className="pb-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.by_department.map((d) => (
                        <tr key={d.department} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-semibold text-slate-900 max-w-[120px] truncate">{d.department}</td>
                          <td className="py-3 text-right text-slate-700 font-mono">{d.employees}</td>
                          <td className="py-3 w-32">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <ProgressBar percent={d.avg_progress} colorClass="bg-navy-500" />
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{d.avg_progress}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-black text-slate-900">
                            {d.avg_score !== null ? `${d.avg_score}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </DashPanel>

        </div>

        {/* Course pipeline */}
        <DashPanel
          title="Course Completion Pipeline"
          subtitle="How employees are progressing through each course"
          accent="green"
          right={
            <Link href="/corporate/employees" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
              All employees →
            </Link>
          }
        >
          {data.courses_progress.length === 0 ? (
            <EmptyChart msg="No enrollments yet. Invite employees and share course links." />
          ) : (
            <div className="space-y-4">
              {data.courses_progress.map((c) => {
                const compRate = c.enrolled > 0 ? (c.completed / c.enrolled) * 100 : 0;
                const ipRate = c.enrolled > 0 ? (c.in_progress / c.enrolled) * 100 : 0;
                return (
                  <div key={c.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate text-sm">{c.title}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold mt-0.5">{c.category ?? 'General'}</div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-xs text-slate-700">
                          <span className="font-bold text-emerald-600">{c.completed}</span> completed ·{' '}
                          <span className="font-bold text-amber-600">{c.in_progress}</span> in progress ·{' '}
                          <span className="text-slate-400">{c.enrolled} enrolled</span>
                        </div>
                      </div>
                    </div>
                    {/* Stacked progress: green (complete) + amber (in-progress) */}
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${compRate}%` }} />
                      <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${ipRate}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Completed {compRate.toFixed(0)}%</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> In Progress {ipRate.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashPanel>

        {/* Quick links */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLink href="/corporate/employees" icon={<Building2 className="w-5 h-5" />} title="Manage Employees" subtitle="View profiles and progress" color="bg-navy-50 text-navy-500" />
            <QuickLink href="/corporate/invite" icon={<UserPlus className="w-5 h-5" />} title="Invite Employee" subtitle="Onboard new team members" color="bg-orange-50 text-orange-600" />
            <QuickLink href="/corporate/reports" icon={<BarChart3 className="w-5 h-5" />} title="Full Reports" subtitle="Download CSV analytics" color="bg-emerald-50 text-emerald-600" />
          </div>
        </div>

      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, subtitle, color }: {
  href: string; icon: React.ReactNode; title: string; subtitle: string; color: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-navy-200 transition group flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-900 text-sm">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-navy-500 transition" />
    </Link>
  );
}
