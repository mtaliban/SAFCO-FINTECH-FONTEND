'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Loader2, Save, Shield, ShieldCheck, ShieldOff, Eye, EyeOff,
  Mail, Phone, Building2, Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { api, apiRequest } from '@/lib/api';

interface ProfileForm {
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  position: string;
  department: string;
  bio: string;
  city: string;
  country: string;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<ProfileForm>({});

  useEffect(() => {
    if (user) {
      reset({
        full_name:  user.profile?.full_name ?? '',
        first_name: user.profile?.first_name ?? '',
        last_name:  user.profile?.last_name ?? '',
        phone:      (user as { phone?: string }).phone ?? '',
        gender:     user.profile?.gender ?? '',
        position:   user.profile?.position ?? '',
        department: user.profile?.department ?? '',
        bio:        user.profile?.bio ?? '',
        city:       user.profile?.address?.city ?? '',
        country:    user.profile?.address?.country ?? '',
      });
    }
  }, [user, reset]);

  async function onSubmit(data: ProfileForm) {
    try {
      const updated = await apiRequest.patch<typeof user>('/users/profile', data);
      if (updated) setUser(updated);
      await fetchMe();
      toast.success('Profile imesasishwa!');
    } catch { /* handled by interceptor */ }
  }

  async function onUploadPicture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('picture', file);
    try {
      await apiRequest.post('/users/profile/picture', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchMe();
      toast.success('Picha imesasishwa!');
    } catch { /* handled */ }
  }

  const avatarLetter = (user?.profile?.first_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-600 mt-1">Simamia taarifa zako binafsi.</p>
      </div>

      {/* ── Profile Picture ── */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-3xl overflow-hidden">
            {user?.profile?.profile_picture_thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile.profile_picture_thumbnail} alt="" className="w-full h-full object-cover" />
            ) : avatarLetter}
          </div>
          <label className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow transition">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" onChange={onUploadPicture} className="hidden" />
          </label>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{user?.profile?.full_name ?? user?.email}</p>
          <p className="text-sm text-slate-500 mt-0.5">{user?.roles?.[0]?.replace('_', ' ')}</p>
          <p className="text-xs text-slate-400 mt-2">JPG/PNG/WEBP · max 5MB · Uploads to S3</p>
        </div>
      </div>

      {/* ── Read-only: Email & Organization ── */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Taarifa za Akaunti</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email</label>
            <input className="input bg-slate-50 text-slate-500 cursor-not-allowed" value={user?.email ?? ''} readOnly />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> Organization</label>
            <input
              className="input bg-slate-50 text-slate-500 cursor-not-allowed"
              value={(user as { organization?: { name?: string } })?.organization?.name ?? 'Haijaungwa'}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* ── Editable Profile Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Taarifa Binafsi</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Jina Kamili</label>
            <input className="input" placeholder="Amina Mohamed" {...register('full_name')} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Simu</label>
            <input className="input" placeholder="+255712345678" {...register('phone')} />
          </div>
          <div>
            <label className="label">First Name</label>
            <input className="input" {...register('first_name')} />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className="input" {...register('last_name')} />
          </div>
          <div>
            <label className="label">Jinsi</label>
            <select className="input" {...register('gender')}>
              <option value="">-- Chagua --</option>
              <option value="male">Mume</option>
              <option value="female">Mke</option>
              <option value="other">Nyingine</option>
              <option value="prefer_not_to_say">Sitaki kuweka</option>
            </select>
          </div>
          <div>
            <label className="label">Position / Kazi</label>
            <input className="input" placeholder="Accountant" {...register('position')} />
          </div>
          <div>
            <label className="label">Department / Idara</label>
            <input className="input" placeholder="Finance" {...register('department')} />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" placeholder="Tanzania" {...register('country')} />
          </div>
          <div>
            <label className="label">City / Mji</label>
            <input className="input" placeholder="Dar es Salaam" {...register('city')} />
          </div>
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea rows={3} className="input" placeholder="Jiambie kidogo..." {...register('bio')} />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isSubmitting || !isDirty} className="btn btn-primary flex items-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Hifadhi Mabadiliko</>}
          </button>
        </div>
      </form>

      {/* ── 2FA Section ── */}
      <TwoFactorSection twoFactorEnabled={!!(user as { two_factor_enabled?: boolean })?.two_factor_enabled} onRefresh={fetchMe} />
    </div>
  );
}

// ── Two-Factor Authentication ──────────────────────────────────────────────

function TwoFactorSection({ twoFactorEnabled, onRefresh }: { twoFactorEnabled: boolean; onRefresh: () => Promise<void> }) {
  const [step, setStep] = useState<'idle' | 'setup' | 'confirm' | 'codes'>('idle');
  const [qrSvg, setQrSvg] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true);
    try {
      const res = await api.post<{ data: { qr_code_svg: string; secret: string } }>('/auth/2fa/setup');
      setQrSvg(res.data.data.qr_code_svg);
      setSecret(res.data.data.secret);
      setStep('setup');
    } catch { toast.error('Hitilafu. Jaribu tena.'); }
    finally { setLoading(false); }
  }

  async function confirmCode() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await api.post<{ data: { recovery_codes: string[] } }>('/auth/2fa/confirm', { code });
      setRecoveryCodes(res.data.data.recovery_codes ?? []);
      setStep('codes');
      await onRefresh();
      toast.success('2FA imewashwa!');
    } catch { toast.error('Code si sahihi. Jaribu tena.'); }
    finally { setLoading(false); }
  }

  async function disable2FA() {
    if (!confirm('Una uhakika unataka kuzima 2FA?')) return;
    setLoading(true);
    try {
      await api.delete('/auth/2fa');
      await onRefresh();
      setStep('idle');
      toast.success('2FA imezimwa.');
    } catch { toast.error('Hitilafu. Jaribu tena.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {twoFactorEnabled
            ? <ShieldCheck className="w-6 h-6 text-green-500" />
            : <Shield className="w-6 h-6 text-slate-400" />}
          <div>
            <h2 className="font-semibold text-slate-900">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {twoFactorEnabled ? 'Imewashwa — akaunti yako inalindwa zaidi.' : 'Imezimwa — washa ili kulinda akaunti yako.'}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {twoFactorEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* ── Not enabled yet ── */}
      {!twoFactorEnabled && step === 'idle' && (
        <button onClick={startSetup} disabled={loading} className="btn btn-primary flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4" /> Washa 2FA</>}
        </button>
      )}

      {/* ── Step 1: Show QR ── */}
      {step === 'setup' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Scan QR code hii kwa Google Authenticator au Authy, kisha weka code ya tarakimu 6.
          </p>
          <div
            className="bg-white p-4 rounded-xl border border-slate-200 w-fit"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-slate-700">Au weka secret key kwa mkono</summary>
            <code className="block mt-2 bg-slate-100 p-2 rounded font-mono text-xs break-all">{secret}</code>
          </details>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="input flex-1 text-center text-2xl font-mono tracking-widest"
            />
            <button onClick={confirmCode} disabled={loading || code.length !== 6} className="btn btn-primary whitespace-nowrap">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Thibitisha'}
            </button>
          </div>
          <button onClick={() => setStep('idle')} className="text-sm text-slate-400 hover:text-slate-600">Ghairi</button>
        </div>
      )}

      {/* ── Step 2: Recovery codes ── */}
      {step === 'codes' && recoveryCodes.length > 0 && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-800 mb-2">Hifadhi Codes za Dharura!</p>
            <p className="text-sm text-amber-700 mb-3">Kila code inatumika mara moja tu. Zihifadhi mahali salama.</p>
            <div className="grid grid-cols-2 gap-1.5">
              {recoveryCodes.map((c) => (
                <code key={c} className="block bg-white border border-amber-200 rounded px-2 py-1 text-xs font-mono">{c}</code>
              ))}
            </div>
          </div>
          <button onClick={() => setStep('idle')} className="btn btn-primary">Nimehifadhi — Endelea</button>
        </div>
      )}

      {/* ── Enabled: disable option ── */}
      {twoFactorEnabled && step === 'idle' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCodes(s => !s)}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
            >
              {showCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showCodes ? 'Ficha maelezo' : 'Maelezo'}
            </button>
          </div>
          {showCodes && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              2FA yako inafanya kazi. Unapoingia, utahitaji kuingiza code kutoka kwa Google Authenticator au Authy.
            </p>
          )}
          <button onClick={disable2FA} disabled={loading} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldOff className="w-4 h-4" /> Zima 2FA</>}
          </button>
        </div>
      )}
    </div>
  );
}
