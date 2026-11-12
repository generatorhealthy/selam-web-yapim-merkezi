import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paymentConfirmed } from './paymentConfirmation.ts';
test('pending or absent server order never means successful payment', () => {
  assert.equal(paymentConfirmed(null), false);
  assert.equal(paymentConfirmed({ status: 'pending', payment_method: 'credit_card' }), false);
  assert.equal(paymentConfirmed({ status: 'failed', payment_method: 'credit_card' }), false);
});
test('only acknowledged approved card order confirms payment, not membership activation', () => {
  assert.equal(paymentConfirmed({ status: 'approved', payment_method: 'credit_card' }), true);
  assert.equal(paymentConfirmed({ status: 'completed', payment_method: 'credit_card' }), true);
  assert.equal(paymentConfirmed({ status: 'pending', payment_method: 'bank_transfer' }), false);
});