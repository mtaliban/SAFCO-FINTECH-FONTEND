'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserPlus, Building2, Award, TrendingUp, Loader2, ArrowRight,
  CheckCircle2, Clock, XCircle, Trophy, BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, type WindowDays } from '@/lib/dashboard/api';
import {
  StatCard, DashBarChart, DashDonut, DashPanel, EmptyChart, ProgressBar,
  WindowPicker, StatCardSkeleton, ChartSkeleton, COLORS,
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

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <StatCardSkeleton count={5} />
        <ChartSkeleton height={280} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto card p-8 text-center">
        <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Organization not linked</h2>
        <p className="text-slate-500">Your account isn't attached to an organization yet. Contact your admin.</p>
      </div>
    );
  }

  const h = data.headline;
  const deptChartData = data.by_department.map((d) => ({
    label: d.department.length > 14 ? d.department.slice(0, 14) + '…' : d.department,
    employees: d.employees,
    'Avg progress %': d.avg_progress,
    'Avg score %': d.avg_score ?? 0,
  }));
  const statusData = data.status_distribution.map((s) => {
    const label = { not_started: 'Not started', in_progress: 'In progress', completed: 'Completed' }[s.status] ?? s.status;
    const color = { not_started: COLORS.slate, in_progress: COLORS.amber, completed: COLORS.green }[s.status];
    return { name: label, value: s.count, color };
  });

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Karibu, {user?.profile?.first_name ?? 'Corporate'} 👋
          </h1>
          <p className="text-slate-600 mt-1">
            {user?.organization?.name ?? 'Organization'} Dashboard (SRS Module 11 · 3.4).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WindowPicker value={days} onChange={setDays} />
          <Link href="/corporate/invite" className="btn-primary">
            <UserPlus className="w-4 h-4" /> Invite Employee
          </Link>
        </div>
      </div>

      {/* SRS headline */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Employees" value={h.employees_total} icon={<Users className="w-5 h-5" />} accent="brand" />
        <StatCard label="Employees Trained" value={h.employees_trained} icon={<CheckCircle2 className="w-5 h-5" />} accent="green" />
        <StatCard label="Completion" value={h.completion_percent} suffix="%" icon={<TrendingUp className="w-5 h-5" />} accent="navy" />
        <StatCard label="Avg Score" value={h.avg_score_percent} suffix="%" icon={<BarChart3 className="w-5 h-5" />} accent="purple" />
        <StatCard label="Certificates" value={h.certificates_earned} icon={<Award className="w-5 h-5" />} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashPanel title="Department Performance" subtitle="Employees + avg progress + avg score by department">
            {deptChartData.length === 0
              ? <EmptyChart msg="No employees with a department assigned yet." />
              : (
                <DashBarChart
                  data={deptChartData}
                  xKey="label"
                  height={280}
                  bars={[
                    { dataKey: 'employees', name: 'Employees', color: COLORS.brand },
                    { dataKey: 'Avg progress %', color: COLORS.navy },
                    { dataKey: 'Avg score %', color: COLORS.green },
                  ]}
                />
              )}
          </DashPanel>
        </div>
        <div>
          <DashPanel title="Employee Status" subtitle="Enrollment state distribution">
            {statusData.every((s) => s.value === 0)
              ? <EmptyChart msg="No employees yet." />
              : <DashDonut data={statusData} />}
          </DashPanel>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top performers */}
        <DashPanel title="Top Performers" subtitle="By average quiz score">
          {data.top_performers.length === 0
            ? <EmptyChart msg="No employees have taken any quizzes yet." />
            : (
              <ul className="space-y-2">
                {data.top_performers.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/corporate/employees/${p.id}/report`}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition group"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-brand-100 text-brand-700">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate group-hover:text-brand-700">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {p.department ?? 'Unassigned'} · {p.attempts} attempts
                        </div>
                      </div>
                      <div className="text-xl font-black text-emerald-700 font-mono">{p.avg_score}%</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </DashPanel>

        {/* Department table */}
        <DashPanel title="Department Breakdown" subtitle="Full table">
          {data.by_department.length === 0 ? (
            <EmptyChart msg="No departments set. Have employees fill in their department in their profile." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase font-bold text-left">
                  <tr>
                    <th className="py-1">Department</th>
                    <th className="py-1 text-right">Emp.</th>
                    <th className="py-1 text-right">Progress</th>
                    <th className="py-1 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.by_department.map((d) => (
                    <tr key={d.department}>
                      <td className="py-2 font-semibold text-slate-900">{d.department}</td>
                      <td className="py-2 text-right">{d.employees}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16"><ProgressBar percent={d.avg_progress} /></div>
                          <span className="font-mono text-xs">{d.avg_progress}%</span>
                        </div>
                      </td>
                      <td className="py-2 text-right font-bold">{d.avg_score !== null ? `${d.avg_score}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashPanel>
      </div>

      {/* Course progress */}
      <DashPanel
        title="Course Progress"
        subtitle="How your employees are moving through each course"
        right={<Link href="/corporate/employees" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">All employees →</Link>}
      >
        {data.courses_progress.length === 0 ? (
          <EmptyChart msg="No enrollments yet. Invite employees + share course links." />
        ) : (
          <div className="space-y-3">
            {data.courses_progress.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.category}</div>
                  </div>
                  <div className="text-right text-xs text-slate-600 shrink-0">
                    <div>{c.enrolled} enrolled · {c.completed} completed</div>
                    <div className="text-slate-500">Avg {c.avg_progress}%</div>
                  </div>
                </div>
                <ProgressBar
                  percent={c.enrolled > 0 ? (c.completed / c.enrolled) * 100 : 0}
                  colorClass="bg-emerald-500"
                />
              </div>
            ))}
          </div>
        )}
      </DashPanel>

      <div className="grid md:grid-cols-3 gap-3">
        <QuickLink href="/corporate/employees" icon={<Building2 className="w-5 h-5" />} title="Manage Employees" subtitle="View list + progress" />
        <QuickLink href="/corporate/invite" icon={<UserPlus className="w-5 h-5" />} title="Invite Employee" subtitle="Onboard new staff" />
        <QuickLink href="/corporate/reports" icon={<BarChart3 className="w-5 h-5" />} title="Full Reports" subtitle="Downloadable analytics" />
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md hover:border-brand-300 transition group flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center group-hover:scale-110 transition">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
    </Link>
  );
}
