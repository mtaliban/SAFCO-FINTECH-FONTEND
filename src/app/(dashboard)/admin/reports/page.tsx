'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, BarChart3, Users, BookOpen, Zap, Building2, Activity, Award,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  StatCard, DashDonut, DashPanel, EmptyChart, COLORS,
} from '@/components/dashboard';

/**
 * SRS 3.1 admin "System Reports" — system-wide roll-up using the admin/stats endpoint.
 * Purpose: give an admin one place to see health of the whole platform.
 */

interface AdminStats {
  users: { total: number; active: number; pending?: number; by_role: Record<string, number> };
  quizzes: { total: number; published: number; draft: number };
  sessions: { total: number; active: number; completed: number };
  organizations: number;
  recent_logins_24h: number;
}

export default function AdminReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiRequest.get<AdminStats>('/admin/stats'),
  });

  if (isLoading || !data) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  const roleData = Object.entries(data.users.by_role).map(([role, count]) => ({
    name: role.replace('_', ' '), value: count,
  }));

  const quizStatusData = [
    { name: 'Published', value: data.quizzes.published, color: COLORS.green },
    { name: 'Draft', value: data.quizzes.draft, color: COLORS.amber },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-orange-500" /> System Reports
        </h1>
        <p className="text-slate-600 mt-1">Platform-wide health snapshot (SRS Module 11 · 3.1).</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Users" value={data.users.total} icon={<Users className="w-5 h-5" />} accent="brand" />
        <StatCard label="Quizzes" value={data.quizzes.total} icon={<Zap className="w-5 h-5" />} accent="navy" />
        <StatCard label="Live Sessions" value={data.sessions.total} icon={<Activity className="w-5 h-5" />} accent="purple" />
        <StatCard label="Organizations" value={data.organizations} icon={<Building2 className="w-5 h-5" />} accent="amber" />
        <StatCard label="Logins (24h)" value={data.recent_logins_24h} icon={<Activity className="w-5 h-5" />} accent="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DashPanel title="Users by Role">
          {roleData.length === 0
            ? <EmptyChart msg="No users yet." />
            : <DashDonut data={roleData} />}
        </DashPanel>
        <DashPanel title="Quiz Publication Status">
          {data.quizzes.total === 0
            ? <EmptyChart msg="No quizzes yet." />
            : <DashDonut data={quizStatusData} />}
        </DashPanel>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <QuickLink href="/admin/certificates" icon={<Award className="w-5 h-5" />} title="All Certificates" subtitle="Search + revoke" />
        <QuickLink href="/admin/course-approvals" icon={<BookOpen className="w-5 h-5" />} title="Course Approvals" subtitle="Review pending submissions" />
        <QuickLink href="/admin/audit-log" icon={<Activity className="w-5 h-5" />} title="Audit Log" subtitle="Security + admin actions" />
      </div>

      <div className="card p-4 text-xs text-slate-500 flex items-center gap-2">
        <ExternalLink className="w-3 h-3" />
        For per-role deep-dives, visit each role's dashboard (student/trainer/corporate) directly.
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
    </Link>
  );
}
