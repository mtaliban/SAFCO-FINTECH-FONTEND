'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { saveSession } from '@/lib/auth';
import type { User } from '@/types';
import { Suspense } from 'react';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const token = params.get('token');
    const userB64 = params.get('user');
    const error = params.get('error');
    const isNew = params.get('is_new') === '1';

    if (error) {
      toast.error('Social login failed: ' + decodeURIComponent(error));
      router.replace('/login');
      return;
    }

    if (!token || !userB64) {
      toast.error('Invalid callback — missing token');
      router.replace('/login');
      return;
    }

    try {
      const user: User = JSON.parse(atob(userB64));

      saveSession({ token, user, token_type: 'Bearer', expires_at: params.get('expires_at') ?? '', requires_2fa: false });
      setUser(user);

      const role = user.roles?.[0];
      const landing: Record<string, string> = {
        system_admin:     '/admin',
        trainer:          '/trainer',
        facilitator:      '/trainer',
        student:          '/student',
        corporate_client: '/corporate',
      };

      toast.success(isNew
        ? `Karibu SAFCO FINTECH LMS, ${user.profile?.first_name ?? user.email}!`
        : `Karibu tena, ${user.profile?.first_name ?? user.email}!`
      );

      router.replace(landing[role ?? ''] ?? '/dashboard');
    } catch {
      toast.error('Could not process login response');
      router.replace('/login');
    }
  }, [params, router, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-navy-500" />
      <p className="text-slate-600 font-medium">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-navy-500" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
