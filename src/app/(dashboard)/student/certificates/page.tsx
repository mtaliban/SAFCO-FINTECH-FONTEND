'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Award, Loader2, Trophy, XCircle, Download, ArrowRight, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { certificateApi, type CertificateRow } from '@/lib/certificate/api';

export default function StudentCertificatesPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateApi.myList(),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-7 h-7 text-orange-500" /> My Certificates
        </h1>
        <p className="text-slate-600 mt-1">
          Certificates issued when you pass a final exam or complete a course (SRS Module 10).
          Each certificate has a QR code — anyone can verify its authenticity at <strong>/verify</strong>.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : data.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Hakuna certificates bado</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Pass a Final Certification exam or complete a course fully to earn your first certificate.
          </p>
          <Link href="/student/exams" className="btn-primary mt-4 inline-flex">
            Browse Exams <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map((c) => <CertificateCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}

function CertificateCard({ c }: { c: CertificateRow }) {
  const active = c.status === 'active';
  return (
    <Link
      href={`/student/certificates/${c.id}`}
      className={`card p-5 hover:shadow-md transition flex flex-col ${
        active ? 'border-l-4 border-emerald-500' : 'border-l-4 border-red-500 opacity-75'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${
          active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {active ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {c.status.toUpperCase()}
        </span>
        <div className="text-xs font-mono text-slate-500">{c.cert_number}</div>
      </div>

      <h3 className="font-bold text-slate-900 mb-1">{c.course.title}</h3>
      <p className="text-sm text-slate-600 mb-3">Awarded to <strong>{c.student_name}</strong></p>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
        {c.completion_date && (
          <span>📅 Completed {new Date(c.completion_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        )}
        {c.score_percentage !== null && (
          <span className="font-semibold text-emerald-700">Score: {c.score_percentage.toFixed(1)}%</span>
        )}
      </div>

      {!active && c.revoked_reason && (
        <div className="text-xs text-red-700 bg-red-50 rounded px-2 py-1 mb-3 flex items-start gap-1">
          <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>Revoked: {c.revoked_reason}</span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
        <span>View & download</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
