'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/auth';

const schema = z.object({ email: z.string().email('Email si sahihi') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await authApi.forgotPassword(data.email);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Angalia Email Yako 📬</h2>
        <p className="text-slate-600 mt-2 mb-6">
          Kama email yako imesajiliwa, tumekutumia link ya kubadilisha password.
        </p>
        <Link href="/login" className="btn-primary">
          Rudi Login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <Link href="/login" className="text-sm text-brand-600 hover:underline flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Rudi kwenye Login
      </Link>

      <h2 className="text-3xl font-bold text-slate-900">Umeisahau Password?</h2>
      <p className="text-slate-600 mt-2 mb-6">Weka email yako, tutakutumia link ya kubadilisha.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" className="input pl-10" placeholder="you@example.com" {...register('email')} />
          </div>
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tuma Link'}
        </button>
      </form>
    </div>
  );
}
