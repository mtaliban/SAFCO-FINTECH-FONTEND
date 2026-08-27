'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, ShieldCheck, CheckCircle2, XCircle, ArrowRight,
  BookOpen, Trophy, Zap, MessageSquare, Bell, User, BarChart2,
  CreditCard, Briefcase, ClipboardList, Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const ROLE_REDIRECTS: Record<string, string> = {
  student:          '/student',
  trainer:          '/trainer',
  
  system_admin:     '/admin',
  corporate_client: '/corporate',
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = user?.roles?.[0] ?? 'student';
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  // Auto-redirect role-specific dashboard users
  useEffect(() => {
    const target = ROLE_REDIRECTS[role];
    if (target) {
      router.replace(target);
    }
  }, [role, router]);

  const firstName = user?.profile?.first_name ?? user?.email?.split('@')[0] ?? 'Mtumiaji';
  const completionPct = user?.profile?.completion_percentage ?? 0;

  // Role-based quick-access tiles
  const tiles = getRoleTiles(role);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f2a50 0%, #1e4080 50%, #0f2a50 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 lg:py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-2">
                <GraduationCap className="w-3.5 h-3.5" /> SAFCO FINTECH LMS
              </div>
              <h1 className="text-2xl sm:text-2xl sm:text-3xl font-black text-white leading-tight">
                Karibu, {firstName}!
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {today}
              </p>
            </div>

            {/* Account status pills */}
            <div className="flex flex-col gap-2 items-end">
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${
                user?.status === 'active'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-red-500/20 border-red-400/40 text-red-300'
              }`}>
                {user?.status === 'active'
                  ? <><CheckCircle2 className="w-3 h-3" /> Active account</>
                  : <><XCircle className="w-3 h-3" /> {user?.status}</>
                }
              </div>
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${
                user?.two_factor?.enabled
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {user?.two_factor?.enabled ? '2FA Enabled' : '2FA Off — enable for security'}
              </div>
            </div>
          </div>

          {/* Profile completion bar */}
          {completionPct < 100 && (
            <div className="mt-6 bg-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm font-semibold">Profile completion</span>
                  <Link href="/dashboard/profile"
                    className="text-orange-400 hover:text-orange-300 text-xs font-bold flex items-center gap-1 transition">
                    Complete <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${completionPct}%`,
                      background: 'linear-gradient(90deg, #f5a623, #f97316)',
                    }}
                  />
                </div>
              </div>
              <span className="text-2xl font-black text-white shrink-0">{completionPct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK-ACCESS TILES ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Quick access</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-orange-200 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${tile.iconBg}`}>
                <tile.icon className={`w-5 h-5 ${tile.iconColor}`} />
              </div>
              <div className="font-bold text-slate-900 text-sm leading-snug">{tile.label}</div>
              <div className="text-xs text-slate-500 mt-1 leading-snug">{tile.desc}</div>
              <div className="flex items-center gap-1 mt-3 text-orange-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* Security nudge */}
        {!user?.two_factor?.enabled && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">Ongeza usalama wa akaunti yako</div>
              <div className="text-xs text-amber-700 mt-1">
                Washa Two-Factor Authentication (2FA) kulinda akaunti yako dhidi ya ufikiaji usioruhusiwa.
              </div>
            </div>
            <Link href="/dashboard/security"
              className="shrink-0 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition">
              Enable 2FA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function getRoleTiles(role: string) {
  const common = [
    { href: '/notifications', label: 'Notifications', desc: 'Arifa na ujumbe', icon: Bell, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
    { href: '/forum', label: 'Forum', desc: 'Maswali na majadiliano', icon: MessageSquare, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
    { href: '/dashboard/profile', label: 'My Profile', desc: 'Taarifa za kibinafsi', icon: User, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { href: '/dashboard/security', label: 'Security', desc: '2FA na usalama', icon: ShieldCheck, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  ];

  const byRole: Record<string, typeof common> = {
    student: [
      { href: '/student', label: 'My Dashboard', desc: 'Maendeleo na takwimu', icon: BarChart2, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
      { href: '/student/courses', label: 'Browse Courses', desc: 'Tafuta kozi mpya', icon: BookOpen, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
      { href: '/student/my-courses', label: 'My Courses', desc: 'Kozi ulizojiandikisha', icon: GraduationCap, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
      { href: '/student/exams', label: 'Exams', desc: 'Majaribio na mitihani', icon: ClipboardList, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
      { href: '/student/assignments', label: 'Assignments', desc: 'Kazi za ziada', icon: Briefcase, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
      { href: '/student/certificates', label: 'Certificates', desc: 'Vyeti vyako', icon: Trophy, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
      { href: '/play', label: 'Live Quiz', desc: 'Ingia kwa PIN', icon: Zap, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
      { href: '/billing', label: 'Billing', desc: 'Ankara na malipo', icon: CreditCard, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
    ],
    trainer: [
      { href: '/trainer', label: 'Trainer Dashboard', desc: 'Muhtasari wa shughuli', icon: BarChart2, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
      { href: '/trainer/courses', label: 'My Courses', desc: 'Dhibiti kozi zako', icon: BookOpen, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
      { href: '/trainer/quizzes', label: 'Quizzes', desc: 'Unda na simamia', icon: ClipboardList, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
      { href: '/trainer/question-banks', label: 'Question Banks', desc: 'Hifadhi ya maswali', icon: Briefcase, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
      { href: '/trainer/attendance', label: 'Attendance', desc: 'Hali ya washiriki', icon: Calendar, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
      { href: '/trainer/sessions', label: 'Live Sessions', desc: 'Historia ya quiz live', icon: Zap, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
      { href: '/trainer/portal', label: 'Trainer Profile', desc: 'Sifa na vyeti', icon: Trophy, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    ],
    system_admin: [
      { href: '/admin', label: 'Admin Overview', desc: 'Takwimu za mfumo', icon: BarChart2, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
      { href: '/admin/users', label: 'Users', desc: 'Dhibiti watumiaji', icon: User, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
      { href: '/admin/course-approvals', label: 'Approvals', desc: 'Kozi zinazongoja', icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
      { href: '/admin/certificates', label: 'Certificates', desc: 'Vyeti vyote', icon: Trophy, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
      { href: '/admin/trainer-verifications', label: 'Verifications', desc: 'Thibitisha washauri', icon: ShieldCheck, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
      { href: '/admin/reports', label: 'Reports', desc: 'Ripoti za mfumo', icon: ClipboardList, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
      { href: '/admin/announcements', label: 'Announcements', desc: 'Matangazo kwa wote', icon: Bell, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    ],
    corporate_client: [
      { href: '/corporate', label: 'Corporate Dashboard', desc: 'Takwimu za shirika', icon: BarChart2, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
      { href: '/corporate/employees', label: 'Employees', desc: 'Wafanyakazi wote', icon: User, iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
      { href: '/corporate/reports', label: 'Reports', desc: 'Ripoti za idara', icon: ClipboardList, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
      { href: '/billing', label: 'Billing', desc: 'Ankara za kampuni', icon: CreditCard, iconBg: 'bg-navy-50', iconColor: 'text-navy-500' },
    ],
  };

  const roleTiles = byRole[role] ?? byRole.student;
  return [...roleTiles, ...common];
}
