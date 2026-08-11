'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { authApi } from '@/lib/auth';

const schema = z
  .object({
    password: z.string().min(8, 'Password lazima iwe angalau alama 8'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Password hazifanani',
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await authApi.resetPassword({ email, token, ...data });
    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  if (done) {
    return (
      <div className="animate-fade-in text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Password Imesasishwa ✅</h2>
        <p className="text-slate-600 mt-2">Ingia na password mpya.</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <h2 className="text-3xl font-bold text-slate-900">Weka Password Mpya 🔐</h2>
      <p className="text-slate-600 mt-2 mb-6">Kwa akaunti <strong>{email}</strong></p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label">Password Mpya</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="password" className="input pl-10" placeholder="••••••••" {...register('password')} />
          </div>
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label">Rudia Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              className="input pl-10"
              placeholder="••••••••"
              {...register('password_confirmation')}
            />
          </div>
          {errors.password_confirmation && (
            <p className="text-red-600 text-sm mt-1">{errors.password_confirmation.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sasisha Password'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        <Link href="/login" className="text-brand-600 hover:underline">
          Rudi Login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-navy-500" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
