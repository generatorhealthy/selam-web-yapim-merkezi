import { ownsOrderEmail } from './paymentOwnership.ts';

export type SettlementProof = {
  subscriptionRef: string; customerRef: string; chargeRef: string;
  email: string; amount: number; currency: string; paidAt: number;
  planRef: string; success: boolean;
};
export type SettlementOrder = {
  id: string; email: string; amount: number; currency: string;
  status: string; subscriptionRef: string | null; customerRef: string | null;
};
export function settlementRejection(proof: SettlementProof, order: SettlementOrder): string | null {
  if (!proof.success || !proof.subscriptionRef || !proof.customerRef || !proof.chargeRef || !proof.planRef
    || !Number.isFinite(proof.paidAt) || proof.paidAt <= 0) return 'payment_not_verified';
  if (!ownsOrderEmail(proof.email,order.email)) return 'owner_mismatch';
  if (order.subscriptionRef && order.subscriptionRef !== proof.subscriptionRef) return 'subscription_mismatch';
  if (order.customerRef && order.customerRef !== proof.customerRef) return 'customer_mismatch';
  if (!Number.isFinite(proof.amount) || proof.amount <= 0 || Math.abs(proof.amount-order.amount)>0.005) return 'amount_mismatch';
  if (proof.currency !== 'TRY' || order.currency !== 'TRY') return 'currency_mismatch';
  if (order.status !== 'pending') return 'order_not_pending';
  return null;
}

/** Injected ports allow full request-path tests without provider calls. The
 * atomic port must commit receipt, order and outbox in one database transaction. */
export async function settleVerifiedPayment(
  claimed: { subscriptionRef: string; orderId: string },
  ports: {
    verify: (ref: string) => Promise<SettlementProof | null>;
    readOrder: (id: string) => Promise<SettlementOrder | null>;
    atomic: (proof: SettlementProof, order: SettlementOrder) => Promise<{ action: 'applied' | 'duplicate'; orderId: string }>;
  },
) {
  const proof=await ports.verify(claimed.subscriptionRef);
  if (!proof || proof.subscriptionRef!==claimed.subscriptionRef) return { action:'rejected',reason:'payment_not_verified' };
  const order=await ports.readOrder(claimed.orderId);
  if (!order) return { action:'rejected',reason:'order_missing' };
  const rejection=settlementRejection(proof,order);
  if (rejection) return { action:'rejected',reason:rejection };
  // No invoice, SMS or provider retry here: only durable outbox intent.
  return ports.atomic(proof,order);
}