import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutAfterOrder } from './checkoutSubmission.ts';

test('failed order never initializes payment', async () => {
  let calls = 0;
  assert.equal(await checkoutAfterOrder(async () => false, async () => { calls++; }), false);
  assert.equal(calls, 0);
});
test('database acknowledgment precedes payment initialization', async () => {
  const sequence: string[] = [];
  assert.equal(await checkoutAfterOrder(async () => { sequence.push('saved'); return true; }, async () => { sequence.push('payment'); }), true);
  assert.deepEqual(sequence, ['saved', 'payment']);
});