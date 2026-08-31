'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth';
import { isAuthenticated } from '@/lib/auth';
import { Loader2, Menu, Bell, CheckCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { AiTutorWidget } from '@/components/ai/AiTutorWidget';
import { useNotifications } from '@/lib/notifications/hook';
import type { InboxItem } from '@/lib/notifications/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const role = user?.roles?.[0];
  const { unreadCount, items, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

        {/* Top bar — unified for mobile + desktop */}
        <header className="flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 shrink-0 z-30 relative">
          {/* Hamburger — mobile only */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo — mobile only (desktop has it in sidebar) */}
          <div className="lg:hidden flex-1 flex justify-center">
            <Logo width={100} height={30} href="/dashboard" />
          </div>

          {/* Desktop: push bell to the right */}
          <div className="hidden lg:block flex-1" />

          {/* Notification bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <NotificationDropdown
                items={items}
                unreadCount={unreadCount}
                onMarkRead={(id) => markRead(id)}
                onMarkAll={() => markAllRead()}
                onNavigate={(url) => { setBellOpen(false); router.push(url); }}
                onClose={() => setBellOpen(false)}
              />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {role === 'student' && <AiTutorWidget />}
    </div>
  );
}

function NotificationDropdown({ items, unreadCount, onMarkRead, onMarkAll, onNavigate, onClose }: {
  items: InboxItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
  onNavigate: (url: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="font-bold text-slate-900 text-sm">
          Notifications {unreadCount > 0 && <span className="text-brand-600">({unreadCount})</span>}
        </span>
        {unreadCount > 0 && (
          <button onClick={onMarkAll} className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1">
            <CheckCheck className="w-3 h-3" /> Soma zote
          </button>
        )}
      </div>

      {/* Items */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Hakuna notifications mpya.
          </div>
        ) : (
          items.slice(0, 15).map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onMarkRead(n.id);
                if (n.action_url) onNavigate(n.action_url);
                else onClose();
              }}
              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition flex items-start gap-2 ${!n.read_at ? 'bg-brand-50/40' : ''}`}
            >
              {!n.read_at && <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-500 shrink-0 animate-pulse" />}
              <div className={`flex-1 min-w-0 ${n.read_at ? 'pl-4' : ''}`}>
                <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{n.title}</p>
                {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-[10px] text-slate-400 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString('sw-TZ') : ''}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 15 && (
        <div className="px-4 py-2 border-t border-slate-100 text-center">
          <button
            onClick={() => onNavigate('/dashboard/notifications')}
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold w-full py-1"
          >
            Angalia notifications zote →
          </button>
        </div>
      )}
    </div>
  );
}
