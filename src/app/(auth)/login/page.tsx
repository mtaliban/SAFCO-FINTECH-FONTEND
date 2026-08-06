'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  identifier: z.string().min(3, 'Weka email au namba ya simu'),
  password: z.string().min(6, 'Password lazima iwe angalau alama 6'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const res = await login(data.identifier, data.password, 'web');
      toast.success(`Karibu, ${res.user.profile?.first_name || res.user.email}!`);
      router.push('/dashboard');
    } catch {
      // toast already shown by axios interceptor
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Karibu tena 👋</h2>
        <p className="text-slate-600 mt-2">Ingia kwenye SAFCO FINTECH LMS</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label">Email au Namba ya Simu</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="admin@safcofintech.co.tz"
              className="input pl-10"
              {...register('identifier')}
            />
          </div>
          {errors.identifier && <p className="text-red-600 text-sm mt-1">{errors.identifier.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label className="label">Password</label>
            <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">
              Umeisahau?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input pl-10 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingia'}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-50 px-2 text-slate-400">au</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href="http://localhost:8000/api/v1/auth/social/google"
            className="btn-secondary"
          >
            <span className="text-lg">🌐</span> Google
          </a>
          <a
            href="http://localhost:8000/api/v1/auth/social/microsoft"
            className="btn-secondary"
          >
            <span className="text-lg">🪟</span> Microsoft
          </a>
        </div>
      </form>

      <p className="text-center text-sm text-slate-600 mt-8">
        Huna account?{' '}
        <Link href="/register" className="text-brand-600 font-semibold hover:underline">
          Jisajili sasa
        </Link>
      </p>

      <div className="mt-8 p-4 rounded-lg bg-brand-50 border border-brand-200 text-xs text-brand-800">
        <strong className="block mb-1">Test credentials (from seeder):</strong>
        Admin: <code>admin@safcofintech.co.tz</code> / <code>Admin@2026!</code><br />
        Trainer: <code>yustino.nyendeza@safcofintech.co.tz</code> / <code>Trainer@2026!</code>
      </div>
    </div>
  );
}
