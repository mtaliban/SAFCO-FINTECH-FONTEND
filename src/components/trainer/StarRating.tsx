'use client';

import { Star } from 'lucide-react';

/** Simple 5-star display. Fills whole+half stars visually. */
export function StarRating({ value, size = 16, showNumber = false }: { value: number | null; size?: number; showNumber?: boolean }) {
  const v = value ?? 0;
  const full = Math.floor(v);
  const hasHalf = v - full >= 0.5;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={value ? `${v} out of 5 stars` : 'not rated'}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const half = i === full && hasHalf;
        return (
          <Star
            key={i}
            width={size} height={size}
            className={filled ? 'fill-amber-400 text-amber-400' : half ? 'fill-amber-200 text-amber-400' : 'text-slate-300'}
          />
        );
      })}
      {showNumber && value !== null && (
        <span className="ml-1 text-sm font-semibold text-slate-700">{v.toFixed(1)}</span>
      )}
    </span>
  );
}

/** Interactive rating selector for the review form. */
export function StarPicker({ value, onChange, size = 32 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          className="transition transform hover:scale-110 focus:outline-none"
        >
          <Star
            width={size} height={size}
            className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  );
}
