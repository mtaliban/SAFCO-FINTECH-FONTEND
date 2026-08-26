'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, Zap, TrendingUp, ArrowRight, Plus,
  CheckCircle2, XCircle, GraduationCap, Trophy, Calendar,
  Library, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, type WindowDays } from '@/lib/dashboard/api';
import {
  HeroMetric, StatCard, DashBarChart, DashDonut, DashAreaChart, DashPanel,
  ProgressBar, EmptyChart, WindowPicker, StatCardSkeleton, ChartSkeleton, COLORS,
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

  const firstName = user?.profile?.first_name ?? 'Mwalimu';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-52 animate-pulse" style={{ background: 'linear-gradient(135deg,#7c2d12 0%,#c2410c 100%)' }} />
        <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
          <StatCardSkeleton count={4} />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><ChartSkeleton height={260} /></div>
            <ChartSkeleton height={260} />
          </div>
        </div>
      </div>
    );
  }

  const h = data.headline;

  const perCourseData = data.per_course_students.map((c) => ({
    label: c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title,
    students: c.students,
    'Avg Progress %': c.avg_progress,
  }));

  const categoryData = data.category_distribution.map((c) => ({
    name: c.category, value: c.count,
  }));

  const passRateTrend = data.quiz_performance.slice(-10).map((q) => ({
    label: q.name.length > 12 ? q.name.slice(0, 12) + '…' : q.name,
    'Pass Rate': q.pass_rate,
    'Avg Score': q.avg_score ?? 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO BANNER ── */}
      <div style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)' }}>
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-orange-200 text-[11px] font-bold uppercase tracking-widest mb-2">
                <GraduationCap className="w-3.5 h-3.5" /> SAFCO FINTECH LMS · Trainer Dashboard
              </div>
              <h1 className="text-3xl font-black text-white">Karibu, {firstName}!</h1>
              <div className="flex items-center gap-1.5 text-orange-200 text-sm mt-1">
                <Calendar className="w-3.5 h-3.5" /> {today}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <WindowPicker value={days} onChange={setDays} variant="dark" />
              <Link href="/trainer/courses/new"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                <Plus className="w-4 h-4" /> New Course
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeroMetric icon={<BookOpen className="w-4 h-4" />} label="Active Courses" value={h.active_courses} />
            <HeroMetric icon={<GraduationCap className="w-4 h-4" />} label="Total Courses" value={h.total_courses} />
            <HeroMetric icon={<Users className="w-4 h-4" />} label="Students" value={h.student_count} />
            <HeroMetric
              icon={<TrendingUp className="w-4 h-4" />}
              label="Quiz Avg Score"
              value={h.avg_quiz_score_percent !== null ? h.avg_quiz_score_percent.toFixed(1) : null}
              suffix="%"
            />
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">

        {/* KPI row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Courses" value={h.active_courses} icon={<BookOpen className="w-4 h-4" />} accent="brand" />
          <StatCard label="Total Courses" value={h.total_courses} icon={<GraduationCap className="w-4 h-4" />} accent="navy" />
          <StatCard label="Student Count" value={h.student_count} icon={<Users className="w-4 h-4" />} accent="purple" />
          <StatCard
            label="Quiz Performance"
            value={h.avg_quiz_score_percent !== null ? h.avg_quiz_score_percent.toFixed(1) : null}
            suffix="%"
            icon={<TrendingUp className="w-4 h-4" />}
            accent="green"
          />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashPanel
              title="Students by Course"
              subtitle="Top 8 courses — students enrolled + avg progress"
              accent="brand"
              right={
                <Link href="/trainer/courses" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
                  Manage →
                </Link>
              }
            >
              {perCourseData.length === 0
                ? <EmptyChart msg="No enrolled students yet. Publish a course and share it with learners." />
                : <DashBarChart data={perCourseData} xKey="label" height={260} bars={[
                    { dataKey: 'students', name: 'Students', color: COLORS.brand },
                    { dataKey: 'Avg Progress %', name: 'Avg Progress %', color: COLORS.navy },
                  ]} />}
            </DashPanel>
          </div>

          <DashPanel title="By Category" subtitle="Course distribution">
            {categoryData.length === 0
              ? <EmptyChart msg="No courses yet." />
              : <DashDonut data={categoryData} height={260} />}
          </DashPanel>
        </div>

        {/* Pass rate trend */}
        {passRateTrend.length > 0 && (
          <DashPanel
            title="Quiz Pass Rate Trend"
            subtitle="Latest quizzes — pass rate % across all attempts"
            accent="green"
          >
            <DashAreaChart data={passRateTrend} xKey="label" lineKey="Pass Rate" height={200} color={COLORS.green} />
          </DashPanel>
        )}

        {/* Quiz performance table */}
        <DashPanel
          title="Quiz Performance Overview"
          subtitle={`${data.quiz_performance.length} quizzes with attempts`}
          accent="navy"
          right={
            <Link href="/trainer/quizzes" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
              All quizzes →
            </Link>
          }
        >
          {data.quiz_performance.length === 0 ? (
            <EmptyChart msg="Your quizzes have no attempts yet." />
          ) : (
            <div className="space-y-3">
              {data.quiz_performance.map((q) => {
                const passColor = q.pass_rate >= 70 ? 'bg-emerald-500' : q.pass_rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
                const typeLabel = q.exam_type ?? q.mode;
                return (
                  <div key={q.id} className="group p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 truncate text-sm">{q.name}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-bold tracking-wide">
                            {typeLabel}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {q.attempts} attempt{q.attempts !== 1 ? 's' : ''} · {q.passes} pass{q.passes !== 1 ? 'es' : ''}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-slate-900 tabular-nums">
                          {q.avg_score !== null ? `${q.avg_score}%` : '—'}
                        </div>
                        <div className="text-[9px] uppercase text-slate-400 font-bold">avg score</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Pass Rate</span>
                          <span className="text-[10px] font-bold text-slate-700">{q.pass_rate}%</span>
                        </div>
                        <ProgressBar percent={q.pass_rate} colorClass={passColor} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Score</span>
                          <span className="text-[10px] font-bold text-slate-700">{q.avg_score ?? 0}%</span>
                        </div>
                        <ProgressBar percent={q.avg_score ?? 0} colorClass="bg-orange-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashPanel>

        {/* Recent activity */}
        <DashPanel title="Recent Activity" subtitle="New enrollments and quiz attempts on your courses">
          {data.recent_activity.length === 0
            ? <EmptyChart msg="No activity yet." />
            : (
              <ul className="divide-y divide-slate-100">
                {data.recent_activity.map((a, i) => (
                  <li key={i} className="py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      a.type === 'enrollment' ? 'bg-blue-50'
                        : a.passed ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {a.type === 'enrollment'
                        ? <Users className="w-3.5 h-3.5 text-blue-600" />
                        : a.passed
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="text-slate-900 truncate font-medium">
                        {a.type === 'enrollment' ? 'New enrollment in ' : ''}<strong>{a.title ?? '—'}</strong>
                      </div>
                      {a.value && <div className="text-xs text-slate-400 truncate">{a.value}</div>}
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0">{fmtWhen(a.at)}</div>
                  </li>
                ))}
              </ul>
            )}
        </DashPanel>

        {/* Quick links */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <QuickLink href="/trainer/courses" icon={<BookOpen className="w-5 h-5" />} title="Manage Courses" subtitle="Modules · Lessons · Assignments" color="bg-blue-50 text-blue-600" />
            <QuickLink href="/trainer/quizzes" icon={<Zap className="w-5 h-5" />} title="Manage Quizzes" subtitle="Live · Self-paced · Exams" color="bg-orange-50 text-orange-600" />
            <QuickLink href="/trainer/question-banks" icon={<Library className="w-5 h-5" />} title="Question Banks" subtitle="Reusable question pools" color="bg-emerald-50 text-emerald-600" />
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
    <Link href={href} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-orange-300 transition group flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-900 text-sm">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition" />
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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
