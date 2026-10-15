import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldAddCommitmentDisclosure } from './contractDisclosure.ts';

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