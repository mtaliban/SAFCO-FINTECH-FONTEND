'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, CheckCircle2, Clock, Loader2, QrCode, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceApi } from '@/lib/attendance/api';

type Result = {
  status: 'present' | 'late' | 'absent' | 'excused';
  session: { title: string; location: string | null };
  checked_in_at: string;
} | null;

export default function StudentCheckInPage() {
  const params = useSearchParams();
  const initialToken = params.get('token') ?? '';
  const [token, setToken] = useState(initialToken);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  // Auto-submit if URL had ?token=…
  useEffect(() => {
    if (initialToken) submit(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(t: string) {
    if (!t.trim()) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await attendanceApi.checkIn(t.trim());
      setResult(res);
      toast.success(`Checked in as ${res.status}`);
      stopScan();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed';
      setError(msg);
    } finally { setBusy(false); }
  }

  async function startScan() {
    try {
      setScanning(true);
      // Lazy-load @zxing to avoid pulling into initial bundle
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const backCam = devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0];
      if (!backCam) { toast.error('Hakuna kamera ilipatikana.'); setScanning(false); return; }

      const controls = await reader.decodeFromVideoDevice(backCam.deviceId, videoRef.current!, (res, err) => {
        if (res) {
          const text = res.getText();
          const match = text.match(/[?&]token=([a-f0-9]+)/i);
          const scanned = match ? match[1] : text;
          setToken(scanned);
          submit(scanned);
        }
        // err is thrown per-frame if no QR — ignore
        if (err && err.name !== 'NotFoundException') console.debug(err);
      });
      controlsRef.current = controls;
    } catch (e) {
      toast.error('Camera denied or unavailable.');
      console.error(e);
      setScanning(false);
    }
  }

  function stopScan() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }
  useEffect(() => () => stopScan(), []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <QrCode className="w-7 h-7 text-orange-500" /> Check-in
        </h1>
        <p className="text-slate-600 mt-1">Scan QR ya trainer au paste token.</p>
      </div>

      {result ? (
        <ResultCard result={result} onAgain={() => { setResult(null); setToken(''); }} />
      ) : (
        <div className="card p-6 space-y-5">
          {scanning ? (
            <>
              <video ref={videoRef} className="w-full aspect-square bg-black rounded-lg object-cover" muted playsInline />
              <button onClick={stopScan} className="btn-secondary w-full">Stop Camera</button>
            </>
          ) : (
            <>
              <button onClick={startScan} className="btn-primary w-full text-base py-3">
                <Camera className="w-5 h-5" /> Scan with Camera
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">au</span></div>
              </div>
              <div>
                <label className="label">Paste Token</label>
                <input
                  className="input font-mono text-sm"
                  placeholder="a07c890f72ea..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <button
                onClick={() => submit(token)}
                disabled={!token.trim() || busy}
                className="btn-secondary w-full"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Token'}
              </button>
              {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, onAgain }: { result: NonNullable<Result>; onAgain: () => void }) {
  const styleMap = {
    present: { c: 'from-green-500 to-emerald-600', Icon: CheckCircle2, label: 'PRESENT 🎉' },
    late: { c: 'from-amber-500 to-orange-600', Icon: Clock, label: 'UMECHELEWA ⏰' },
    absent: { c: 'from-red-500 to-red-700', Icon: XCircle, label: 'ABSENT' },
    excused: { c: 'from-navy-500 to-navy-600', Icon: CheckCircle2, label: 'EXCUSED' },
  } as const;
  const st = styleMap[result.status];
  const Icon = st.Icon;
  return (
    <div className="card overflow-hidden">
      <div className={`bg-gradient-to-br ${st.c} text-white p-4 sm:p-6 lg:p-8 text-center`}>
        <Icon className="w-16 h-16 mx-auto mb-3" />
        <div className="text-2xl sm:text-3xl font-black mb-2">{st.label}</div>
        {result.status === 'late' && (
          <div className="text-white/80 text-sm mb-2">Ulifika baada ya muda wa kuanza — umerekodiwa kama umechelewa.</div>
        )}
        <div className="text-white/80">{result.session.title}</div>
        {result.session.location && <div className="text-white/60 text-sm mt-1">📍 {result.session.location}</div>}
      </div>
      <div className="p-6">
        <div className="text-sm text-slate-500 mb-3">
          Checked in at {new Date(result.checked_in_at).toLocaleTimeString('sw-TZ')}
        </div>
        <button onClick={onAgain} className="btn-secondary w-full">Scan Another</button>
      </div>
    </div>
  );
}
