'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, ShieldCheck, History, LogOut, GraduationCap, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/quizzes', label: 'Quizzes', icon: Zap },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/security', label: 'Security (2FA)', icon: ShieldCheck },
  { href: '/dashboard/history', label: 'Login History', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <Logo width={140} height={42} href="/dashboard" />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-navy-50 text-navy-500 border-l-4 border-orange-500 pl-2'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-navy-500'
              )}
            >
              <Icon className={cn('w-4 h-4', active && 'text-orange-500')} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-navy-500 text-white flex items-center justify-center font-bold">
            {(user?.profile?.first_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-navy-700 truncate">
              {user?.profile?.full_name ?? 'User'}
            </div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
        {user?.roles?.[0] && (
          <div className="mb-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
            <GraduationCap className="w-3 h-3" />
            {user.roles[0].replace('_', ' ')}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
