/** Exact comparisons only: SQL wildcard matching is never ownership proof. */
export function normalizedPaymentEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function ownsOrderEmail(verifiedEmail: unknown, orderEmail: unknown): boolean {
  const owner = normalizedPaymentEmail(verifiedEmail);
  return owner !== null && owner === normalizedPaymentEmail(orderEmail);
}