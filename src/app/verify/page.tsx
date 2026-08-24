'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Search, QrCode, Loader2, X, Camera } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import toast from 'react-hot-toast';
import { verifyApi } from '@/lib/certificate/api';

/**
 * SRS Module 10 — PUBLIC Verify page.
 * Anyone (no login) can search by cert number OR scan the certificate's QR code.
 * On success, redirects to /verify/certificate/{number}.
 */
export default function PublicVerifyPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  async function search() {
    const q = input.trim();
    if (!q) { toast.error('Enter a certificate number'); return; }
    setBusy(true);
    try {
      const res = await verifyApi.search(q);
      if (res.status === 'not_found') {
        toast.error('No certificate found with that number.');
      } else {
        router.push(`/verify/certificate/${res.cert_number}`);
      }
    } catch (e) {
      const code = (e as { response?: { status?: number } })?.response?.status;
      if (code === 429) toast.error('Too many attempts — please wait a minute and try again.');
      else toast.error('Verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function startScan() {
    setScanning(true);
    try {
      const reader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const deviceId = devices[0]?.deviceId;

      // Wait a tick so the <video> tag mounts
      await new Promise((r) => setTimeout(r, 100));
      if (!videoRef.current) throw new Error('No video element');

      controlsRef.current = await reader.decodeFromVideoDevice(deviceId, videoRef.current, async (result) => {
        if (!result) return;
        const text = result.getText();
        controlsRef.current?.stop();
        setScanning(false);
        setInput(text);
        // Auto-search on successful scan
        try {
          const res = await verifyApi.search(text);
          if (res.status === 'not_found') {
            toast.error('Scanned code is not a valid SAFCO certificate.');
          } else {
            router.push(`/verify/certificate/${res.cert_number}`);
          }
        } catch {
          toast.error('Verification failed.');
        }
      });
    } catch {
      toast.error('Camera not available or permission denied.');
      setScanning(false);
    }
  }

  function stopScan() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => controlsRef.current?.stop(), []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">
            <ShieldCheck className="w-4 h-4" /> SAFCO FINTECH
          </div>
          <h1 className="text-4xl font-black mb-2">Verify Certificate</h1>
          <p className="text-white/70">
            Enter a certificate number or scan the QR code to confirm authenticity.
          </p>
        </div>

        {scanning ? (
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur">
            <div className="aspect-square rounded-xl overflow-hidden bg-black relative">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-8 border-4 border-orange-400 rounded-lg pointer-events-none" />
            </div>
            <button onClick={stopScan} className="btn-secondary w-full justify-center mt-3">
              <X className="w-4 h-4" /> Stop Scanner
            </button>
            <p className="text-xs text-white/60 text-center mt-2">
              Point your camera at the QR code on the certificate.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur">
            <label className="block text-sm font-semibold text-white/80 mb-2">Certificate number</label>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-mono placeholder-white/40 focus:outline-none focus:border-orange-400"
                  placeholder="SAFCO-2026-XXXXXXXX"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
                  autoFocus
                />
              </div>
              <button onClick={search} disabled={busy} className="btn-primary bg-orange-500 hover:bg-orange-600 border-0">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-navy-900 px-3 text-white/50">or</span>
              </div>
            </div>

            <button onClick={startScan} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/20">
              <Camera className="w-4 h-4" /> Scan QR Code
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-white/50">
          <QrCode className="w-4 h-4 inline mr-1" />
          Every SAFCO certificate carries a tamper-proof verification hash.
        </div>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-orange-400 hover:text-orange-300 text-sm underline">
            Return to SAFCO Login
          </Link>
        </div>
      </div>
    </main>
  );
}
