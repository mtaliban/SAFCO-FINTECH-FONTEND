'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

type Form = { email: string; full_name: string; position?: string };

export default function InviteEmployeePage() {
  const qc = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>();

  async function onSubmit(data: Form) {
    try {
      const res = await apiRequest.post<{ email: string; temp_password: string }>('/corporate/invite', data);
      setTempPassword(res.temp_password);
      toast.success(`${res.email} amealikwa!`);
      reset();
      qc.invalidateQueries({ queryKey: ['corporate', 'my-employees'] });
    } catch { /* toast handled */ }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-orange-500" /> Invite Employee
        </h1>
        <p className="text-slate-600 mt-1">Ongeza mtumishi mpya wa organization yako (SRS 3.4).</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" placeholder="Jina kamili la mtumishi" {...register('full_name', { required: true })} />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input" placeholder="employee@company.co.tz" {...register('email', { required: true })} />
        </div>
        <div>
          <label className="label">Position (optional)</label>
          <input className="input" placeholder="Financial Analyst" {...register('position')} />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Alika Mtumishi'}
          </button>
        </div>
      </form>

      {tempPassword && (
        <div className="mt-6 card p-5 bg-amber-50 border-amber-300">
          <div className="font-bold text-amber-900 mb-2">🔑 Temporary Password</div>
          <p className="text-sm text-amber-800 mb-2">
            Share this password securely with the employee. They will be asked to change it on first login.
          </p>
          <code className="block bg-white p-3 rounded font-mono text-sm">{tempPassword}</code>
        </div>
      )}
    </div>
  );
}
