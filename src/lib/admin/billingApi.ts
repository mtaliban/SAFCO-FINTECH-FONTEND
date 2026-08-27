import { apiRequest } from '@/lib/api';

export interface AdminInvoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'issued' | 'paid' | 'void' | 'refunded' | 'partially_refunded';
  description: string | null;
  subtotal_tzs: number;
  tax_tzs: number;
  total_tzs: number;
  currency: string;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  billed_to: { email: string | null; org: string | null };
}

export interface BillingCounts {
  draft: number;
  issued: number;
  paid: number;
  void: number;
  refunded: number;
}

export interface BillingResponse {
  invoices: AdminInvoice[];
  meta: { current_page: number; last_page: number; total: number; per_page: number };
  revenue: { total_tzs: number; paid_count: number };
  counts: BillingCounts;
}

export interface BillingParams {
  page?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export const billingApi = {
  list: (params: BillingParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    return apiRequest.get<BillingResponse>(`/admin/billing?${qs}`);
  },

  exportUrl: (params: BillingParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    return `/admin/billing/export?${qs}`;
  },
};
