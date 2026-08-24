'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Download, Receipt, CreditCard, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { paymentApi } from '@/lib/payment/api';
import { formatTzs } from '@/lib/payment/money';

/**
 * SRS Module 12 — Billing / Payment History page.
 * Student, corporate_client, and admin all use this route; the API scopes
 * results by role (student → own; corporate → own+org; admin → all).
 */
export default function BillingPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: () => paymentApi.invoices(),
    refetchInterval: 30_000,
  });

  const invoices = useMemo(() => {
    const list = data?.invoices ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((i) =>
      i.invoice_number.toLowerCase().includes(q) ||
      (i.description ?? '').toLowerCase().includes(q));
  }, [data, search]);

  const totals = useMemo(() => {
    const list = data?.invoices ?? [];
    return {
      paid: list.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total_tzs, 0),
      outstanding: list.filter((i) => i.status === 'issued').reduce((s, i) => s + i.total_tzs, 0),
    };
  }, [data]);

  if (isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-orange-500" /> Billing & Payments
        </h1>
        <p className="text-slate-600 mt-1">
          Your invoices and receipts (SRS Module 12).
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 border-emerald-200 bg-emerald-50">
          <div className="text-xs uppercase font-bold text-emerald-700 tracking-widest">Total Paid</div>
          <div className="text-3xl font-black text-emerald-900 mt-1 font-mono">
            TZS {formatTzs(totals.paid)}
          </div>
        </div>
        <div className="card p-4 border-amber-200 bg-amber-50">
          <div className="text-xs uppercase font-bold text-amber-700 tracking-widest">Outstanding</div>
          <div className="text-3xl font-black text-amber-900 mt-1 font-mono">
            TZS {formatTzs(totals.outstanding)}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search invoice number or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm"
            />
          </div>
          <div className="text-xs text-slate-500 ml-auto">
            {invoices.length} invoice{invoices.length === 1 ? '' : 's'}
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
            No invoices yet. Enrolling in a paid course will create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase text-left border-b border-slate-200">
                  <th className="py-2">Invoice</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Issued</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-center">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono text-xs font-semibold text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 text-slate-700 max-w-md truncate">{inv.description}</td>
                    <td className="py-3 text-xs text-slate-500">
                      {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold">
                      {formatTzs(inv.total_tzs)}
                    </td>
                    <td className="py-3 text-center">
                      <StatusPill status={inv.status} />
                    </td>
                    <td className="py-3 text-right space-x-1">
                      <a
                        href={paymentApi.invoicePdfUrl(inv.id)}
                        target="_blank" rel="noopener"
                        title="Download invoice PDF"
                        className="inline-block p-1.5 rounded hover:bg-slate-100 text-slate-600"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {inv.status === 'paid' && (
                        <a
                          href={paymentApi.receiptPdfUrl(inv.id)}
                          target="_blank" rel="noopener"
                          title="Download receipt"
                          className="inline-block p-1.5 rounded hover:bg-slate-100 text-emerald-700"
                        >
                          <Receipt className="w-4 h-4" />
                        </a>
                      )}
                      {inv.status === 'issued' && (
                        <Link
                          href={`/checkout/${inv.id}`}
                          className="inline-block px-3 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
                        >
                          Pay
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    issued: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    void: 'bg-red-100 text-red-800',
    refunded: 'bg-slate-100 text-slate-700',
    partially_refunded: 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
