'use client';

import { useState } from 'react';
import { Phone, Landmark, CreditCard } from 'lucide-react';
import type { PaymentProviderInfo } from '@/lib/payment/api';

/**
 * SRS Module 12 — provider picker.
 * Groups by category (mobile money / bank / card) with SAFCO branding.
 */
export function ProviderPicker({
  providers,
  selected,
  onSelect,
}: {
  providers: PaymentProviderInfo[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const [tab, setTab] = useState<'mobile_money' | 'bank' | 'card'>('mobile_money');
  const filtered = providers.filter((p) => p.category === tab);

  const tabs: Array<{ key: typeof tab; label: string; icon: React.ReactNode }> = [
    { key: 'mobile_money', label: 'Mobile Money', icon: <Phone className="w-4 h-4" /> },
    { key: 'bank', label: 'Bank', icon: <Landmark className="w-4 h-4" /> },
    { key: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition ${
              tab === t.key
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            aria-selected={tab === t.key}
            role="tab"
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <button
            key={p.code}
            type="button"
            onClick={() => onSelect(p.code)}
            className={`p-4 rounded-lg border-2 transition text-left ${
              selected === p.code
                ? 'border-brand-500 bg-brand-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-slate-900 text-sm">{p.name}</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">
              {t(p.code, p.category)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function t(code: string, category: string): string {
  if (code === 'mpesa') return 'Vodacom';
  if (code === 'mixx') return 'Yas';
  if (code === 'airtel_money') return 'Airtel';
  if (category === 'bank') return 'Push to app';
  if (category === 'card') return 'Redirect';
  return category;
}
