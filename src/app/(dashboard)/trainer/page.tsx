'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, Zap, TrendingUp, Loader2, ArrowRight, Plus,
  CheckCircle2, XCircle, GraduationCap, Trophy,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, type WindowDays } from '@/lib/dashboard/api';
import {
  StatCard, DashBarChart, DashDonut, DashPanel, EmptyChart, ProgressBar,
  WindowPicker, StatCardSkeleton, ChartSkeleton, COLORS,
} from '@/components/dashboard';

export default function TrainerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [days, setDays] = useState<WindowDays>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'trainer', days],
    queryFn: () => dashboardApi.trainer(days),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <StatCardSkeleton count={4} />
        <ChartSkeleton height={280} />
      </div>
    );
  }

  const h = data.headline;
  const perCourseData = data.per_course_students.map((c) => ({
    label: c.title.length > 18 ? c.title.slice(0, 18) + '…' : c.title,
    students: c.students,
    progress: c.avg_progress,
  }));
  const categoryData = data.category_distribution.map((c) => ({
    name: c.category, value: c.count,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Karibu, {user?.profile?.first_name ?? 'Mwalimu'} 👋
          </h1>
          <p className="text-slate-600 mt-1">Trainer Dashboard (SRS Module 11 · 3.2).</p>
        </div>
        <div className="flex items-center gap-3">
          <WindowPicker value={days} onChange={setDays} />
          <Link href="/trainer/courses/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New Course
          </Link>
        </div>
      </div>

      {/* SRS headline */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Courses" value={h.active_courses} icon={<BookOpen className="w-5 h-5" />} accent="brand" />
        <StatCard label="Total Courses" value={h.total_courses} icon={<GraduationCap className="w-5 h-5" />} accent="navy" />
        <StatCard label="Student Count" value={h.student_count} icon={<Users className="w-5 h-5" />} accent="purple" />
        <StatCard label="Quiz Performance" value={h.avg_quiz_score_percent} suffix="%" icon={<TrendingUp className="w-5 h-5" />} accent="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashPanel title="Enrollments by Course" subtitle="Top 8 by student count">
            {perCourseData.length === 0
              ? <EmptyChart msg="You have no enrolled students yet. Publish a course and share it." />
              : <DashBarChart data={perCourseData} xKey="label" bars={[{ dataKey: 'students', name: 'Students', color: COLORS.brand }]} />}
          </DashPanel>
        </div>
        <div>
          <DashPanel title="Courses by Category">
            {categoryData.length === 0
              ? <EmptyChart msg="No courses yet." />
              : <DashDonut data={categoryData} />}
          </DashPanel>
        </div>
      </div>

      <DashPanel
        title="Quiz Performance"
        subtitle={`Top ${data.quiz_performance.length} quizzes by attempts`}
        right={<Link href="/trainer/quizzes" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">All quizzes →</Link>}
      >
        {data.quiz_performance.length === 0 ? (
          <EmptyChart msg="Your quizzes have no attempts yet." />
        ) : (
          <div className="space-y-3">
            {data.quiz_performance.map((q) => (
              <div key={q.id} className="p-3 rounded-lg border border-slate-200 hover:border-brand-300 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 truncate">{q.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-semibold">
                        {q.exam_type ?? q.mode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {q.attempts} attempts · {q.passes} passes · pass rate {q.pass_rate}%
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-slate-900">{q.avg_score !== null ? `${q.avg_score}%` : '—'}</div>
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">avg score</div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Pass rate</div>
                    <ProgressBar percent={q.pass_rate} colorClass={q.pass_rate >= 60 ? 'bg-emerald-500' : q.pass_rate >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Avg score</div>
                    <ProgressBar percent={q.avg_score ?? 0} colorClass="bg-brand-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashPanel>

      <DashPanel title="Recent Activity" subtitle="New enrollments + attempts on your courses">
        {data.recent_activity.length === 0
          ? <EmptyChart msg="No activity yet." />
          : (
            <ul className="divide-y divide-slate-100">
              {data.recent_activity.map((a, i) => (
                <li key={i} className="py-2 flex items-center gap-3">
                  {a.type === 'enrollment'
                    ? <Users className="w-4 h-4 text-brand-600 shrink-0" />
                    : a.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="text-slate-900 truncate">
                      {a.type === 'enrollment' ? 'New enrollment in ' : ''}
                      <strong>{a.title}</strong>
                    </div>
                    <div className="text-xs text-slate-500 truncate">{a.value}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0">{fmtWhen(a.at)}</div>
                </li>
              ))}
            </ul>
          )}
      </DashPanel>

      <div className="grid md:grid-cols-3 gap-3">
        <QuickLink href="/trainer/courses" icon={<BookOpen className="w-5 h-5" />} title="Manage Courses" subtitle="Modules · lessons · assignments" />
        <QuickLink href="/trainer/quizzes" icon={<Zap className="w-5 h-5" />} title="Manage Quizzes" subtitle="Live · self-paced · exams" />
        <QuickLink href="/trainer/question-banks" icon={<Trophy className="w-5 h-5" />} title="Question Banks" subtitle="Reusable question pools" />
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

function fmtWhen(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}
