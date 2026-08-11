'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/auth';

const schema = z.object({
  code: z.string().length(6, 'OTP lazima iwe alama 6'),
});

type FormData = z.infer<typeof schema>;

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await authApi.verifyOtp({ identifier: email, code: data.code, type: 'email_verify' });
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  async function resendOtp() {
    await authApi.requestOtp({ identifier: email, type: 'email_verify', channel: 'email' });
    toast.success('OTP mpya imetumwa');
  }

  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Email Imethibitishwa ✅</h2>
        <p className="text-slate-600 mt-2">Karibu SAFCO FINTECH LMS!</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <h2 className="text-3xl font-bold text-slate-900">Thibitisha Email 📩</h2>
      <p className="text-slate-600 mt-2 mb-6">
        Tumetuma OTP kwenye <strong>{email}</strong>. Iweke hapa chini.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label">Namba ya OTP (alama 6)</label>
          <input
            className="input text-center tracking-widest text-2xl font-mono"
            maxLength={6}
            placeholder="000000"
            inputMode="numeric"
            {...register('code')}
          />
          {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Thibitisha'}
        </button>
      </form>

      <div className="text-center text-sm text-slate-600 mt-6">
        Hukupata OTP?{' '}
        <button onClick={resendOtp} className="text-brand-600 font-semibold hover:underline">
          Tuma tena
        </button>
        <div className="mt-2">
          <Link href="/login" className="text-brand-600 hover:underline">
            Rudi Login
          </Link>
        </div>
      </div>

      <div className="mt-8 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        💡 <strong>Dev tip:</strong> OTP inatumwa kwa <a href="http://localhost:8025" target="_blank" className="underline font-semibold">MailHog</a> (localhost:8025) kwa testing.
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-navy-500" /></div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
