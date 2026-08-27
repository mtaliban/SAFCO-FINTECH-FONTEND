'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard, Search, Download, Filter, Loader2,
  TrendingUp, CheckCircle2, Clock, Ban, RefreshCw,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { billingApi, type AdminInvoice, type BillingParams } from '@/lib/admin/billingApi';
import { useAuthStore } from '@/store/auth';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:               { label: 'Draft',      cls: 'bg-slate-100 text-slate-600' },
  issued:              { label: 'Pending',     cls: 'bg-amber-100 text-amber-700' },
  paid:                { label: 'Paid',        cls: 'bg-emerald-100 text-emerald-700' },
  void:                { label: 'Void',        cls: 'bg-red-100 text-red-700' },
  refunded:            { label: 'Refunded',    cls: 'bg-purple-100 text-purple-700' },
  partially_refunded:  { label: 'Part-Refund', cls: 'bg-orange-100 text-orange-700' },
};

function fmt(tzs: number) {
  return 'TZS ' + tzs.toLocaleString('en-TZ');
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminSubscriptionsPage() {
  const token = useAuthStore((s) => s.token);
  const [params, setParams] = useState<BillingParams>({ page: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const activeParams: BillingParams = {
    page: params.page,
    ...(status ? { status } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'billing', activeParams],
    queryFn: () => billingApi.list(activeParams),
  });

  function applyFilters() {
    setParams({ page: 1 });
  }

  async function handleExport() {
    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    const qs = new URLSearchParams();
    if (status)   qs.set('status', status);
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to', dateTo);
    if (search)   qs.set('search', search);
    const url = `${base}/api/v1/admin/billing/export?${qs}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token ?? ''}` } });
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const revenue = data?.revenue;
  const counts  = data?.counts;
  const meta    = data?.meta;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold uppercase tracking-widest mb-1">
            <CreditCard className="w-3.5 h-3.5" /> Billing Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Manage Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-1">All platform invoices — filter, search, and export.</p>
        </div>
        <button
          onClick={handleExport}
          className="self-start flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-sm text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Revenue"
          value={revenue ? fmt(revenue.total_tzs) : '—'}
          accent="brand"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Paid"
          value={counts?.paid ?? '—'}
          accent="green"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending"
          value={counts?.issued ?? '—'}
          accent="amber"
        />
        <SummaryCard
          icon={<Ban className="w-5 h-5" />}
          label="Voided"
          value={counts?.void ?? '—'}
          accent="red"
        />
        <SummaryCard
          icon={<RefreshCw className="w-5 h-5" />}
          label="Refunded"
          value={counts?.refunded ?? '—'}
          accent="slate"
        />
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Invoice # or email..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="issued">Pending</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <button
            onClick={applyFilters}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg transition text-sm"
          >
            <Filter className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {(isLoading || isFetching) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-100 text-orange-600 text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading invoices…
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Invoice #</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">User / Org</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Amount</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Issued</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.invoices.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      No invoices match your filters.
                    </td>
                  </tr>
                )
                : data?.invoices.map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Page {meta.current_page} of {meta.last_page} · {meta.total} invoices
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                disabled={(params.page ?? 1) <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                disabled={(params.page ?? 1) >= meta.last_page}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: AdminInvoice }) {
  const meta = STATUS_META[invoice.status] ?? { label: invoice.status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
        {invoice.invoice_number}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-900 truncate max-w-[200px]">{invoice.billed_to.email ?? '—'}</div>
        {invoice.billed_to.org && (
          <div className="text-[11px] text-slate-400 truncate">{invoice.billed_to.org}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.cls}`}>
          {meta.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
        {invoice.total_tzs.toLocaleString('en-TZ')}
        <span className="text-[10px] text-slate-400 font-normal ml-1">TZS</span>
      </td>
      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
        {fmtDate(invoice.issued_at)}
      </td>
      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
        {fmtDate(invoice.paid_at)}
      </td>
    </tr>
  );
}

function SummaryCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: 'brand' | 'green' | 'amber' | 'red' | 'slate';
}) {
  const cfg = {
    brand: { border: 'border-l-orange-500',  iconBg: 'bg-orange-50  text-orange-600' },
    green: { border: 'border-l-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600' },
    amber: { border: 'border-l-amber-500',   iconBg: 'bg-amber-50   text-amber-600' },
    red:   { border: 'border-l-red-500',     iconBg: 'bg-red-50     text-red-600' },
    slate: { border: 'border-l-slate-400',   iconBg: 'bg-slate-100  text-slate-500' },
  }[accent];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${cfg.border} p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.iconBg}`}>{icon}</span>
      </div>
      <div className="text-xl font-black text-slate-900 tabular-nums leading-tight">{value}</div>
    </div>
  );
}
