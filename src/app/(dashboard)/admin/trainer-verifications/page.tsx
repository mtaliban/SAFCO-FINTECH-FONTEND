'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, ShieldCheck, GraduationCap, Award, Check, X, ExternalLink, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { trainerPortalApi } from '@/lib/trainerPortal/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

/**
 * SRS Module 13 — Admin verification console.
 * Lists all pending qualifications + certifications; approve or reject with reason.
 * Approving all items promotes the trainer to "Certified Trainer" automatically.
 */
export default function AdminTrainerVerificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'trainer-verifications'],
    queryFn: () => trainerPortalApi.pendingVerifications(),
    refetchInterval: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'trainer-verifications'] });

  const verifyQ = useMutation({
    mutationFn: (id: string) => trainerPortalApi.verifyQualification(id),
    onSuccess: () => { toast.success('Qualification verified'); invalidate(); },
  });
  const rejectQ = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => trainerPortalApi.rejectQualification(id, reason),
    onSuccess: () => { toast.success('Rejected'); invalidate(); },
  });
  const verifyC = useMutation({
    mutationFn: (id: string) => trainerPortalApi.verifyCertification(id),
    onSuccess: () => { toast.success('Certification verified'); invalidate(); },
  });
  const rejectC = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => trainerPortalApi.rejectCertification(id, reason),
    onSuccess: () => { toast.success('Rejected'); invalidate(); },
  });

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectKind, setRejectKind] = useState<'qualification' | 'certification' | null>(null);
  const [qPage, setQPage] = useState(1);
  const [cPage, setCPage] = useState(1);

  const submitReject = () => {
    if (!rejectingId || !rejectKind || rejectReason.trim().length < 3) return;
    if (rejectKind === 'qualification') rejectQ.mutate({ id: rejectingId, reason: rejectReason.trim() });
    else rejectC.mutate({ id: rejectingId, reason: rejectReason.trim() });
    setRejectingId(null); setRejectReason(''); setRejectKind(null);
  };

  // Compute pagination BEFORE the early return so the hook order stays stable.
  const qSlice = usePagedSlice(data?.qualifications ?? [], qPage, PAGE_SIZE);
  const cSlice = usePagedSlice(data?.certifications ?? [], cPage, PAGE_SIZE);

  if (isLoading || !data) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-orange-500" /> Trainer Verifications
        </h1>
        <p className="text-slate-600 mt-1">
          Review submitted qualifications + certifications (SRS Module 13).
          When ALL items for a trainer are verified, the "Certified Trainer" badge is issued automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-xs uppercase font-bold text-slate-500 tracking-widest">Pending Qualifications</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">{data.totals.pending_qualifications}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase font-bold text-slate-500 tracking-widest">Pending Certifications</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">{data.totals.pending_certifications}</div>
        </div>
      </div>

      {/* Qualifications */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-500" /> Pending qualifications
        </h2>
        {qSlice.totalItems === 0 ? (
          <div className="card p-4 sm:p-6 lg:p-8 text-center text-sm text-slate-500">Nothing pending.</div>
        ) : (
          <ul className="space-y-2">
            {qSlice.page.map((q: any) => (
              <li key={q.id} className="card p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{q.degree}{q.field_of_study && ` — ${q.field_of_study}`}</div>
                    <div className="text-sm text-slate-600">{q.institution}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Trainer: <Link href={`/trainers/${q.trainer_slug}`} target="_blank" className="text-brand-600 hover:underline">
                        {q.trainer_name} <ExternalLink className="w-3 h-3 inline" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.has_proof && (
                      <ProofButton type="qualifications" id={q.id} />
                    )}
                    <button
                      onClick={() => verifyQ.mutate(q.id)}
                      disabled={verifyQ.isPending}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-sm"
                    >
                      <Check className="w-4 h-4" /> Verify
                    </button>
                    <button
                      onClick={() => { setRejectingId(q.id); setRejectKind('qualification'); }}
                      className="btn-secondary text-sm text-red-700"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {qSlice.totalItems > 0 && (
          <Pagination
            currentPage={qSlice.currentPage}
            lastPage={qSlice.lastPage}
            onPageChange={setQPage}
            totalItems={qSlice.totalItems}
            pageSize={PAGE_SIZE}
          />
        )}
      </section>

      {/* Certifications */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Pending certifications
        </h2>
        {cSlice.totalItems === 0 ? (
          <div className="card p-4 sm:p-6 lg:p-8 text-center text-sm text-slate-500">Nothing pending.</div>
        ) : (
          <ul className="space-y-2">
            {cSlice.page.map((c: any) => (
              <li key={c.id} className="card p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-sm text-slate-600">by {c.issuer}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Trainer: <Link href={`/trainers/${c.trainer_slug}`} target="_blank" className="text-brand-600 hover:underline">
                        {c.trainer_name} <ExternalLink className="w-3 h-3 inline" />
                      </Link>
                      {c.credential_id && <> · ID: {c.credential_id}</>}
                    </div>
                    {c.verification_url && (
                      <a href={c.verification_url} target="_blank" rel="noopener" className="text-xs text-brand-600 hover:underline mt-1 inline-flex items-center gap-1">
                        Verify externally <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.has_proof && (
                      <ProofButton type="certifications" id={c.id} />
                    )}
                    <button
                      onClick={() => verifyC.mutate(c.id)}
                      disabled={verifyC.isPending}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-sm"
                    >
                      <Check className="w-4 h-4" /> Verify
                    </button>
                    <button
                      onClick={() => { setRejectingId(c.id); setRejectKind('certification'); }}
                      className="btn-secondary text-sm text-red-700"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {cSlice.totalItems > 0 && (
          <Pagination
            currentPage={cSlice.currentPage}
            lastPage={cSlice.lastPage}
            onPageChange={setCPage}
            totalItems={cSlice.totalItems}
            pageSize={PAGE_SIZE}
          />
        )}
      </section>

      {/* Reject-reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject {rejectKind}</h3>
            <p className="text-sm text-slate-500 mb-3">
              Provide a reason. The trainer will see it and can re-submit.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Uploaded document is unreadable — please re-upload as PDF"
              maxLength={1000}
              rows={4}
              className="input w-full"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="btn-secondary">Cancel</button>
              <button
                onClick={submitReject}
                disabled={rejectReason.trim().length < 3}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fetches a signed download URL on click and streams the proof file. */
function ProofButton({ type, id }: { type: 'qualifications' | 'certifications'; id: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const { download_url } = await trainerPortalApi.proofUrl(type, id);
      window.open(download_url, '_blank', 'noopener');
    } catch {
      toast.error('Could not fetch proof link');
    } finally { setLoading(false); }
  };
  return (
    <button onClick={handleClick} disabled={loading} className="btn-secondary text-sm">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Proof
    </button>
  );
}
