/**
 * SRS Module 12 — locale-safe money formatting.
 *
 * Never use `.toLocaleString()` bare — DE users would see "1.000" for 1,000.
 * All money is stored server-side as INTEGER TZS whole shillings.
 */

const TZS_FORMATTER = new Intl.NumberFormat('en-TZ', {
  useGrouping: true,
  maximumFractionDigits: 0,
});

/** Format an integer TZS amount as "10,000" (no currency symbol). */
export function formatTzs(amountTzs: number | null | undefined): string {
  if (amountTzs === null || amountTzs === undefined) return '—';
  return TZS_FORMATTER.format(amountTzs);
}

/** Format as "TZS 10,000" (with currency prefix). */
export function formatTzsWithCurrency(amountTzs: number | null | undefined): string {
  if (amountTzs === null || amountTzs === undefined) return '—';
  return `TZS ${TZS_FORMATTER.format(amountTzs)}`;
}
