import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registrationLinkPricing, registrationLinkDiscountPercent } from './registrationLinkPricing.ts';

test('registration link package retains 5000 TL sale price and uses 8500 TL original price', () => {
  assert.equal(registrationLinkPricing.price, 5000);
  assert.equal(registrationLinkPricing.originalPrice, 8500);
  assert.equal(registrationLinkDiscountPercent, 41);
});