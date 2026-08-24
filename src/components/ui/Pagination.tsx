'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Numbered pagination — "1 2 3 … 8 9 10  Next".
 *
 * Renders a compact page bar so long lists (10+ items per page) stay
 * navigable without scrolling. Windowing rule:
 *   - always show first + last page
 *   - always show 1 page on either side of current
 *   - ellipsis for gaps
 */
export function Pagination({
  currentPage,
  lastPage,
  onPageChange,
  totalItems,
  pageSize,
  className = '',
}: {
  currentPage: number;
  lastPage: number;
  onPageChange: (p: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}) {
  if (lastPage <= 1) return null;

  const pages = buildPageList(currentPage, lastPage);
  const first = pageSize && totalItems ? (currentPage - 1) * pageSize + 1 : null;
  const last = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div className={`flex items-center justify-between flex-wrap gap-3 py-3 ${className}`}>
      {totalItems !== undefined && first !== null && last !== null && (
        <div className="text-sm text-slate-500">
          Onyesha <b>{first}</b>–<b>{last}</b> kati ya <b>{totalItems}</b>
        </div>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2 py-1.5 rounded border border-slate-200 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-2 text-slate-400">
              <MoreHorizontal className="w-4 h-4" />
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] px-2 py-1.5 rounded text-sm border transition ${
                p === currentPage
                  ? 'bg-brand-500 text-white border-brand-500 font-bold'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className="px-3 py-1.5 rounded border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="w-4 h-4 inline" />
        </button>
      </div>
    </div>
  );
}

/**
 * Client-side helper for when the API returns ALL rows in one shot and we
 * need to paginate in-memory. Returns the sliced page + meta.
 */
export function usePagedSlice<T>(rows: T[] | undefined, currentPage: number, pageSize = 10) {
  const total = rows?.length ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), lastPage);
  const start = (safePage - 1) * pageSize;
  const page = rows?.slice(start, start + pageSize) ?? [];
  return { page, lastPage, currentPage: safePage, totalItems: total, pageSize };
}

function buildPageList(current: number, last: number): Array<number | '…'> {
  const out: Array<number | '…'> = [];
  const push = (v: number | '…') => {
    if (v === '…') {
      if (out[out.length - 1] !== '…') out.push('…');
    } else if (v >= 1 && v <= last) {
      if (out[out.length - 1] !== v) out.push(v);
    }
  };
  push(1);
  if (current - 2 > 2) push('…');
  for (let p = current - 1; p <= current + 1; p++) push(p);
  if (current + 2 < last - 1) push('…');
  push(last);
  return out;
}
