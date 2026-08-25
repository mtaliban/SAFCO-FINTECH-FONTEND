'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, User, ShieldCheck, History, LogOut, GraduationCap,
  Zap, Users, Activity, BarChart3, BookOpen, Award, Building2,
  ClipboardList, UserPlus, Layers, QrCode, Library, CreditCard, Star,
  MessagesSquare, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

// Menu za SRS 3.1 System Administrator: Manage users · Configure system · Approve courses ·
// Manage subscriptions · Generate reports · System-wide audit log
const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/audit-log', label: 'Audit Log (Security)', icon: Activity },
  { href: '/admin/course-approvals', label: 'Course Approvals', icon: BookOpen },
  { href: '/admin/quizzes', label: 'All Quizzes', icon: Zap },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
  { href: '/admin/trainer-verifications', label: 'Trainer Verifications', icon: ShieldCheck },
  { href: '/admin/announcements', label: 'Announcements', icon: MessagesSquare },
  { href: '/admin/reports', label: 'System Reports', icon: BarChart3 },
  { href: '/billing', label: 'All Invoices', icon: CreditCard },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/security', label: 'My 2FA', icon: ShieldCheck },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
];

// SRS 3.2 Trainer: Create courses · Upload materials · Create quizzes · Manage students · Monitor progress
const trainerNav: NavItem[] = [
  { href: '/trainer', label: 'Dashboard', icon: Home },
  { href: '/trainer/courses', label: 'My Courses', icon: BookOpen },
  { href: '/trainer/quizzes', label: 'My Quizzes', icon: Zap },
  { href: '/trainer/question-banks', label: 'Question Banks', icon: Library },
  { href: '/trainer/attendance', label: 'Attendance', icon: QrCode },
  { href: '/trainer/sessions', label: 'Session History', icon: ClipboardList },
  { href: '/trainer/students', label: 'My Students', icon: Users },
  { href: '/trainer/portal', label: 'Trainer Portal', icon: ShieldCheck },
  { href: '/forum', label: 'Discussion Forum', icon: MessagesSquare },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/security', label: 'My 2FA', icon: ShieldCheck },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
];

// SRS 3.2 Facilitator: helps trainer run sessions
const facilitatorNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/trainer/sessions', label: 'Live Sessions', icon: ClipboardList },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/security', label: 'My 2FA', icon: ShieldCheck },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
];

// SRS 3.3 Student: Enroll · Attempt quizzes · Download certificates · Track progress
const studentNav: NavItem[] = [
  { href: '/student', label: 'Dashboard', icon: Home },
  { href: '/student/courses', label: 'Browse Courses', icon: BookOpen },
  { href: '/trainers', label: 'Browse Trainers', icon: Star },
  { href: '/student/my-courses', label: 'My Courses', icon: Layers },
  { href: '/student/available', label: 'Live Quizzes', icon: Zap },
  { href: '/student/exams', label: 'Examinations', icon: GraduationCap },
  { href: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/student/attempts', label: 'My Attempts', icon: Layers },
  { href: '/student/check-in', label: 'Check-in (QR)', icon: QrCode },
  { href: '/student/certificates', label: 'My Certificates', icon: Award },
  { href: '/forum', label: 'Discussion Forum', icon: MessagesSquare },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/security', label: 'My 2FA', icon: ShieldCheck },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/history', label: 'My Login History', icon: History },
];

// SRS 3.4 Corporate Client: Enroll employees · Monitor staff progress · Download reports
const corporateNav: NavItem[] = [
  { href: '/corporate', label: 'Dashboard', icon: Home },
  { href: '/corporate/employees', label: 'My Employees', icon: Building2 },
  { href: '/corporate/invite', label: 'Invite Employee', icon: UserPlus },
  { href: '/corporate/reports', label: 'Progress Reports', icon: BarChart3 },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/security', label: 'My 2FA', icon: ShieldCheck },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
];

function navForRole(role?: string): NavItem[] {
  switch (role) {
    case 'system_admin': return adminNav;
    case 'trainer': return trainerNav;
    case 'facilitator': return facilitatorNav;
    case 'student': return studentNav;
    case 'corporate_client': return corporateNav;
    default: return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/dashboard/profile', label: 'My Profile', icon: User },
    ];
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const role = user?.roles?.[0];
  const items = navForRole(role);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <Logo width={140} height={42} href={items[0]?.href ?? '/dashboard'} />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          // Exact match for dashboard-root routes (/admin, /trainer, /student, /corporate, /dashboard)
          const isRoot = ['/admin', '/trainer', '/student', '/corporate', '/dashboard'].includes(href);
          const active = isRoot
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');
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
        {role && (
          <div className="mb-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
            <GraduationCap className="w-3 h-3" />
            {role.replace('_', ' ')}
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
