'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, User, LogOut, GraduationCap,
  Zap, Users, Activity, BarChart3, BookOpen, Award, Building2,
  ClipboardList, UserPlus, Layers, QrCode, Library, CreditCard, Star,
  MessagesSquare, X, ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { useNotifications } from '@/lib/notifications/hook';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const adminNav: NavItem[] = [
  { href: '/admin',                      label: 'Dashboard',            icon: Home },
  { href: '/admin/users',                label: 'Users',                icon: Users },
  { href: '/admin/audit-log',            label: 'Audit Log',            icon: Activity },
  { href: '/admin/course-approvals',     label: 'Course Approvals',     icon: BookOpen },
  { href: '/admin/quizzes',              label: 'All Quizzes',          icon: Zap },
  { href: '/admin/certificates',         label: 'Certificates',         icon: Award },
  { href: '/admin/trainer-verifications',label: 'Trainer Verifications',icon: ShieldCheck },
  { href: '/admin/announcements',        label: 'Announcements',        icon: MessagesSquare },
  { href: '/admin/reports',              label: 'System Reports',       icon: BarChart3 },
  { href: '/billing',                    label: 'All Invoices',         icon: CreditCard },
  { href: '/dashboard/profile',          label: 'My Profile',           icon: User },
];

const trainerNav: NavItem[] = [
  { href: '/trainer',                    label: 'Dashboard',            icon: Home },
  { href: '/trainer/courses',            label: 'My Courses',           icon: BookOpen },
  { href: '/trainer/quizzes',            label: 'My Quizzes',           icon: Zap },
  { href: '/trainer/question-banks',     label: 'Question Banks',       icon: Library },
  { href: '/trainer/attendance',         label: 'Attendance',           icon: QrCode },
  { href: '/trainer/sessions',           label: 'Session History',      icon: ClipboardList },
  { href: '/trainer/students',           label: 'My Students',          icon: Users },
  { href: '/trainer/portal',             label: 'Trainer Portal',       icon: ShieldCheck },
  { href: '/forum',                      label: 'Discussion Forum',     icon: MessagesSquare },
  { href: '/dashboard/profile',          label: 'My Profile',           icon: User },
];

const facilitatorNav: NavItem[] = [
  { href: '/dashboard',                  label: 'Dashboard',            icon: Home },
  { href: '/trainer/sessions',           label: 'Live Sessions',        icon: ClipboardList },
  { href: '/dashboard/profile',          label: 'My Profile',           icon: User },
];

const studentNav: NavItem[] = [
  { href: '/student',                    label: 'Dashboard',            icon: Home },
  { href: '/student/courses',            label: 'Browse Courses',       icon: BookOpen },
  { href: '/trainers',                   label: 'Browse Trainers',      icon: Star },
  { href: '/student/my-courses',         label: 'My Courses',           icon: Layers },
  { href: '/student/available',          label: 'Live Quizzes',         icon: Zap },
  { href: '/student/exams',              label: 'Examinations',         icon: GraduationCap },
  { href: '/student/assignments',        label: 'Assignments',          icon: ClipboardList },
  { href: '/student/attempts',           label: 'My Attempts',          icon: Layers },
  { href: '/student/check-in',           label: 'Check-in (QR)',        icon: QrCode },
  { href: '/student/certificates',       label: 'My Certificates',      icon: Award },
  { href: '/forum',                      label: 'Discussion Forum',     icon: MessagesSquare },
  { href: '/billing',                    label: 'Billing',              icon: CreditCard },
  { href: '/dashboard/profile',          label: 'My Profile',           icon: User },
];

const corporateNav: NavItem[] = [
  { href: '/corporate',                  label: 'Dashboard',            icon: Home },
  { href: '/corporate/employees',        label: 'My Employees',         icon: Building2 },
  { href: '/corporate/invite',           label: 'Invite Employee',      icon: UserPlus },
  { href: '/corporate/reports',          label: 'Progress Reports',     icon: BarChart3 },
  { href: '/billing',                    label: 'Billing',              icon: CreditCard },
  { href: '/dashboard/profile',          label: 'My Profile',           icon: User },
];

const ROOT_HREFS = new Set(['/admin', '/trainer', '/student', '/corporate', '/dashboard']);

function navForRole(role?: string): NavItem[] {
  switch (role) {
    case 'system_admin':     return adminNav;
    case 'trainer':          return trainerNav;
    case 'facilitator':      return facilitatorNav;
    case 'student':          return studentNav;
    case 'corporate_client': return corporateNav;
    default: return [
      { href: '/dashboard',          label: 'Dashboard', icon: Home },
      { href: '/dashboard/profile',  label: 'My Profile', icon: User },
    ];
  }
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { countForRoute } = useNotifications();

  const role = user?.roles?.[0];
  const items = navForRole(role);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside className={cn(
      'w-64 bg-white border-r border-slate-200 flex flex-col shrink-0',
      'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
      'lg:static lg:translate-x-0 lg:z-auto lg:transition-none',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    )}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <Logo width={120} height={36} href={items[0]?.href ?? '/dashboard'} />
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition shrink-0"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const isRoot = ROOT_HREFS.has(href);
          const active = isRoot
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');

          // Badge: notifications that match this route's prefix
          const badge = isRoot ? 0 : countForRoute(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-white shadow-sm border border-orange-200 text-orange-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className={cn(
                'w-[18px] h-[18px] shrink-0 transition-colors',
                active ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600',
              )} />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span className={cn(
                  'shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none',
                  active
                    ? 'bg-orange-500 text-white'
                    : 'bg-red-500 text-white',
                )}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition mb-1 cursor-default">
          <div className="w-9 h-9 rounded-full bg-navy-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {(user?.profile?.first_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">
              {user?.profile?.full_name ?? user?.email ?? 'User'}
            </div>
            <div className="text-[11px] text-orange-600 font-semibold capitalize truncate">
              {role?.replace(/_/g, ' ') ?? 'User'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
