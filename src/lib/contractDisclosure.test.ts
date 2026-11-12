import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldAddCommitmentDisclosure, withCommitmentDisclosure } from './contractDisclosure.ts';

test('4000 TL commitment disclosure applies equally before and after approval', () => {
  const pending = { status: 'pending', amount: 4000, alreadyIncluded: false };
  const approved = { ...pending, status: 'approved' };
  assert.equal(shouldAddCommitmentDisclosure(pending.amount, pending.alreadyIncluded), true);
  assert.equal(shouldAddCommitmentDisclosure(approved.amount, approved.alreadyIncluded), true);
});

test('existing disclosure is not added a second time', () => {
  assert.equal(shouldAddCommitmentDisclosure(4000, true), false);
});

test('6500 TL full-price orders do not receive the 4000 TL discount disclosure', () => {
  assert.equal(shouldAddCommitmentDisclosure(6500, false), false);
});

test('5000 TL package is eligible for its own commitment disclosure', () => {
  assert.equal(shouldAddCommitmentDisclosure(5000, false), true);
  assert.equal(shouldAddCommitmentDisclosure(5000, true), false);
});

test('discount terms remain specific to the purchased package', () => {
  const contract = '<p><strong>Toplam Hizmet Süresi (Taahhütlü):</strong> 365 Gün</p>';
  const newOffer = withCommitmentDisclosure(contract, 5000);
  const existingOffer = withCommitmentDisclosure(contract, 4000);
  assert.ok(newOffer.includes('8.500 TL yerine 5.000 TL'));
  assert.ok(!newOffer.includes('6.500 TL yerine 4.000 TL'));
  assert.ok(existingOffer.includes('6.500 TL yerine 4.000 TL'));
  assert.ok(!existingOffer.includes('8.500 TL yerine 5.000 TL'));
  assert.equal(withCommitmentDisclosure(newOffer, 5000), newOffer);
});