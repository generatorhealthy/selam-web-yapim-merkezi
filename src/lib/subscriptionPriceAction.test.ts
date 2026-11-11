import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSubscriptionPriceAction } from './subscriptionPriceAction';

test('second-year pending bank transfer orders expose price editing at months 13 and 14', () => {
  for (const subscription_month of [13, 14]) {
    assert.equal(getSubscriptionPriceAction({ payment_method: 'banka_havalesi', subscription_month, status: 'pending' }), 'order');
  }
});

test('first-year and historical paid bank transfer orders are not offered annual price editing', () => {
  assert.equal(getSubscriptionPriceAction({ payment_method: 'banka_havalesi', subscription_month: 12, status: 'pending' }), null);
  assert.equal(getSubscriptionPriceAction({ payment_method: 'banka_havalesi', subscription_month: 13, status: 'approved' }), null);
});

test('linked card subscriptions retain the iyzico upgrade flow', () => {
  assert.equal(getSubscriptionPriceAction({ payment_method: 'credit_card', subscription_reference_code: 'existing-subscription', subscription_month: 14, status: 'pending' }), 'iyzico');
  assert.equal(getSubscriptionPriceAction({ payment_method: 'credit_card', subscription_month: 14, status: 'pending' }), null);
});