'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Award, Loader2, Search, Ban, ShieldCheck, ShieldAlert, X, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCertificateApi, type AdminCertificateRow, type CertificateStatus } from '@/lib/certificate/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

export default function AdminCertificatesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | CertificateStatus>('');
  const [revokeTarget, setRevokeTarget] = useState<AdminCertificateRow | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-certificates', search, status],
    queryFn: () => adminCertificateApi.list({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      per_page: '200',
    }),
  });

  const allRows = data?.data ?? [];
  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(allRows, page, PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-7 h-7 text-orange-500" /> All Certificates
        </h1>
        <p className="text-slate-600 mt-1">
          All certificates issued by the platform (SRS Module 10 · admin). Revocations are recorded in the audit log.
        </p>
      </div>

      <div className="card p-4 mb-4 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by cert number, student, course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value as CertificateStatus | '')}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : totalItems === 0 ? (
        <div className="card p-12 text-center">
          <Award className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No certificates match your filters.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Cert #</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Issued</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.cert_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{r.student_name}</div>
                    {r.student_email && r.student_email !== r.student_name && (
                      <div className="text-xs text-slate-500">{r.student_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.course_title}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.issued_at ? new Date(r.issued_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {r.score_percentage !== null ? `${r.score_percentage.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold uppercase">
                        <ShieldCheck className="w-3 h-3" /> Active
                      </span>
                    ) : r.status === 'revoked' ? (
                      <span className="inline-flex items-center gap-1 text-red-700 text-xs font-bold uppercase">
                        <ShieldAlert className="w-3 h-3" /> Revoked
                      </span>
                    ) : (
                      <span className="text-xs uppercase text-slate-500">{r.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`/verify/certificate/${r.cert_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-700 text-xs font-semibold underline mr-3"
                    >
                      <ExternalLink className="w-3 h-3 inline" /> Verify
                    </a>
                    {r.status === 'active' && (
                      <button
                        onClick={() => setRevokeTarget(r)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold underline"
                      >
                        <Ban className="w-3 h-3 inline" /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination
              currentPage={currentPage}
              lastPage={lastPage}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          </div>
        </div>
      )}

      {revokeTarget && (
        <RevokeModal
          target={revokeTarget}
          onClose={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}

function RevokeModal({ target, onClose }: { target: AdminCertificateRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (reason.trim().length < 5) { toast.error('Reason must be at least 5 characters'); return; }
    setBusy(true);
    try {
      await adminCertificateApi.revoke(target.id, reason.trim());
      toast.success('Certificate revoked. Audit-logged.');
      qc.invalidateQueries({ queryKey: ['admin-certificates'] });
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Revoke failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Revoke Certificate
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              This action is <strong>irreversible</strong>. The certificate will show as REVOKED on public verification pages.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
          <div><strong>Cert #:</strong> <span className="font-mono">{target.cert_number}</span></div>
          <div><strong>Student:</strong> {target.student_name}</div>
          <div><strong>Course:</strong> {target.course_title}</div>
        </div>

        <label className="label">Reason for revocation *</label>
        <textarea
          rows={3}
          className="input"
          placeholder="e.g. Student was found to have violated exam integrity rules."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="help">This reason will be shown to anyone who verifies the certificate publicly.</p>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={busy || reason.trim().length < 5}
            className="btn-primary bg-red-600 hover:bg-red-700 border-0">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Ban className="w-4 h-4" /> Revoke Certificate</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
