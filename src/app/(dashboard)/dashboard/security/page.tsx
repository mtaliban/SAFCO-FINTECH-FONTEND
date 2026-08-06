'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, ShieldCheck, ShieldOff, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/auth';
import { useAuthStore } from '@/store/auth';

export default function SecurityPage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [setup, setSetup] = useState<{ secret: string; qr_code_svg: string; otpauth_url: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ code: string }>();

  async function start2fa() {
    try {
      const data = await authApi.setup2fa();
      setSetup(data);
      setConfirming(true);
    } catch { /* handled */ }
  }

  async function confirm2fa({ code }: { code: string }) {
    try {
      const res = await authApi.confirm2fa(code);
      setRecoveryCodes(res.recovery_codes);
      setConfirming(false);
      await fetchMe();
      toast.success('2FA imewashwa!');
    } catch { /* handled */ }
  }

  async function disable2fa() {
    if (!confirm('Uhakika unataka kuizima 2FA?')) return;
    try {
      await authApi.disable2fa();
      await fetchMe();
      toast.success('2FA imezimwa.');
    } catch { /* handled */ }
  }

  const enabled = user?.two_factor?.enabled;

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Security</h1>
        <p className="text-slate-600 mt-1">Simamia usalama wa akaunti yako.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {enabled ? (
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <ShieldOff className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication (TOTP)</h2>
              <p className="text-sm text-slate-500">
                {enabled ? 'Imewashwa - akaunti yako ni salama zaidi.' : 'Imezimwa - washa kuongeza usalama.'}
              </p>
            </div>
          </div>
          {enabled ? (
            <button onClick={disable2fa} className="btn-danger text-sm">
              Zima 2FA
            </button>
          ) : (
            <button onClick={start2fa} className="btn-primary text-sm">
              Washa 2FA
            </button>
          )}
        </div>

        {/* QR code + confirm form */}
        {setup && confirming && (
          <div className="mt-6 p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-4 animate-fade-in">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Hatua 1: Scan QR Code</h3>
              <p className="text-sm text-slate-600 mb-3">
                Fungua Google Authenticator (au Authy) na scan hii:
              </p>
              <div
                className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border border-slate-200"
                dangerouslySetInnerHTML={{ __html: setup.qr_code_svg }}
              />
              <p className="text-center text-xs text-slate-500 mt-3">
                Au weka manually: <code className="bg-white px-2 py-1 rounded font-mono">{setup.secret}</code>
              </p>
            </div>

            <form onSubmit={handleSubmit(confirm2fa)} className="space-y-3">
              <div>
                <label className="label">Hatua 2: Weka OTP kutoka app</label>
                <input
                  type="text"
                  className="input text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  placeholder="000000"
                  {...register('code', { required: true })}
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Thibitisha na Washa'}
              </button>
            </form>
          </div>
        )}

        {/* Recovery codes */}
        {recoveryCodes && (
          <div className="mt-6 p-6 bg-amber-50 rounded-lg border border-amber-200 animate-fade-in">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900">Recovery Codes (Kila moja tumia mara moja tu!)</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Hifadhi hizi salama. Ukipoteza phone, tumia mojawapo kuingia.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {recoveryCodes.map((code) => (
                <code key={code} className="bg-white px-3 py-2 rounded text-sm font-mono text-center border border-amber-200">
                  {code}
                </code>
              ))}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(recoveryCodes.join('\n'));
                toast.success('Codes zimecopy!');
              }}
              className="mt-3 btn-secondary text-sm w-full"
            >
              <Copy className="w-4 h-4" /> Copy Zote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
