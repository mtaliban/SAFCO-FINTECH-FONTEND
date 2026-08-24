import { apiRequest } from '@/lib/api';

/** SRS Module 12 — Payment API types + client. */

export type PaymentProviderCategory = 'mobile_money' | 'bank' | 'card';

export interface PaymentProviderInfo {
  code: string;
  name: string;
  category: PaymentProviderCategory;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void' | 'refunded' | 'partially_refunded';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired' | 'reversed';

export interface Invoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  description: string | null;
  subtotal_tzs: number;
  tax_tzs: number;
  total_tzs: number;
  currency: string;
  line_items: Array<{ name: string; qty: number; unit_tzs: number; total_tzs: number }>;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  billed_to: { email: string | null; org: string | null };
  payments?: Array<PaymentSummary>;
}

export interface PaymentSummary {
  id: string;
  provider: string;
  status: PaymentStatus;
  amount_tzs: number;
  initiated_at: string | null;
  completed_at: string | null;
  failure_message: string | null;
  meta?: Record<string, unknown> | null;
}

export interface InitiatePaymentInput {
  provider: string;
  msisdn?: string;
  idempotency_key?: string;
}

export interface InitiatePaymentResponse {
  payment: {
    id: string;
    status: PaymentStatus;
    provider: string;
    provider_ref: string | null;
    amount_tzs: number;
    checkout_url: string | null;
    user_instruction: string | null;
    failure_message: string | null;
    expires_at: string | null;
  };
}

export const paymentApi = {
  providers: () =>
    apiRequest.get<{ providers: PaymentProviderInfo[] }>('/payments/providers'),

  invoices: () =>
    apiRequest.get<{ invoices: Invoice[] }>('/invoices'),

  invoice: (uuid: string) =>
    apiRequest.get<Invoice>(`/invoices/${uuid}`),

  createInvoiceForCourse: (courseUuid: string) =>
    apiRequest.post<Invoice>('/invoices', { course_uuid: courseUuid }),

  initiatePayment: (invoiceUuid: string, input: InitiatePaymentInput) =>
    apiRequest.post<InitiatePaymentResponse>(`/invoices/${invoiceUuid}/pay`, input),

  paymentStatus: (paymentUuid: string) =>
    apiRequest.get<{ payment: PaymentSummary & { provider_ref?: string; failure_code?: string } }>(
      `/payments/${paymentUuid}`,
    ),

  /** PDF endpoints return raw bytes; browser handles download via <a href>. */
  invoicePdfUrl: (invoiceUuid: string) => `/api/v1/invoices/${invoiceUuid}/pdf`,
  receiptPdfUrl: (invoiceUuid: string) => `/api/v1/invoices/${invoiceUuid}/receipt`,
};
