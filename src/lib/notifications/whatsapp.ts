/**
 * SRS Module 15 — WhatsApp click-to-chat helper.
 *
 * Builds a wa.me deep-link that opens WhatsApp with the recipient number and
 * an optional prefilled message. No server API, no automation — just a link
 * the user clicks to start a chat themselves.
 */
export function whatsAppLink(phone: string, message?: string): string {
  // Normalize: strip everything except digits, and drop a leading "0" for TZ numbers.
  let digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) digits = '255' + digits.slice(1);
  if (!digits.startsWith('255') && digits.length === 9) digits = '255' + digits;

  const url = `https://wa.me/${digits}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

/** Human-readable formatting for display next to the WhatsApp button. */
export function formatPhoneTz(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 12 && digits.startsWith('255')) {
    return `+255 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone;
}
