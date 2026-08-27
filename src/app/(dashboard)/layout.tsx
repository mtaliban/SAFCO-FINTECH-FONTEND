'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth';
import { isAuthenticated } from '@/lib/auth';
import { Loader2, Menu, Bell } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useNotifications } from '@/lib/notifications/hook';
import { AiTutorWidget } from '@/components/ai/AiTutorWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const role = user?.roles?.[0];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (!user) fetchMe();
  }, [user, fetchMe, router]);

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar — hidden on lg+ */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 shrink-0 z-30 relative">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex justify-center">
            <Logo width={100} height={30} href="/dashboard" />
          </div>

          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center px-1 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* AI Tutor — available for students */}
      {role === 'student' && <AiTutorWidget />}
    </div>
  );
}
