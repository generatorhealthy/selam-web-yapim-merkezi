export type ReviewOrder = { id: string; customer_email: string; status: string; payment_status: string | null };
export type ReviewSpecialist = { id: string; user_id: string | null; name: string; email: string };
export const mayReviewOrders = (profile: { role: string; is_approved: boolean } | null) => profile?.is_approved === true && ['admin','staff'].includes(profile.role);
export function classifyLegacyOrder(order: ReviewOrder, specialists: ReviewSpecialist[]) {
  const email = order.customer_email.trim().toLowerCase();
  const matches = email ? specialists.filter(s => s.user_id && s.email.trim().toLowerCase() === email) : [];
  // Unique current registered email proves current access mapping, not historical payment provenance.
  const account = matches.length === 1 ? matches[0] : null;
  return { orderId: order.id, registeredEmail: order.customer_email, status: order.status, paymentStatus: order.payment_status,
    ownership: account ? 'registered_email_match' as const : 'review_required' as const,
    specialist: account ? { id: account.id, userId: account.user_id, name: account.name, email: account.email } : null,
    historicalOwnershipVerified: false as const };
}