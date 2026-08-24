import { api, apiRequest } from '@/lib/api';

export type CertificateStatus = 'active' | 'revoked' | 'expired';
export type VerifyStatus = 'valid' | 'revoked' | 'tampered' | 'not_found';

export interface CertificateRow {
  id: string;
  cert_number: string;
  student_name: string;
  course: { id: string | null; title: string; category: string | null };
  completion_date: string | null;
  issued_at: string | null;
  score_percentage: number | null;
  status: CertificateStatus;
  revoked_at: string | null;
  revoked_reason: string | null;
  verify_url: string;
}

export interface PublicCertificateInfo {
  student_name: string;
  course_title: string;
  course_category: string | null;
  completion_date: string | null;
  issued_at: string | null;
  score_percentage: number | null;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export interface PublicVerifyResult {
  status: VerifyStatus;
  cert_number: string;
  certificate: PublicCertificateInfo | null;
  issuer?: { name: string; verified_at: string };
}

export const certificateApi = {
  myList: () => apiRequest.get<CertificateRow[]>('/student/certificates'),
  get: (uuid: string) => apiRequest.get<CertificateRow>(`/certificates/${uuid}`),
  qrUrl: (uuid: string) =>
    `${(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1')}/certificates/${uuid}/qr`,
  pdfUrl: (uuid: string) =>
    `${(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1')}/certificates/${uuid}/pdf`,
  /**
   * Download the PDF as a blob (uses fetch with auth header, then triggers a save-as).
   * Direct <a href={pdfUrl}> won't work because we can't attach the Bearer via anchor tag.
   */
  downloadPdf: async (uuid: string, filename: string) => {
    const res = await api.get(`/certificates/${uuid}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

/** Public verification — no auth. */
export const verifyApi = {
  byNumber: (certNumber: string) =>
    apiRequest.get<PublicVerifyResult>(`/verify/certificate/${encodeURIComponent(certNumber)}`),
  search: (query: string) =>
    apiRequest.post<PublicVerifyResult>('/verify/search', { query }),
};

/* ---------------- Admin ---------------- */

export interface AdminCertificateRow {
  id: string;
  cert_number: string;
  student_name: string;
  student_email: string | null;
  course_title: string;
  completion_date: string | null;
  issued_at: string | null;
  score_percentage: number | null;
  status: CertificateStatus;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export const adminCertificateApi = {
  list: (params: Record<string, string> = {}) =>
    apiRequest.get<{ data: AdminCertificateRow[]; meta: { total: number; last_page: number; current_page: number } }>(
      '/admin/certificates', { params },
    ),
  revoke: (uuid: string, reason: string) =>
    apiRequest.post<{ cert_number: string; status: string; revoked_at: string; revoked_reason: string }>(
      `/admin/certificates/${uuid}/revoke`, { reason },
    ),
};
