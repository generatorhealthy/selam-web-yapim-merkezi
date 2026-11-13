/** Official Subscription X-IYZ-SIGNATURE-V3 order, not HPP/direct format. */
export async function subscriptionSignature(secret: string, event: Record<string, unknown>) {
  const fields = ['merchantId', 'iyziEventType', 'subscriptionReferenceCode', 'orderReferenceCode', 'customerReferenceCode'];
  if (!secret || fields.some(k => !['string', 'number'].includes(typeof event[k]) || !String(event[k]))) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(secret + fields.map(k => String(event[k])).join('')));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
}
export async function verifySubscriptionSignature(secret: string, event: Record<string, unknown>, supplied: string | null) {
  if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = await subscriptionSignature(secret, event);
  if (!expected) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ supplied.toLowerCase().charCodeAt(i);
  return difference === 0;
}

export type RenewalProof = { subscriptionRef: string; customerRef: string; periodRef: string;
  paymentId: string; periodStart: number; periodEnd: number; amount: number; currency: string; success: boolean };
export async function settleRenewal(event: Record<string, unknown>, signature: string | null, ports: {
  secret: string;
  retrievePeriod: (subscription: string, period: string) => Promise<RenewalProof | null>;
  readBoundOrder: (subscription: string, periodStart: number, periodEnd: number) => Promise<{ id: string; amount: number; currency: string; customerRef: string } | null>;
  commitReceiptOrderOutbox: (orderId: string, proof: RenewalProof) => Promise<'applied' | 'duplicate'>;
}) {
  if (!await verifySubscriptionSignature(ports.secret, event, signature)) return { state: 'rejected', reason: 'invalid_signature' };
  const proof = await ports.retrievePeriod(String(event.subscriptionReferenceCode), String(event.orderReferenceCode));
  if (!proof?.success || !proof.paymentId || proof.subscriptionRef !== event.subscriptionReferenceCode
    || proof.customerRef !== event.customerReferenceCode || proof.periodRef !== event.orderReferenceCode
    || !Number.isFinite(proof.periodStart) || !Number.isFinite(proof.periodEnd)
    || proof.periodStart >= proof.periodEnd) return { state: 'rejected', reason: 'provider_mismatch' };
  const order = await ports.readBoundOrder(proof.subscriptionRef, proof.periodStart, proof.periodEnd);
  if (!order || order.customerRef !== proof.customerRef || order.amount !== proof.amount || order.currency !== proof.currency)
    return { state: 'rejected', reason: 'period_order_mismatch' };
  return { state: await ports.commitReceiptOrderOutbox(order.id, proof), orderId: order.id };
}