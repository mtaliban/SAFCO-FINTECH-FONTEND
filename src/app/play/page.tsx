'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, Hash, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { playApi } from '@/lib/quiz/api';

const pinSchema = z.object({ pin: z.string().length(6, 'PIN lazima iwe alama 6') });
const nickSchema = z.object({ nickname: z.string().min(1).max(30) });

export default function PlayLandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'pin' | 'nick'>('pin');
  const [pin, setPin] = useState('');

  const pinForm = useForm<{ pin: string }>({ resolver: zodResolver(pinSchema) });
  const nickForm = useForm<{ nickname: string }>({ resolver: zodResolver(nickSchema) });

  async function submitPin({ pin }: { pin: string }) {
    try {
      await playApi.sessionState(pin);
      setPin(pin);
      setStep('nick');
    } catch {
      // toast handled
    }
  }

  async function submitNickname({ nickname }: { nickname: string }) {
    try {
      const res = await playApi.join(pin, nickname);
      sessionStorage.setItem('safco_participant', JSON.stringify({
        id: res.participant.id,
        nickname,
        pin,
      }));
      toast.success(`Karibu ${nickname}!`);
      router.push(`/play/session/${pin}`);
    } catch { /* handled */ }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-bold text-brand-700">
              SF
            </div>
            <span className="text-white font-bold text-xl">SAFCO PLAY</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">🎯 Jiunge Quiz!</h1>
          <p className="text-white/70">Weka PIN uliyopewa na mwalimu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'pin' ? (
            <form onSubmit={pinForm.handleSubmit(submitPin)} className="space-y-5 animate-fade-in">
              <div>
                <label className="label flex items-center gap-2"><Hash className="w-4 h-4" /> Game PIN</label>
                <input
                  autoFocus
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="000000"
                  className="input text-center text-4xl tracking-widest font-mono font-bold"
                  {...pinForm.register('pin')}
                />
                {pinForm.formState.errors.pin && (
                  <p className="text-red-600 text-sm mt-1">{pinForm.formState.errors.pin.message}</p>
                )}
              </div>
              <button type="submit" disabled={pinForm.formState.isSubmitting} className="btn-primary w-full text-lg py-4">
                {pinForm.formState.isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Endelea <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={nickForm.handleSubmit(submitNickname)} className="space-y-5 animate-fade-in">
              <div className="text-center mb-2">
                <div className="text-sm text-slate-500">PIN</div>
                <div className="text-2xl font-mono font-bold text-brand-700">{pin}</div>
              </div>
              <div>
                <label className="label flex items-center gap-2"><User className="w-4 h-4" /> Nickname</label>
                <input
                  autoFocus
                  maxLength={30}
                  placeholder="Weka jina lako"
                  className="input text-center text-xl"
                  {...nickForm.register('nickname')}
                />
                {nickForm.formState.errors.nickname && (
                  <p className="text-red-600 text-sm mt-1">{nickForm.formState.errors.nickname.message}</p>
                )}
              </div>
              <button type="submit" disabled={nickForm.formState.isSubmitting} className="btn-primary w-full text-lg py-4 bg-gradient-to-r from-brand-600 to-brand-700">
                {nickForm.formState.isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Jiunge Sasa 🚀'}
              </button>
              <button
                type="button"
                onClick={() => setStep('pin')}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                ← Badilisha PIN
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          Powered by SAFCO FINTECH LMS
        </p>
      </div>
    </main>
  );
}
