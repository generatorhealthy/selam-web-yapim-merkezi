import { assertEquals } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { verifySubscriptionV3 } from './subscription-v3-candidate.ts';
import { legacyState, acceptanceState } from './acceptance-rules.ts';

const body = { iyziEventType: 'subscription.order.success', subscriptionReferenceCode: 'sub',
  orderReferenceCode: 'period', customerReferenceCode: 'customer' };
// Independent Python stdlib HMAC vector, using the official subscription message order.
const vector = '6e3c67baa4c60eec6da7f14da88170ff888fd03047b62e1db5de0ca9c2f664df';
Deno.test('subscription V3 official merchant-first fixed vector passes', async () => {
  assertEquals(await verifySubscriptionV3('synthetic-secret', '123', body, vector), true);
});
Deno.test('subscription V3 wrong merchant and tampered period fail', async () => {
  assertEquals(await verifySubscriptionV3('synthetic-secret', '124', body, vector), false);
  assertEquals(await verifySubscriptionV3('synthetic-secret', '123', { ...body, orderReferenceCode: 'forged' }, vector), false);
});
Deno.test('subscription V3 missing fields and invalid signature fail', async () => {
  assertEquals(await verifySubscriptionV3('synthetic-secret', '123', { ...body, customerReferenceCode: '' }, vector), false);
  assertEquals(await verifySubscriptionV3('synthetic-secret', '123', body, ''), false);
});
Deno.test('no provider evidence never implies unpaid or expired', () => {
  assertEquals(legacyState({}), 'unknown');
  assertEquals(legacyState({ expired: true }), 'unknown');
});
Deno.test('verified charge outranks an expired form', () => {
  assertEquals(legacyState({ providerRead: true, paid: true, expired: true }), 'paid');
});
Deno.test('provider-confirmed unpaid and expired remain distinct', () => {
  assertEquals(legacyState({ providerRead: true, paid: false, expired: false }), 'unpaid');
  assertEquals(legacyState({ providerRead: true, paid: false, expired: true }), 'expired');
});
Deno.test('paid but inactive is a staff alert, not a retry', () => {
  assertEquals(acceptanceState({ paid: true, activation: false, binding: true, invoiceJobs: 1, notificationJobs: 1 }), 'activation_missing');
});
Deno.test('missing durable job evidence is not accepted', () => {
  assertEquals(acceptanceState({ paid: true, activation: true, binding: true, invoiceJobs: null, notificationJobs: null }), 'evidence_pending');
});
Deno.test('single jobs and binding are necessary for acceptance', () => {
  assertEquals(acceptanceState({ paid: true, activation: true, binding: true, invoiceJobs: 1, notificationJobs: 1 }), 'accepted');
  assertEquals(acceptanceState({ paid: true, activation: true, binding: true, invoiceJobs: 2, notificationJobs: 1 }), 'evidence_pending');
  assertEquals(acceptanceState({ paid: true, activation: true, binding: false, invoiceJobs: 1, notificationJobs: 1 }), 'evidence_pending');
});