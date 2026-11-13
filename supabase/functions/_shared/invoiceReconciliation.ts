export type ReconciliationOrder = {
  id: string; status: string; queued: boolean; number: string | null;
  issuedAt: string | null; createdAt: string;
};

/** Read-only manual reconciliation for the existing pull integration.
 * A missing callback is not evidence of non-issuance. Never enqueue or retry. */
export function invoiceReconciliation(order: ReconciliationOrder) {
  const exportReference = String(Date.parse(order.createdAt));
  if (!Number.isFinite(Date.parse(order.createdAt))) throw new Error('invalid_export_reference');
  const state = order.number ? 'confirmed'
    : !['approved', 'completed'].includes(order.status) ? 'payment_not_approved'
    : order.queued ? 'review_required' : 'not_queued';
  return {
    orderId: order.id, exportReference, orderCode: `ORD-${exportReference}`,
    state, invoiceNumber: order.number, issuedAt: order.issuedAt,
    providerLookupSupported: false, retryAllowed: false,
    paymentStatus: order.status,
  };
}

export async function handleInvoiceReconciliation(req: Request, ports: {
  authorize: (req: Request) => Promise<{ ok: true } | { ok: false; status: number }>;
  read: (id: string) => Promise<ReconciliationOrder | null>;
  headers: Record<string, string>;
}) {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...ports.headers, 'Content-Type': 'application/json' },
  });
  if (req.method === 'OPTIONS') return new Response(null, { headers: ports.headers });
  const authorization = await ports.authorize(req);
  if (!authorization.ok) return json({ error: 'unauthorized' }, authorization.status);
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some(k => k !== 'orderId')
      || typeof body.orderId !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.orderId))
      return json({ error: 'invalid_order' }, 400);
    const order = await ports.read(body.orderId);
    if (!order) return json({ error: 'order_not_found' }, 404);
    return json(invoiceReconciliation(order));
  } catch { return json({ error: 'reconciliation_unavailable' }, 503); }
}