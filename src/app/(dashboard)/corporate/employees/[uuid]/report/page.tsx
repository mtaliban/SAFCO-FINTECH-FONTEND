'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, User, Mail, Building2, BookOpen, CheckCircle2, XCircle, Award,
} from 'lucide-react';
import { dashboardApi } from '@/lib/dashboard/api';
import { DashPanel, EmptyChart, ProgressBar, StatCard, StatCardSkeleton } from '@/components/dashboard';

/**
 * SRS Module 11 — Corporate drill-down: per-employee progress report.
 * Consumes GET /corporate/employees/{uuid}/report.
 */
export default function EmployeeReportPage() {
  const { uuid } = useParams<{ uuid: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['corporate', 'employee-report', uuid],
    queryFn: () => dashboardApi.employeeReport(uuid),
    enabled: Boolean(uuid),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <StatCardSkeleton count={3} />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto card p-8 text-center text-slate-500">
        Employee not found — they may not be in your organization.
      </div>
    );
  }

  const totalCourses = data.enrollments.length;
  const completed = data.enrollments.filter((e) => e.completed_at).length;
  const activeCerts = data.certificates.filter((c) => c.status === 'active').length;
  const avgProgress = totalCourses
    ? Math.round(data.enrollments.reduce((s, e) => s + e.progress, 0) / totalCourses)
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/corporate" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 truncate">{data.employee.name}</h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" /> {data.employee.email}</span>
              {data.employee.department && (
                <span className="inline-flex items-center gap-1"><Building2 className="w-4 h-4" /> {data.employee.department}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="Courses" value={totalCourses} icon={<BookOpen className="w-5 h-5" />} accent="brand" />
        <StatCard label="Completed" value={completed} icon={<CheckCircle2 className="w-5 h-5" />} accent="green" />
        <StatCard label="Avg Progress" value={avgProgress} suffix="%" accent="navy" />
        <StatCard label="Certificates" value={activeCerts} icon={<Award className="w-5 h-5" />} accent="amber" />
      </div>

      <DashPanel title="Course progress" subtitle={`${totalCourses} enrollment${totalCourses === 1 ? '' : 's'}`}>
        {totalCourses === 0
          ? <EmptyChart msg="This employee is not enrolled in any course yet." />
          : (
            <ul className="space-y-3">
              {data.enrollments.map((e, i) => (
                <li key={i} className="p-3 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{e.course_title}</div>
                      <div className="text-xs text-slate-500">{e.category ?? 'Uncategorized'}</div>
                    </div>
                    <div className="text-right shrink-0 text-xs text-slate-500">
                      {e.completed_at
                        ? <span className="text-emerald-700 font-semibold">Completed</span>
                        : <span>In progress</span>}
                    </div>
                  </div>
                  <ProgressBar
                    percent={e.progress}
                    colorClass={e.progress >= 100 ? 'bg-emerald-500' : e.progress >= 50 ? 'bg-brand-500' : 'bg-slate-400'}
                  />
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{e.progress}%</div>
                </li>
              ))}
            </ul>
          )}
      </DashPanel>

      <DashPanel title="Quiz attempts" subtitle={`Last ${Math.min(50, data.attempts.length)} completed attempts`}>
        {data.attempts.length === 0
          ? <EmptyChart msg="No quiz attempts yet." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase text-left border-b border-slate-200">
                  <tr>
                    <th className="py-2">Quiz</th>
                    <th className="py-2">Mode</th>
                    <th className="py-2 text-right">Score</th>
                    <th className="py-2 text-right">Result</th>
                    <th className="py-2 text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.attempts.map((a, i) => (
                    <tr key={i}>
                      <td className="py-2 font-semibold text-slate-900">{a.quiz}</td>
                      <td className="py-2 text-slate-600">{a.mode}</td>
                      <td className="py-2 text-right font-mono">{a.percentage}%</td>
                      <td className="py-2 text-right">
                        {a.passed
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                          : <XCircle className="w-4 h-4 text-red-500 inline" />}
                      </td>
                      <td className="py-2 text-right text-xs text-slate-500">
                        {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </DashPanel>

      <DashPanel title="Certificates" subtitle={`${data.certificates.length} total`}>
        {data.certificates.length === 0
          ? <EmptyChart msg="No certificates earned yet." />
          : (
            <ul className="space-y-2">
              {data.certificates.map((c) => (
                <li key={c.cert_number} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                  <Award className={`w-5 h-5 ${c.status === 'active' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{c.course_title_snapshot}</div>
                    <div className="text-xs text-slate-500 font-mono">{c.cert_number}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    c.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
      </DashPanel>
    </div>
  );
}
