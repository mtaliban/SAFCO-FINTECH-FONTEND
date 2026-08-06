'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  full_name: z.string().min(2, 'Jina lote linahitajika'),
  email: z.string().email('Email si sahihi'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password lazima iwe angalau alama 8'),
  password_confirmation: z.string(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  position: z.string().optional(),
  role: z.enum(['student', 'trainer', 'corporate_client']).default('student'),
  accept_terms: z.literal(true, { errorMap: () => ({ message: 'Kubali sheria za matumizi' }) }),
}).refine((d) => d.password === d.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Password hazifanani',
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  });

  async function onSubmit(data: FormData) {
    try {
      await register(data);
      toast.success('Umefanikiwa kujisajili! Angalia email yako kwa OTP.');
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch {
      // toast handled by interceptor
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Jisajili 🚀</h2>
        <p className="text-slate-600 mt-2">Anza safari yako ya kujifunza</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Jina Kamili</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-10" placeholder="Amina Mohamed" {...field('full_name')} />
          </div>
          {errors.full_name && <p className="text-red-600 text-sm mt-1">{errors.full_name.message}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" className="input pl-10" placeholder="amina@example.com" {...field('email')} />
            </div>
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Simu (hiari)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-10" placeholder="+255712345678" {...field('phone')} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" className="input pl-10" placeholder="••••••••" {...field('password')} />
            </div>
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Rudia Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" className="input pl-10" placeholder="••••••••" {...field('password_confirmation')} />
            </div>
            {errors.password_confirmation && (
              <p className="text-red-600 text-sm mt-1">{errors.password_confirmation.message}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Jinsi</label>
            <select className="input" {...field('gender')}>
              <option value="">-- Chagua --</option>
              <option value="male">Mume</option>
              <option value="female">Mke</option>
              <option value="other">Nyingine</option>
              <option value="prefer_not_to_say">Sitaki kuweka</option>
            </select>
          </div>
          <div>
            <label className="label">Nafasi</label>
            <input className="input" placeholder="e.g. Accountant" {...field('position')} />
          </div>
        </div>

        <div>
          <label className="label">Ninajisajili kama</label>
          <div className="grid grid-cols-3 gap-2">
            {(['student', 'trainer', 'corporate_client'] as const).map((r) => (
              <label key={r} className="flex items-center gap-2 p-3 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" value={r} {...field('role')} className="text-brand-600" />
                <span className="text-sm capitalize">{r.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" className="mt-0.5" {...field('accept_terms')} />
          <span>
            Nakubali <a href="#" className="text-brand-600 underline">sheria za matumizi</a> na{' '}
            <a href="#" className="text-brand-600 underline">privacy policy</a>
          </span>
        </label>
        {errors.accept_terms && <p className="text-red-600 text-sm">{errors.accept_terms.message}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Jisajili'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Una account?{' '}
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">
          Ingia hapa
        </Link>
      </p>
    </div>
  );
}
