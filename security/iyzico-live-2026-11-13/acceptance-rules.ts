/** Offline report classifications. No payment, activation, refund or retry actions. */
export function legacyState(evidence: { providerRead?: boolean; paid?: boolean; expired?: boolean }) {
  if (!evidence.providerRead || evidence.paid === undefined) return 'unknown';
  if (evidence.paid) return 'paid';
  if (evidence.expired === true) return 'expired';
  return evidence.expired === false ? 'unpaid' : 'unknown';
}
export function acceptanceState(evidence: { paid: boolean; activation: boolean | null; binding: boolean;
  invoiceJobs: number | null; notificationJobs: number | null }) {
  if (!evidence.paid) return 'payment_pending';
  if (evidence.activation === false) return 'activation_missing';
  return evidence.activation === true && evidence.binding && evidence.invoiceJobs === 1
    && evidence.notificationJobs === 1 ? 'accepted' : 'evidence_pending';
}