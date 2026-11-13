import { assertEquals } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { queueInvoice } from './invoiceQueue.ts';
const id = '11111111-1111-4111-8111-111111111111';
Deno.test('20 concurrent invoice requests acquire only one queue transition', async () => {
  let queued = false; let writes = 0;
  const ports = {
    read: async () => ({ id, status: 'approved', queued }),
    enqueue: async () => { if (queued) return false; queued = true; writes++; return true; },
  };
  const results = await Promise.all(Array.from({ length: 20 }, () => queueInvoice(id, ports)));
  assertEquals(writes, 1);
  assertEquals(results.filter(r => r.state === 'queued').length, 1);
  assertEquals(results.every(r => r.success), true);
});
Deno.test('pending payment never enters invoice queue', async () => {
  let writes = 0;
  const result = await queueInvoice(id, { read: async () => ({ id, status: 'pending', queued: false }), enqueue: async () => { writes++; return true; } });
  assertEquals(result.state, 'not_approved'); assertEquals(writes, 0);
});
Deno.test('lost response after commit is read back without retry', async () => {
  let queued = false; let writes = 0;
  const result = await queueInvoice(id, { read: async () => ({ id, status: 'completed', queued }), enqueue: async () => { writes++; queued = true; throw new Error('timeout'); } });
  assertEquals(result.state, 'already_queued'); assertEquals(writes, 1);
});
Deno.test('unknown queue outcome never claims invoice success or retries', async () => {
  let writes = 0;
  const result = await queueInvoice(id, { read: async () => ({ id, status: 'approved', queued: false }), enqueue: async () => { writes++; throw new Error('offline'); } });
  assertEquals(result.success, false); assertEquals(writes, 1);
});
Deno.test('missing and invalid order do not enqueue', async () => {
  let writes = 0;
  const ports = { read: async () => null, enqueue: async () => { writes++; return true; } };
  assertEquals((await queueInvoice('invalid', ports)).state, 'invalid_order');
  assertEquals((await queueInvoice(id, ports)).state, 'order_missing');
  assertEquals(writes, 0);
});