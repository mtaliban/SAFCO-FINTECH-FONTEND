'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft, Loader2, Download, ShieldCheck, ShieldAlert, Copy, Trophy, Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { certificateApi } from '@/lib/certificate/api';

export default function CertificateDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [downloading, setDownloading] = useState(false);

  const { data: c, isLoading } = useQuery({
    queryKey: ['certificate', uuid],
    queryFn: () => certificateApi.get(uuid as string),
  });

  async function download() {
    if (!c) return;
    setDownloading(true);
    try {
      await certificateApi.downloadPdf(c.id, `${c.cert_number}.pdf`);
      toast.success('Certificate downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  }

  function copyLink() {
    if (!c) return;
    navigator.clipboard.writeText(c.verify_url);
    toast.success('Public verify link copied');
  }

  function copyNumber() {
    if (!c) return;
    navigator.clipboard.writeText(c.cert_number);
    toast.success('Certificate number copied');
  }

  if (isLoading || !c) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  const active = c.status === 'active';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      <Link href="/student/certificates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Certificates
      </Link>

      {/* Certificate preview */}
      <div className={`relative bg-white border-8 rounded-2xl overflow-hidden ${active ? 'border-navy-900' : 'border-red-800'}`}>
        <div className={`absolute inset-4 border-2 ${active ? 'border-orange-500' : 'border-red-400'} pointer-events-none rounded-xl`} />

        {!active && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="text-red-600/40 text-6xl font-black border-8 border-red-600/40 px-4 sm:px-6 lg:px-8 py-3 -rotate-12">
              REVOKED
            </div>
          </div>
        )}

        <div className="relative p-4 sm:p-6 lg:p-8 md:p-14 text-center">
          <div className="text-xs uppercase font-bold tracking-widest text-orange-500 mb-1">SAFCO FINTECH</div>
          <div className="text-sm text-slate-700 mb-8">Learning Management System</div>

          <div className="text-3xl md:text-4xl font-black text-navy-900 mb-2 tracking-wide">Certificate of Completion</div>
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-8">This is to certify that</div>

          <div className="inline-block px-6 md:px-12 pb-2 border-b-2 border-orange-500 mb-6">
            <div className="text-3xl md:text-4xl font-bold text-navy-900">{c.student_name}</div>
          </div>

          <p className="text-slate-700">has successfully completed the course</p>
          <div className="text-xl md:text-2xl font-bold text-navy-500 mt-2 mb-4">{c.course.title}</div>

          {c.score_percentage !== null && (
            <div className="text-slate-600 mb-8">
              with a final score of <strong className="text-slate-900">{c.score_percentage.toFixed(1)}%</strong>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 mt-10 text-left items-center">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Completion Date</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {c.completion_date ? new Date(c.completion_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-3">Issued On</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {c.issued_at ? new Date(c.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>

            <div className="text-center">
              {/* Live QR — the endpoint returns SVG; browser renders as an image */}
              <img
                src={certificateApi.qrUrl(c.id)}
                alt="QR verification code"
                className="w-28 h-28 md:w-32 md:h-32 mx-auto"
              />
              <div className="text-[9px] text-slate-500 mt-1">Scan to verify</div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Certificate Number</div>
              <div className="text-sm font-mono font-bold text-slate-900 mt-1">{c.cert_number}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-3">Verify At</div>
              <div className="text-[10px] text-navy-600 mt-1 break-all">{c.verify_url}</div>
            </div>
          </div>
        </div>
      </div>

      {!active && c.revoked_reason && (
        <div className="mt-4 card p-4 border-l-4 border-red-500 bg-red-50/60">
          <div className="text-sm font-bold text-red-800 mb-1">Certificate Revoked</div>
          <div className="text-sm text-red-900">{c.revoked_reason}</div>
          {c.revoked_at && (
            <div className="text-xs text-red-700 mt-1">On {new Date(c.revoked_at).toLocaleString()}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={download} disabled={downloading} className="btn-primary">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Download className="w-4 h-4" /> Download PDF</>)}
        </button>
        <button onClick={copyNumber} className="btn-secondary">
          <Copy className="w-4 h-4" /> Copy Certificate #
        </button>
        <button onClick={copyLink} className="btn-secondary">
          <Share2 className="w-4 h-4" /> Copy Public Verify Link
        </button>
        <Link href="/verify" target="_blank" className="btn-secondary">
          <ShieldCheck className="w-4 h-4" /> Public Verify Page
        </Link>
      </div>
    </div>
  );
}
