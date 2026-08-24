'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Loader2, Download, BarChart3, Users, TrendingUp, Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardApi } from '@/lib/dashboard/api';
import {
  StatCard, DashBarChart, DashPanel, EmptyChart, ProgressBar, COLORS,
} from '@/components/dashboard';

export default function CorporateReportsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'corporate'],
    queryFn: () => dashboardApi.corporate(),
  });

  function downloadCsv() {
    if (!data) return;
    const rows: (string | number)[][] = [['Department', 'Employees', 'Enrollments', 'Avg Progress %', 'Avg Score %']];
    for (const d of data.by_department) {
      rows.push([d.department, d.employees, d.enrollments, d.avg_progress, d.avg_score !== null ? d.avg_score : '']);
    }
    rows.push([]);
    rows.push(['Course', 'Category', 'Enrolled', 'Completed', 'In progress', 'Avg progress %']);
    for (const c of data.courses_progress) {
      rows.push([c.title, c.category ?? '', c.enrolled, c.completed, c.in_progress, c.avg_progress]);
    }
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `safco-corporate-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
    toast.success('CSV downloaded');
  }

  if (isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }
  if (isError || !data) {
    return <div className="p-8 card p-8 max-w-4xl mx-auto text-center text-slate-500">Reports unavailable — your account isn't linked to an organization.</div>;
  }

  const h = data.headline;
  const deptData = data.by_department.map((d) => ({
    label: d.department, employees: d.employees, progress: d.avg_progress, score: d.avg_score ?? 0,
  }));
  const courseData = data.courses_progress.map((c) => ({
    label: c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title,
    completed: c.completed, 'in progress': c.in_progress,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-orange-500" /> Progress Reports
          </h1>
          <p className="text-slate-600 mt-1">Downloadable analytics for your organization (SRS Module 11 · 3.4).</p>
        </div>
        <button onClick={downloadCsv} className="btn-primary">
          <Download className="w-4 h-4" /> Download CSV
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Employees" value={h.employees_total} icon={<Users className="w-5 h-5" />} accent="brand" />
        <StatCard label="Trained" value={h.employees_trained} icon={<Award className="w-5 h-5" />} accent="green" />
        <StatCard label="Completion" value={h.completion_percent} suffix="%" icon={<TrendingUp className="w-5 h-5" />} accent="navy" />
        <StatCard label="Certificates" value={h.certificates_earned} icon={<Award className="w-5 h-5" />} accent="amber" />
      </div>

      <DashPanel title="Department comparison" subtitle="Employees × avg progress × avg score">
        {deptData.length === 0
          ? <EmptyChart msg="No department data yet." />
          : (
            <DashBarChart
              data={deptData}
              xKey="label"
              height={320}
              bars={[
                { dataKey: 'employees', name: 'Employees', color: COLORS.brand },
                { dataKey: 'progress', name: 'Avg Progress %', color: COLORS.navy },
                { dataKey: 'score', name: 'Avg Score %', color: COLORS.green },
              ]}
            />
          )}
      </DashPanel>

      <DashPanel title="Course completion pipeline" subtitle="How many employees finished vs still working">
        {courseData.length === 0
          ? <EmptyChart msg="No enrollments yet." />
          : (
            <DashBarChart
              data={courseData}
              xKey="label"
              height={280}
              bars={[
                { dataKey: 'completed', name: 'Completed', color: COLORS.green },
                { dataKey: 'in progress', name: 'In progress', color: COLORS.amber },
              ]}
            />
          )}
      </DashPanel>

      <DashPanel title="Detailed department breakdown">
        {data.by_department.length === 0
          ? <EmptyChart msg="No department data yet." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase text-left border-b border-slate-200">
                  <tr>
                    <th className="py-2">Department</th>
                    <th className="py-2 text-right">Employees</th>
                    <th className="py-2 text-right">Enrollments</th>
                    <th className="py-2 text-right">Avg Progress</th>
                    <th className="py-2 text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.by_department.map((d) => (
                    <tr key={d.department}>
                      <td className="py-2 font-semibold text-slate-900">{d.department}</td>
                      <td className="py-2 text-right">{d.employees}</td>
                      <td className="py-2 text-right">{d.enrollments}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20"><ProgressBar percent={d.avg_progress} /></div>
                          <span className="font-mono">{d.avg_progress}%</span>
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
  );
}

function csvCell(v: string | number): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
