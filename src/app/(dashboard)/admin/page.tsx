'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Zap, Activity, Building2, Layers, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

type Stats = {
  users: { total: number; active: number; pending: number; by_role: Record<string, number> };
  quizzes: { total: number; published: number; draft: number };
  sessions: { total: number; active: number; completed: number };
  organizations: number;
  recent_logins_24h: number;
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiRequest.get<Stats>('/admin/stats'),
  });

  if (isLoading || !data) {
    return <div className="p-4 sm:p-6 lg:p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-2xl sm:text-3xl font-bold text-slate-900">System Administrator</h1>
        <p className="text-slate-600 mt-1">Simamia mfumo mzima wa SAFCO FINTECH LMS.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <StatCard label="Total Users" value={data.users.total} icon={Users} accent="brand" />
        <StatCard label="Active Users" value={data.users.active} icon={Users} accent="green" />
        <StatCard label="Total Quizzes" value={data.quizzes.total} icon={Zap} accent="amber" />
        <StatCard label="Organizations" value={data.organizations} icon={Building2} accent="slate" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6 lg:mb-8">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Users by Role</h2>
          <div className="space-y-2">
            {Object.entries(data.users.by_role).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700 capitalize">{role.replace('_', ' ')}</span>
                <span className="font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Sessions & Activity</h2>
          <div className="space-y-2 text-sm">
            <Row label="Total sessions" value={data.sessions.total} />
            <Row label="Currently active" value={data.sessions.active} />
            <Row label="Completed" value={data.sessions.completed} />
            <Row label="Logins (24h)" value={data.recent_logins_24h} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickLink href="/admin/users" icon={Users} title="Manage Users" desc="View, activate, change roles" />
        <QuickLink href="/admin/audit-log" icon={Activity} title="Audit Log" desc="Every login, IP + device" />
        <QuickLink href="/admin/quizzes" icon={Layers} title="All Quizzes" desc="System-wide read-only view" />
        <QuickLink href="/admin/settings" icon={Settings} title="Configure System" desc="Policies, defaults, notifications" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: 'brand' | 'green' | 'amber' | 'slate' }) {
  const bg = { brand: 'bg-orange-50 text-orange-500', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', slate: 'bg-slate-100 text-slate-500' }[accent];
  return (
    <div className="card p-5">
      <div className={`inline-flex w-10 h-10 rounded-lg items-center justify-center ${bg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-3 text-xs text-slate-500 uppercase font-semibold tracking-wider">{label}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between py-1 border-b border-slate-100 last:border-0"><span className="text-slate-700">{label}</span><span className="font-bold text-slate-900">{value}</span></div>;
}
function QuickLink({ href, icon: Icon, title, desc }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md hover:border-orange-200 transition group">
      <Icon className="w-6 h-6 text-orange-500 mb-3 group-hover:scale-110 transition" />
      <div className="font-bold text-slate-900">{title}</div>
      <div className="text-sm text-slate-500">{desc}</div>
    </Link>
  );
}
