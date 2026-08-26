'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Award, GraduationCap, TrendingUp, ArrowRight,
  Trophy, CheckCircle2, XCircle, Zap, Loader2, Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, type WindowDays } from '@/lib/dashboard/api';
import {
  HeroMetric, StatCard, DashAreaChart, DashPanel, RingProgress,
  ProgressBar, EmptyChart, WindowPicker, StatCardSkeleton, ChartSkeleton, COLORS,
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
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Hero skeleton */}
        <div className="h-52 animate-pulse" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)' }} />
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
  const trend = data.score_trend.map((t) => ({
    label: t.quiz_name.length > 14 ? t.quiz_name.slice(0, 14) + '…' : t.quiz_name,
    score: t.percentage,
  }));
  const completionRate = h.enrolled_count > 0
    ? Math.round((h.completed_count / h.enrolled_count) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO BANNER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-2">
                <GraduationCap className="w-3.5 h-3.5" /> SAFCO FINTECH LMS · Student Portal
              </div>
              <h1 className="text-3xl font-black text-white">Karibu, {firstName}!</h1>
              <div className="flex items-center gap-1.5 text-blue-200 text-sm mt-1">
                <Calendar className="w-3.5 h-3.5" /> {today}
              </div>
            </div>
            <WindowPicker value={days} onChange={setDays} variant="dark" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeroMetric icon={<BookOpen className="w-4 h-4" />} label="Enrolled" value={h.enrolled_count} />
            <HeroMetric icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" value={h.completed_count} />
            <HeroMetric
              icon={<TrendingUp className="w-4 h-4" />}
              label="Avg Score"
              value={h.avg_score_percent !== null ? h.avg_score_percent.toFixed(1) : null}
              suffix="%"
            />
            <HeroMetric icon={<Award className="w-4 h-4" />} label="Certificates" value={h.certificates_earned} />
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">

        {/* KPI row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Courses Enrolled" value={h.enrolled_count} icon={<BookOpen className="w-4 h-4" />} accent="brand" />
          <StatCard label="Courses Completed" value={h.completed_count} icon={<CheckCircle2 className="w-4 h-4" />} accent="green" />
          <StatCard
            label="Average Score"
            value={h.avg_score_percent !== null ? h.avg_score_percent.toFixed(1) : null}
            suffix="%"
            icon={<TrendingUp className="w-4 h-4" />}
            accent="navy"
          />
          <StatCard label="Certificates Earned" value={h.certificates_earned} icon={<Award className="w-4 h-4" />} accent="amber" />
        </div>

        {/* Score trend + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashPanel
              title="Academic Performance Trend"
              subtitle={`Last ${data.score_trend.length} quiz attempts — target 80%`}
              accent="brand"
              right={
                <Link href="/student/attempts" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
                  Full history →
                </Link>
              }
            >
              {trend.length === 0
                ? <EmptyChart msg="No attempts yet. Complete a quiz to see your performance trend here." />
                : (
                  <>
                    <DashAreaChart data={trend} xKey="label" lineKey="score" height={220} color={COLORS.brand} />
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Pass (≥ passing mark)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Below passing mark
                      </span>
                    </div>
                  </>
                )}
            </DashPanel>
          </div>

          <DashPanel title="Recent Activity" subtitle="Latest submissions & certificates">
            {data.recent_activity.length === 0
              ? <EmptyChart msg="No activity yet." />
              : (
                <ul className="space-y-3">
                  {data.recent_activity.map((a, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                        a.type === 'certificate' ? 'bg-amber-100'
                          : a.passed ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {a.type === 'certificate'
                          ? <Trophy className="w-3.5 h-3.5 text-amber-600" />
                          : a.passed
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 truncate leading-tight">{a.title ?? '—'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{a.value}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0 mt-0.5">{fmtWhen(a.at)}</div>
                    </li>
                  ))}
                </ul>
              )}
          </DashPanel>
        </div>

        {/* Completion overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
            <RingProgress percent={completionRate} size={72} strokeWidth={7} color={COLORS.green} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Completion Rate</div>
              <div className="text-2xl font-black text-slate-900">{completionRate}%</div>
              <div className="text-xs text-slate-500 mt-1">
                {h.completed_count} of {h.enrolled_count} courses done
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Avg Score</div>
              <div className="text-2xl font-black text-slate-900">
                {h.avg_score_percent !== null ? `${h.avg_score_percent.toFixed(1)}%` : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Across all quiz attempts</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Award className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Certificates</div>
              <div className="text-2xl font-black text-slate-900">{h.certificates_earned}</div>
              <Link href="/student/certificates" className="text-xs text-orange-600 hover:underline mt-1 block">
                View all →
              </Link>
            </div>
          </div>
        </div>

        {/* My Courses */}
        <DashPanel
          title="My Learning Journey"
          subtitle={`${data.enrollments.length} enrolled course${data.enrollments.length !== 1 ? 's' : ''}`}
          accent="navy"
          right={
            <Link href="/student/my-courses" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
              My Courses →
            </Link>
          }
        >
          {data.enrollments.length === 0 ? (
            <div className="py-10 text-center">
              <GraduationCap className="w-14 h-14 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 mb-5 text-sm">Haujajiunga na kozi bado.</p>
              <Link href="/student/courses" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {data.enrollments.map((e, idx) => {
                const pct = Number(e.progress_percentage ?? 0);
                const done = !!e.completed_at;
                return (
                  <div key={e.course_id ?? idx}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition group">
                    <RingProgress
                      percent={pct}
                      size={56}
                      strokeWidth={5}
                      color={done ? COLORS.green : COLORS.brand}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate text-sm group-hover:text-orange-700 transition">
                        {e.course_title ?? 'Untitled'}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mt-0.5">
                        {e.course_category ?? 'General'}
                      </div>
                      <div className="mt-2">
                        <ProgressBar
                          percent={pct}
                          colorClass={done ? 'bg-emerald-500' : 'bg-orange-500'}
                        />
                      </div>
                      {done && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashPanel>

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <QuickLink href="/student/courses" icon={<BookOpen className="w-5 h-5" />} title="Browse Courses" subtitle="Angalia kozi mpya zilizopo" color="bg-blue-50 text-blue-600" />
            <QuickLink href="/student/exams" icon={<GraduationCap className="w-5 h-5" />} title="Take an Exam" subtitle="Practice · Mock · Final Certification" color="bg-orange-50 text-orange-600" />
            <QuickLink href="/play" icon={<Zap className="w-5 h-5" />} title="Join Live Quiz" subtitle="Ingiza PIN kutoka kwa mwalimu" color="bg-emerald-50 text-emerald-600" />
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
