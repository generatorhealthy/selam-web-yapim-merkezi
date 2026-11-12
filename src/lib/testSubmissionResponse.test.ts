import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submissionReceipt, withdrawalReceipt } from './testSubmissionResponse.ts';

test('failed server submission cannot become a success receipt', () => {
  assert.throws(() => submissionReceipt({ error: 'result_not_committed' }));
});
test('submission success requires a server result AND matched specialist', () => {
  assert.throws(() => submissionReceipt({ resultId: '00000000-0000-4000-8000-000000000001' }));
  assert.equal(submissionReceipt({ resultId: '00000000-0000-4000-8000-000000000001', specialistId: '00000000-0000-4000-8000-000000000002' }).specialistId, '00000000-0000-4000-8000-000000000002');
});
test('withdrawal clears answers only after affirmative server receipt', () => {
  for (const value of [{}, { withdrawn: false }, { error: 'withdrawal_not_recorded' }]) assert.throws(() => withdrawalReceipt(value));
  assert.equal(withdrawalReceipt({ withdrawn: true }).withdrawn, true);
});