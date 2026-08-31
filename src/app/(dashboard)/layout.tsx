'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth';
import { isAuthenticated } from '@/lib/auth';
import { Loader2, Menu } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { AiTutorWidget } from '@/components/ai/AiTutorWidget';
import { useNotifications } from '@/lib/notifications/hook';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = user?.roles?.[0];

  // Keep hook mounted so MQTT toasts fire for all pages
  useNotifications();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    if (!user) fetchMe();
  }, [user, fetchMe, router]);

  if (!isAuthenticated()) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar only */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 shrink-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-center">
            <Logo width={100} height={30} href="/dashboard" />
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {role === 'student' && <AiTutorWidget />}
    </div>
  );
}
