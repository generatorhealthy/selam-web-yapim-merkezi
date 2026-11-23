// Pure rules for Hoppa subscriptions (tested in logic_test.ts).
export const RETRY_DAYS = [0, 2, 6]; // attempts on day 1, 3 and 7 of a due period
export function addMonth(d: Date): Date { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; }
export function chargeKey(subId: string, period: number, attempt: number) { return `${subId}:${period}:${attempt}`; }
/** After a failed attempt: next retry date, or null when the subscription must be marked failed. */
export function nextRetry(failedAttempts: number, now: Date): Date | null {
  if (failedAttempts >= RETRY_DAYS.length) return null;
  const gap = RETRY_DAYS[failedAttempts] - RETRY_DAYS[failedAttempts - 1];
  return new Date(now.getTime() + gap * 86400000);
}
export function paymentUrl(r: Record<string, unknown> | null): string | null {
  const u = r && (r.URL_3DS ?? r.URL ?? r.PAYMENT_URL ?? r.url);
  return typeof u === "string" && /^https:\/\//.test(u) ? u : null;
}

export function providerFailure(r: { RETURN_MESSAGE?: unknown } | null) {
  const ipDenied = typeof r?.RETURN_MESSAGE === 'string' && /IP adresinden işlem yapma yetkiniz/i.test(r.RETURN_MESSAGE);
  return ipDenied
    ? { code: 'provider_ip_denied', error: 'Hoppa ödeme sunucusunun bağlantısına izin vermiyor.' }
    : { code: 'provider_unavailable', error: 'Hoppa bağlantısı doğrulanamadı. Yeniden ödeme yapmadan önce destek hattından teyit edin.' };
}

export function requireCardList(r: { CARDS?: unknown } | null): unknown[] {
  if (!Array.isArray(r?.CARDS)) throw new Error('provider_unavailable');
  return r.CARDS;
}
