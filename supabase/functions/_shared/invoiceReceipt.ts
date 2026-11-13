export type InvoiceReceipt = { orderReference: string; number: string; issuedAt: string };
export type InvoiceRecord = { id: string; status: string; number: string | null };
export function parseInvoiceReceipt(body: Record<string, unknown>): InvoiceReceipt | null {
  const reference = body.orderId ?? body.OrderId;
  const number = body.faturaNo ?? body.InvoiceNo;
  const date = body.faturaTarihi ?? body.InvoiceDate;
  if ((typeof reference !== 'string' && typeof reference !== 'number') || typeof number !== 'string'
    || number.trim().length < 1 || number.length > 128 || typeof date !== 'string') return null;
  const orderReference = String(reference);
  if (!/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{13})$/i.test(orderReference)) return null;
  let issuedAt = date;
  const tr = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(date);
  if (tr) issuedAt = `${tr[3]}-${tr[2]}-${tr[1]}T${tr[4]}:${tr[5]}:${tr[6]}+03:00`;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(issuedAt)
    || !Number.isFinite(Date.parse(issuedAt))) return null;
  return { orderReference, number: number.trim(), issuedAt: new Date(issuedAt).toISOString() };
}

export async function acceptInvoiceReceipt(receipt: InvoiceReceipt, ports: {
  resolve: (reference: string) => Promise<InvoiceRecord[]>;
  storeOnce: (id: string, receipt: InvoiceReceipt) => Promise<boolean>;
}) {
  const orders = await ports.resolve(receipt.orderReference);
  if (orders.length !== 1) return { success: false, state: 'order_reference_unresolved' };
  const order = orders[0];
  if (!['approved', 'completed'].includes(order.status)) return { success: false, state: 'payment_not_approved' };
  if (order.number) return order.number === receipt.number
    ? { success: true, state: 'duplicate', orderId: order.id }
    : { success: false, state: 'invoice_reference_conflict' };
  try {
    if (await ports.storeOnce(order.id, receipt)) return { success: true, state: 'recorded', orderId: order.id };
  } catch { /* Read back an uncertain commit; do not overwrite or retry. */ }
  const readback = await ports.resolve(receipt.orderReference);
  if (readback.length === 1 && readback[0].id === order.id && readback[0].number === receipt.number)
    return { success: true, state: 'duplicate', orderId: order.id };
  return { success: false, state: 'invoice_receipt_unconfirmed' };
}