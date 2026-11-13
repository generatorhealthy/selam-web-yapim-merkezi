/** Undeployed request-path adapter. Store ports require one transaction for
 * server-created order/session and UNIQUE(token), UNIQUE(conversationId).
 * Billing contact is not identity and cannot activate an existing account. */
export type Checkout = {
  id: string; orderId: string; ownerId: string | null; capabilityHash: string;
  expiresAt: number; amount: number; currency: string; planRef: string;
  conversationId: string; token: string | null;
};
export async function startCheckout(input: { packageType: string; contact: unknown }, ports: {
  verifiedIdentity: () => Promise<string | null>;
  plan: (key: string) => Promise<{ amount: number; currency: string; planRef: string; trialDays: number } | null>;
  createOrderAndSession: (data: Omit<Checkout, 'id' | 'orderId' | 'token'>) => Promise<Checkout>;
  initialize: (data: Checkout, contact: unknown) => Promise<{ status: string; token: string; conversationId: string }>;
  bindTokenOnce: (session: Checkout, token: string) => Promise<boolean>;
  now: () => number;
}) {
  const plan = await ports.plan(input.packageType);
  if (!plan || plan.amount <= 0 || plan.currency !== 'TRY' || plan.trialDays !== 0)
    return { state: 'rejected', reason: 'plan_unverified' };
  const capability = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(capability));
  const session = await ports.createOrderAndSession({ ownerId: await ports.verifiedIdentity(),
    capabilityHash: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''),
    expiresAt: ports.now() + 1800000, amount: plan.amount, currency: plan.currency,
    planRef: plan.planRef, conversationId: crypto.randomUUID() });
  // No blind initialize retry: a timeout leaves a durable unknown operation.
  try {
    const result = await ports.initialize(session, input.contact);
    if (result.status !== 'success' || !result.token || result.conversationId !== session.conversationId
      || !await ports.bindTokenOnce(session, result.token)) return { state: 'review_required', orderId: session.orderId };
    return { state: 'initialized', orderId: session.orderId, capability };
  } catch { return { state: 'review_required', orderId: session.orderId }; }
}

export async function retrieveCheckout(token: string, ports: {
  readByToken: (token: string) => Promise<Checkout | null>;
  retrieve: (token: string, conversationId: string) => Promise<{
    token: string; conversationId: string; success: boolean; amount: number;
    currency: string; paymentId: string; planRef: string;
  } | null>;
  commitOnce: (session: Checkout, paymentId: string) => Promise<'applied' | 'duplicate'>;
}) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(token)) return { state: 'rejected' };
  const session = await ports.readByToken(token);
  if (!session || session.token !== token) return { state: 'rejected' };
  // Callback completion is independent of browser lifetime/session expiration.
  const proof = await ports.retrieve(token, session.conversationId);
  if (!proof?.success || !proof.paymentId || proof.token !== token
    || proof.conversationId !== session.conversationId || proof.amount !== session.amount
    || proof.currency !== session.currency || proof.planRef !== session.planRef) return { state: 'rejected' };
  return { state: await ports.commitOnce(session, proof.paymentId), orderId: session.orderId };
}