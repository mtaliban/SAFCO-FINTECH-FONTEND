'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, ShieldCheck, ShieldAlert, XCircle, Search,
  CheckCircle2, Calendar, GraduationCap, Trophy,
} from 'lucide-react';
import { verifyApi } from '@/lib/certificate/api';

/**
 * SRS Module 10 — public certificate result page (no auth).
 * Anyone landing here (via QR scan or direct URL) sees the definitive verification status.
 */
export default function PublicVerifyResultPage() {
  const { number } = useParams<{ number: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-cert', number],
    queryFn: () => verifyApi.byNumber(number as string),
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <ResultShell status="not_found" number={String(number)}>
        <p className="text-white/80 mt-3">A network error occurred. Try again in a moment.</p>
      </ResultShell>
    );
  }

  const { status, certificate } = data;

  if (status === 'not_found') {
    return (
      <ResultShell status="not_found" number={String(number)}>
        <p className="text-white/80 mt-3">
          No certificate exists with number <code className="font-mono">{number}</code>.
          Please check the number and try again.
        </p>
        <Link href="/verify" className="btn-primary mt-6 inline-flex bg-orange-500 hover:bg-orange-600 border-0">
          <Search className="w-4 h-4" /> Try another number
        </Link>
      </ResultShell>
    );
  }

  if (status === 'tampered') {
    return (
      <ResultShell status="tampered" number={String(number)}>
        <p className="text-white/80 mt-3">
          This certificate's data does not match its verification signature.
          It may have been altered. Please report this to <strong>info@safcofintech.co.tz</strong>.
        </p>
      </ResultShell>
    );
  }

  const isValid = status === 'valid';
  const isRevoked = status === 'revoked';

  return (
    <main className={`min-h-screen p-6 flex flex-col items-center ${
      isValid ? 'bg-gradient-to-br from-emerald-600 to-emerald-900'
       : 'bg-gradient-to-br from-red-600 to-red-900'
    }`}>
      <div className="max-w-2xl w-full">
        {/* Big verdict banner */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-white text-center mt-8 mb-6">
          <div className="text-xs uppercase tracking-widest font-bold text-white/70 mb-2">
            SAFCO FINTECH · Certificate Verification
          </div>
          {isValid ? (
            <>
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 mb-4">
                <ShieldCheck className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-5xl font-black mb-2">VALID</h1>
              <p className="text-white/80">This certificate is authentic and currently active.</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 mb-4">
                <ShieldAlert className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-5xl font-black mb-2">REVOKED</h1>
              <p className="text-white/80">
                This certificate was issued but has since been revoked by the issuing authority.
              </p>
            </>
          )}
        </div>

        {/* Certificate details */}
        {certificate && (
          <div className="bg-white rounded-2xl p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Certificate Number</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">{number}</div>
            </div>

            <div className="space-y-4">
              <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Awarded To" value={certificate.student_name} highlight />
              <DetailRow icon={<CheckCircle2 className="w-4 h-4" />} label="For Course" value={certificate.course_title} highlight />
              {certificate.completion_date && (
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Completion Date"
                  value={new Date(certificate.completion_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
              )}
              {certificate.issued_at && (
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Issued On"
                  value={new Date(certificate.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
              )}
              {certificate.score_percentage !== null && (
                <DetailRow
                  icon={<Trophy className="w-4 h-4" />}
                  label="Final Score"
                  value={`${certificate.score_percentage.toFixed(1)}%`}
                />
              )}
              {certificate.course_category && (
                <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Category" value={certificate.course_category} />
              )}
            </div>

            {isRevoked && certificate.revoked_reason && (
              <div className="mt-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-900">Revocation reason</div>
                    <div className="text-sm text-red-800 mt-1">{certificate.revoked_reason}</div>
                    {certificate.revoked_at && (
                      <div className="text-xs text-red-700 mt-1">Revoked on {new Date(certificate.revoked_at).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
              Verified by SAFCO FINTECH LMS · Cryptographically signed
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/verify" className="text-white/80 hover:text-white text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Verify another certificate
          </Link>
        </div>
      </div>
    </main>
  );
}

function ResultShell({ status, number, children }: { status: 'not_found' | 'tampered'; number: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full text-center bg-white/10 backdrop-blur rounded-2xl p-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 mb-4">
          <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black mb-2">
          {status === 'tampered' ? 'INVALID SIGNATURE' : 'NOT FOUND'}
        </h1>
        <div className="text-xs uppercase tracking-widest text-white/60 font-mono">{number}</div>
        {children}
      </div>
    </main>
  );
}

function DetailRow({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-slate-500">
        {icon} {label}
      </div>
      <div className={`mt-1 ${highlight ? 'text-xl font-bold text-slate-900' : 'text-slate-700'}`}>{value}</div>
    </div>
  );
}
