'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Layers, Award, Loader2, GraduationCap, TrendingUp, ArrowRight,
  Trophy, CheckCircle2, XCircle, Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, type WindowDays } from '@/lib/dashboard/api';
import {
  StatCard, DashLineChart, DashPanel, ProgressBar, EmptyChart,
  WindowPicker, StatCardSkeleton, ChartSkeleton, COLORS,
} from '@/components/dashboard';

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [days, setDays] = useState<WindowDays>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'student', days],
    queryFn: () => dashboardApi.student(days),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const firstName = user?.profile?.first_name ?? 'Mwanafunzi';

  if (isLoading || !data) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <StatCardSkeleton count={4} />
        <ChartSkeleton height={220} />
      </div>
    );
  }

  const h = data.headline;
  const trend = data.score_trend.map((t) => ({
    label: t.quiz_name.length > 12 ? t.quiz_name.slice(0, 12) + '…' : t.quiz_name,
    score: t.percentage,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Karibu, {firstName} 👋</h1>
          <p className="text-slate-600 mt-1">Student Dashboard (SRS Module 11 · 3.3).</p>
        </div>
        <WindowPicker value={days} onChange={setDays} />
      </div>

      {/* SRS headline stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Courses Enrolled" value={h.enrolled_count} icon={<BookOpen className="w-5 h-5" />} accent="brand" />
        <StatCard label="Courses Completed" value={h.completed_count} icon={<CheckCircle2 className="w-5 h-5" />} accent="green" />
        <StatCard label="Average Score" value={h.avg_score_percent} suffix="%" icon={<TrendingUp className="w-5 h-5" />} accent="navy" />
        <StatCard label="Certificates Earned" value={h.certificates_earned} icon={<Award className="w-5 h-5" />} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score trend */}
        <div className="lg:col-span-2">
          <DashPanel
            title="Score Trend"
            subtitle="Last 10 completed attempts"
            right={
              <Link href="/student/attempts" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
                See all →
              </Link>
            }
          >
            {trend.length === 0
              ? <EmptyChart msg="No completed attempts yet. Take a quiz to see your trend." />
              : <DashLineChart data={trend} xKey="label" lineKey="score" />}
          </DashPanel>
        </div>

        {/* Recent activity */}
        <div>
          <DashPanel title="Recent Activity">
            {data.recent_activity.length === 0
              ? <EmptyChart msg="Nothing yet." />
              : (
                <ul className="space-y-2">
                  {data.recent_activity.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5 shrink-0">
                        {a.type === 'certificate' ? <Trophy className="w-4 h-4 text-amber-500" />
                          : a.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-900 font-medium truncate">{a.title}</div>
                        <div className="text-xs text-slate-500">{a.value}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0">{fmtWhen(a.at)}</div>
                    </li>
                  ))}
                </ul>
              )}
          </DashPanel>
        </div>
      </div>

      {/* Enrollments progress */}
      <DashPanel
        title="My Courses"
        subtitle={`${data.enrollments.length} enrolled`}
        right={
          <Link href="/student/my-courses" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
            Go to My Courses →
          </Link>
        }
      >
        {data.enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 mb-4">No enrollments yet.</p>
            <Link href="/student/courses" className="btn-primary inline-flex">Browse Courses <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.enrollments.map((e) => (
              <div key={e.course_id ?? Math.random()} className="p-3 rounded-lg border border-slate-200 hover:border-brand-300 transition">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{e.course_title}</div>
                    <div className="text-xs text-slate-500">{e.course_category}</div>
                  </div>
                  <div className="text-sm font-bold text-brand-700 shrink-0">{Number(e.progress_percentage).toFixed(0)}%</div>
                </div>
                <ProgressBar percent={Number(e.progress_percentage)} colorClass={e.completed_at ? 'bg-emerald-500' : 'bg-brand-500'} />
                {e.completed_at && (
                  <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DashPanel>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-3">
        <QuickLink href="/student/courses" icon={<BookOpen className="w-5 h-5" />} title="Browse Courses" subtitle="Angalia kozi mpya" />
        <QuickLink href="/student/exams" icon={<GraduationCap className="w-5 h-5" />} title="Take an Exam" subtitle="Practice / Mock / Final" />
        <QuickLink href="/play" icon={<Zap className="w-5 h-5" />} title="Join Live Quiz" subtitle="Enter PIN kutoka mwalimu" />
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md hover:border-brand-300 transition group flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center group-hover:scale-110 transition">
        {icon}
      </div>
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
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}
