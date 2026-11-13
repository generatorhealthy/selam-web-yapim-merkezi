import { assertEquals } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { handleInvoiceReconciliation, invoiceReconciliation, type ReconciliationOrder } from '../_shared/invoiceReconciliation.ts';
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const order: ReconciliationOrder = { id, status: 'approved', queued: true, number: null,
  issuedAt: '2026-11-13T07:00:00Z', createdAt: '2026-11-12T12:00:00Z' };

Deno.test('unknown provider result never permits another invoice', () => {
  const result = invoiceReconciliation(order);
  assertEquals(result.state, 'review_required');
  assertEquals(result.retryAllowed, false);
  assertEquals(result.invoiceNumber, null);
  assertEquals(result.providerLookupSupported, false);
});
Deno.test('confirmed historical invoice is read back unchanged', () => {
  const result = invoiceReconciliation({ ...order, number: 'REAL-EXISTING-123' });
  assertEquals(result.state, 'confirmed');
  assertEquals(result.invoiceNumber, 'REAL-EXISTING-123');
  assertEquals(result.retryAllowed, false);
});
Deno.test('queued date is not fabricated invoice evidence', () => {
  const result = invoiceReconciliation(order);
  assertEquals(result.state, 'review_required');
  assertEquals(result.exportReference, '1794484800000');
  assertEquals(result.orderCode, 'ORD-1794484800000');
});
Deno.test('unpaid order is not an invoice success', () => {
  assertEquals(invoiceReconciliation({ ...order, status: 'pending' }).state, 'payment_not_approved');
});
Deno.test('not queued is not evidence of provider non-issuance', () => {
  const result = invoiceReconciliation({ ...order, queued: false });
  assertEquals(result.state, 'not_queued');
  assertEquals(result.retryAllowed, false);
});
Deno.test('anonymous and unauthorized staff cannot read orders', async () => {
  for (const status of [401, 403]) {
    let reads = 0;
    const response = await handleInvoiceReconciliation(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ orderId: id }) }), {
      authorize: async () => ({ ok: false, status }), headers: {}, read: async () => { reads++; return order; },
    });
    assertEquals(response.status, status); assertEquals(reads, 0);
  }
});
Deno.test('client invoice number and invalid order id rejected before reads', async () => {
  for (const body of [{ orderId: 'bad' }, { orderId: id, invoiceNumber: 'FORGED' }]) {
    let reads = 0;
    const response = await handleInvoiceReconciliation(new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) }), {
      authorize: async () => ({ ok: true }), headers: {}, read: async () => { reads++; return order; },
    });
    assertEquals(response.status, 400); assertEquals(reads, 0);
  }
});
Deno.test('20 concurrent manual checks perform only readback', async () => {
  let reads = 0;
  const responses = await Promise.all(Array.from({ length: 20 }, () => handleInvoiceReconciliation(
    new Request('http://localhost', { method: 'POST', body: JSON.stringify({ orderId: id }) }), {
      authorize: async () => ({ ok: true }), headers: {}, read: async () => { reads++; return order; },
    })));
  assertEquals(reads, 20);
  for (const response of responses) {
    assertEquals(response.status, 200); assertEquals((await response.json()).retryAllowed, false);
  }
  assertEquals(order.number, null); assertEquals(order.status, 'approved');
});
Deno.test('database uncertainty is not reported as non-issuance', async () => {
  const response = await handleInvoiceReconciliation(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ orderId: id }) }), {
    authorize: async () => ({ ok: true }), headers: {}, read: async () => { throw new Error('timeout'); },
  });
  assertEquals(response.status, 503);
});