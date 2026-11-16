import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardPaymentsAllowedFor, CARD_PAYMENT_PACKAGES } from '../../supabase/functions/_shared/cardPaymentPackages.ts';

test('4000 TL paketi kartla ödemeye kapalıdır', () => {
  assert.equal(cardPaymentsAllowedFor('ozel-firsat'), false);
});

test('5000 TL paketi kartla ödemeye kapalıdır', () => {
  assert.equal(cardPaymentsAllowedFor('kayit-linki'), false);
});

test('geçici test paketi kartla ödemeye açıktır', () => {
  assert.equal(cardPaymentsAllowedFor('test-paket-link'), true);
});

test('bilinmeyen veya eksik paket kartla ödemeye kapalıdır', () => {
  assert.equal(cardPaymentsAllowedFor(undefined), false);
  assert.equal(cardPaymentsAllowedFor(null), false);
  assert.equal(cardPaymentsAllowedFor(''), false);
  assert.equal(cardPaymentsAllowedFor(4000), false);
});

test('kart listesi yalnız geçici test paketini içerir', () => {
  assert.deepEqual([...CARD_PAYMENT_PACKAGES], ['test-paket-link']);
});
