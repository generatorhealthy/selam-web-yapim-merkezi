import { assertEquals } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { acceptInvoiceReceipt, parseInvoiceReceipt } from './invoiceReceipt.ts';
const id = '11111111-1111-4111-8111-111111111111';
const receipt = { orderReference: id, number: 'BF202600000001', issuedAt: '2026-11-13T07:00:00Z' };
Deno.test('receipt requires real provider number and dated reference', () => {
  assertEquals(parseInvoiceReceipt({ OrderId: id, InvoiceNo: '', InvoiceDate: receipt.issuedAt }), null);
  assertEquals(parseInvoiceReceipt({ OrderId: 'wrong', InvoiceNo: receipt.number, InvoiceDate: receipt.issuedAt }), null);
  assertEquals(parseInvoiceReceipt({ OrderId: id, InvoiceNo: receipt.number, InvoiceDate: '13.11.2026 10:00:00' })?.issuedAt, '2026-11-13T07:00:00.000Z');
});
Deno.test('20 identical provider receipts record one invoice without overwriting', async () => {
  let number: string | null = null; let writes = 0;
  const ports = {
    resolve: async () => [{ id, status: 'approved', number }],
    storeOnce: async () => { if (number) return false; number = receipt.number; writes++; return true; },
  };
  const results = await Promise.all(Array.from({ length: 20 }, () => acceptInvoiceReceipt(receipt, ports)));
  assertEquals(writes, 1); assertEquals(results.every(r => r.success), true);
});
Deno.test('ambiguous timestamp reference cannot identify an order', async () => {
  let writes = 0;
  const result = await acceptInvoiceReceipt(receipt, { resolve: async () => [{ id, status: 'approved', number: null }, { id: 'other', status: 'approved', number: null }], storeOnce: async () => { writes++; return true; } });
  assertEquals(result.success, false); assertEquals(writes, 0);
});
Deno.test('different invoice cannot replace historical invoice', async () => {
  let writes = 0;
  const result = await acceptInvoiceReceipt(receipt, { resolve: async () => [{ id, status: 'approved', number: 'OLD-INVOICE' }], storeOnce: async () => { writes++; return true; } });
  assertEquals(result.state, 'invoice_reference_conflict'); assertEquals(writes, 0);
});
Deno.test('unpaid order does not accept invoice receipt', async () => {
  let writes = 0;
  const result = await acceptInvoiceReceipt(receipt, { resolve: async () => [{ id, status: 'pending', number: null }], storeOnce: async () => { writes++; return true; } });
  assertEquals(result.state, 'payment_not_approved'); assertEquals(writes, 0);
});
Deno.test('timeout after invoice receipt commit is read back without retry', async () => {
  let number: string | null = null; let writes = 0;
  const result = await acceptInvoiceReceipt(receipt, { resolve: async () => [{ id, status: 'approved', number }], storeOnce: async () => { writes++; number = receipt.number; throw new Error('timeout'); } });
  assertEquals(result.state, 'duplicate'); assertEquals(writes, 1);
});