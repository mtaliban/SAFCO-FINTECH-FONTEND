'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { apiRequest } from '@/lib/api';

const schema = z.object({
  identifier: z.string().min(3, 'Weka email au namba ya simu'),
  password: z.string().min(6, 'Password lazima iwe angalau alama 6'),
});
type FormData = z.infer<typeof schema>;

const ROLE_LANDING: Record<string, string> = {
  system_admin:     '/admin',
  trainer:          '/trainer',
  facilitator:      '/trainer',
  student:          '/student',
  corporate_client: '/corporate',
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [showPw, setShowPw] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'microsoft' | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await login(data.identifier, data.password, 'web');
      toast.success(`Karibu, ${res.user.profile?.first_name || res.user.email}!`);
      router.push(ROLE_LANDING[res.user.roles?.[0] ?? ''] ?? '/dashboard');
    } catch {
      // handled by axios interceptor
    }
  }

  async function handleSocial(provider: 'google' | 'microsoft') {
    setSocialLoading(provider);
    try {
      const res = await apiRequest.get<{ redirect_url: string }>(`/auth/social/${provider}`);
      window.location.href = res.redirect_url;
    } catch {
      setSocialLoading(null);
      toast.error('Social login unavailable. Try email login.');
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Karibu tena</h2>
        <p className="text-slate-500 mt-1.5 text-sm">Ingia kwenye SAFCO FINTECH LMS</p>
      </div>

      {/* Social buttons */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => handleSocial('google')}
          disabled={!!socialLoading}
          className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed select-none"
        >
          {socialLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
          Ingia na Google
        </button>

        <button
          type="button"
          onClick={() => handleSocial('microsoft')}
          disabled={!!socialLoading}
          className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed select-none"
        >
          {socialLoading === 'microsoft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MicrosoftIcon />}
          Ingia na Microsoft
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            au ingia na email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email au Namba ya Simu</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="email@mfano.com"
              className="input pl-10"
              autoComplete="username"
              {...register('identifier')}
            />
          </div>
          {errors.identifier && <p className="text-red-600 text-xs mt-1.5">{errors.identifier.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="label mb-0">Password</label>
            <Link href="/forgot-password" className="text-xs text-navy-500 hover:text-orange-600 font-semibold transition-colors">
              Umesahau?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              className="input pl-10 pr-10"
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-600 text-xs mt-1.5">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-11 text-sm font-bold flex items-center justify-center gap-2 mt-2"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><span>Ingia</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Huna account?{' '}
        <Link href="/register" className="text-navy-500 font-bold hover:text-orange-600 transition-colors">
          Jisajili bure
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}
