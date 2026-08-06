'use client';

import { useAuthStore } from '@/store/auth';
import { GraduationCap, ShieldCheck, User, Zap, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Habari, {user?.profile?.first_name ?? 'mtumiaji'} 👋
        </h1>
        <p className="text-slate-600 mt-1">Karibu SAFCO FINTECH LMS Dashboard.</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Account Status" value={user?.status ?? '-'} icon={CheckCircle2} accent="green" />
        <StatCard label="Role" value={user?.roles?.[0]?.replace('_', ' ') ?? 'student'} icon={GraduationCap} accent="brand" />
        <StatCard label="Email Verified" value={user?.email_verified ? 'Yes' : 'No'} icon={user?.email_verified ? CheckCircle2 : XCircle} accent={user?.email_verified ? 'green' : 'amber'} />
        <StatCard label="2FA Enabled" value={user?.two_factor?.enabled ? 'Yes' : 'No'} icon={ShieldCheck} accent={user?.two_factor?.enabled ? 'green' : 'slate'} />
      </div>

      {/* Profile completion */}
      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profile Completion</h2>
            <p className="text-sm text-slate-500 mt-1">Kamilisha profile yako kupata uzoefu bora zaidi.</p>
          </div>
          <Link href="/dashboard/profile" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            Complete <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-slate-700">{user?.profile?.completion_percentage ?? 0}%</span>
            <span className="text-slate-500">complete</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all"
              style={{ width: `${user?.profile?.completion_percentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Coming soon (other modules) */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: '📚 Courses', desc: 'Angalia kozi zote', href: '#', badge: 'Module 2 - Coming' },
          { title: '🎯 Live Quiz (Kahoot-style)', desc: 'Cheza quiz kwa PIN', href: '#', badge: 'Module 7 - Coming' },
          { title: '🏆 Certificates', desc: 'Vyeti vyako', href: '#', badge: 'Module 10 - Coming' },
          { title: '📊 Reports', desc: 'Angalia progress yako', href: '#', badge: 'Module 11 - Coming' },
        ].map((item) => (
          <div key={item.title} className="card p-5 opacity-60">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{item.badge}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'green' | 'brand' | 'amber' | 'slate';
}) {
  const map = {
    green: 'text-green-600 bg-green-50',
    brand: 'text-brand-600 bg-brand-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-600 bg-slate-100',
  };
  return (
    <div className="card p-5">
      <div className={`inline-flex w-10 h-10 rounded-lg items-center justify-center ${map[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-3 text-xs text-slate-500 uppercase font-semibold tracking-wider">{label}</div>
      <div className="text-lg font-bold text-slate-900 capitalize">{value}</div>
    </div>
  );
}
