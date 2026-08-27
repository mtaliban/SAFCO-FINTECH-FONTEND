'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, Download, Phone, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '@/lib/payment/api';
import { formatTzs } from '@/lib/payment/money';
import { ProviderPicker } from '@/components/payment/ProviderPicker';

/**
 * SRS Module 12 — Checkout page.
 * Flow:
 *   1. Load invoice + providers
 *   2. User picks provider (+ msisdn for mobile money)
 *   3. POST /invoices/{uuid}/pay → returns payment_id + instruction/checkout_url
 *   4. Poll /payments/{payment_id} every 3s until final state (or timeout at 3 min)
 *   5. On success → redirect to receipt / dashboard
 */
export default function CheckoutPage() {
  const { invoice: invoiceUuid } = useParams<{ invoice: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [provider, setProvider] = useState<string | null>(null);
  const [msisdn, setMsisdn] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const invoiceQ = useQuery({
    queryKey: ['invoice', invoiceUuid],
    queryFn: () => paymentApi.invoice(invoiceUuid),
    enabled: !!invoiceUuid,
  });

  const providersQ = useQuery({
    queryKey: ['payment', 'providers'],
    queryFn: () => paymentApi.providers(),
    staleTime: 5 * 60_000,
  });

  const initMut = useMutation({
    mutationFn: () => paymentApi.initiatePayment(invoiceUuid, {
      provider: provider!,
      msisdn: msisdn || undefined,
      idempotency_key: `${invoiceUuid}-${Date.now()}`,
    }),
    onSuccess: (res) => {
      setPaymentId(res.payment.id);
      setInstruction(res.payment.user_instruction);
      setCheckoutUrl(res.payment.checkout_url);
      if (res.payment.checkout_url) window.location.href = res.payment.checkout_url;
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Payment initiation failed'),
  });

  // Poll status
  const statusQ = useQuery({
    queryKey: ['payment', 'status', paymentId],
    queryFn: () => paymentApi.paymentStatus(paymentId!),
    enabled: !!paymentId,
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.payment?.status;
      return s && s !== 'pending' ? false : 3_000;
    },
  });

  useEffect(() => {
    const s = statusQ.data?.payment?.status;
    if (s === 'succeeded') {
      toast.success('Payment received!');
      qc.invalidateQueries({ queryKey: ['invoice', invoiceUuid] });
    } else if (s === 'failed' || s === 'expired' || s === 'cancelled') {
      toast.error(`Payment ${s}`);
    }
  }, [statusQ.data?.payment?.status, invoiceUuid, qc]);

  const selectedProvider = useMemo(() =>
    providersQ.data?.providers.find((p) => p.code === provider), [providersQ.data, provider]);

  if (invoiceQ.isLoading || providersQ.isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }
  if (invoiceQ.isError || !invoiceQ.data) {
    return <div className="p-4 sm:p-6 lg:p-8 card p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto text-center text-slate-500">Invoice not found.</div>;
  }

  const inv = invoiceQ.data;
  const paymentStatus = statusQ.data?.payment?.status;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/billing" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4" /> Back to billing
      </Link>

      {/* Invoice summary card */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase text-slate-500 font-bold tracking-widest">Invoice</div>
            <div className="font-mono font-bold text-slate-900">{inv.invoice_number}</div>
          </div>
          <StatusBadge status={inv.status} />
        </div>
        <div className="mt-4 text-sm text-slate-700">{inv.description}</div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
          <div className="text-xs text-slate-500">TOTAL DUE</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {inv.currency} {formatTzs(inv.total_tzs)}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 text-right">
          Subtotal {formatTzs(inv.subtotal_tzs)} + VAT {formatTzs(inv.tax_tzs)}
        </div>
      </div>

      {/* Already paid — show receipt CTA */}
      {inv.status === 'paid' && (
        <div className="card p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <div className="flex-1">
              <div className="font-bold text-emerald-900">This invoice is paid</div>
              <div className="text-sm text-emerald-800">Enrollment is active.</div>
            </div>
            <a
              href={paymentApi.receiptPdfUrl(invoiceUuid)}
              className="btn-primary"
              target="_blank" rel="noopener"
            >
              <Download className="w-4 h-4" /> Receipt
            </a>
          </div>
        </div>
      )}

      {/* Payment flow */}
      {inv.status === 'issued' && !paymentId && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-1">Choose a payment method</h2>
          <p className="text-xs text-slate-500 mb-4 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Payments are processed securely by our licensed partners.
          </p>

          <ProviderPicker
            providers={providersQ.data?.providers ?? []}
            selected={provider}
            onSelect={setProvider}
          />

          {selectedProvider?.category === 'mobile_money' && (
            <div className="mt-4">
              <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">
                <Phone className="w-3 h-3 inline mr-1" /> Phone number
              </label>
              <input
                type="tel"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                placeholder="0712345678 or +255712345678"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <p className="text-xs text-slate-500 mt-1">
                You'll receive an {selectedProvider.name} prompt on this number.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => initMut.mutate()}
            disabled={!provider || (selectedProvider?.category === 'mobile_money' && !msisdn) || initMut.isPending}
            className="btn-primary mt-6 w-full disabled:opacity-50"
          >
            {initMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Pay {inv.currency} {formatTzs(inv.total_tzs)}
          </button>
        </div>
      )}

      {/* Status polling display */}
      {paymentId && (
        <div className="card p-6 text-center">
          <div className="mb-3">
            {paymentStatus === 'succeeded'
              ? <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
              : paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'expired'
              ? <XCircle className="w-16 h-16 mx-auto text-red-500" />
              : <Loader2 className="w-16 h-16 mx-auto text-brand-500 animate-spin" />}
          </div>

          <div className="text-xl font-bold text-slate-900">
            {paymentStatus === 'succeeded' ? 'Payment received' :
             paymentStatus === 'failed' ? 'Payment failed' :
             paymentStatus === 'cancelled' ? 'Payment cancelled' :
             paymentStatus === 'expired' ? 'Payment expired' :
             'Waiting for payment...'}
          </div>

          {instruction && paymentStatus === 'pending' && (
            <div className="mt-2 text-sm text-slate-600 max-w-md mx-auto">{instruction}</div>
          )}

          {paymentStatus === 'pending' && (
            <div className="mt-4 text-xs text-slate-500 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> Polling every 3 seconds — do not close this page.
            </div>
          )}

          {statusQ.data?.payment?.failure_message && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 rounded p-2 max-w-md mx-auto">
              {statusQ.data.payment.failure_message}
            </div>
          )}

          {paymentStatus === 'succeeded' && (
            <div className="mt-6 flex gap-3 justify-center">
              <a href={paymentApi.receiptPdfUrl(invoiceUuid)} className="btn-primary" target="_blank" rel="noopener">
                <Download className="w-4 h-4" /> Download Receipt
              </a>
              <Link href="/student/my-courses" className="btn-secondary">Go to my courses</Link>
            </div>
          )}

          {(paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'expired') && (
            <button
              onClick={() => { setPaymentId(null); setInstruction(null); }}
              className="btn-primary mt-6"
            >
              Try another method
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    issued: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    void: 'bg-red-100 text-red-800',
    refunded: 'bg-slate-100 text-slate-700',
  }[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${styles}`}>
      {status}
    </span>
  );
}
