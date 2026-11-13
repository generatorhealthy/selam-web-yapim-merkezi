export type InvoiceQueueOrder = { id: string; status: string; queued: boolean };
export type InvoiceQueuePorts = {
  read: (id: string) => Promise<InvoiceQueueOrder | null>;
  enqueue: (id: string) => Promise<boolean>;
};

/** BirFatura pulls queued orders. This is not a provider invoice receipt.
 * Atomic enqueue must only change false->true; unknown outcomes are read back,
 * never blindly reissued. No external invoice request is made here. */
export async function queueInvoice(id: string, ports: InvoiceQueuePorts) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { success: false, state: 'invalid_order' };
  }
  const order = await ports.read(id);
  if (!order) return { success: false, state: 'order_missing' };
  if (!['approved', 'completed'].includes(order.status)) return { success: false, state: 'not_approved' };
  if (order.queued) return { success: true, state: 'already_queued' };
  try {
    if (await ports.enqueue(id)) return { success: true, state: 'queued' };
  } catch {
    // The DB may have committed even if its response was lost.
  }
  const confirmed = await ports.read(id);
  return confirmed?.queued
    ? { success: true, state: 'already_queued' }
    : { success: false, state: 'queue_unconfirmed' };
}