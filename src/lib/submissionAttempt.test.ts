import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSubmissionAttempt } from './submissionAttempt.ts';

test('double click starts only one request', () => {
  const attempt = createSubmissionAttempt();
  assert.ok(attempt.begin({ specialist: 'a', time: '10:00' }));
  assert.equal(attempt.begin({ specialist: 'a', time: '10:00' }), null);
});
test('lost response retries with the same database primary key', () => {
  const attempt = createSubmissionAttempt();
  const first = attempt.begin({ specialist: 'a', time: '10:00' });
  attempt.finish();
  assert.equal(attempt.begin({ specialist: 'a', time: '10:00' }), first);
});
test('legitimate later appointment receives a different identity', () => {
  const attempt = createSubmissionAttempt();
  const first = attempt.begin({ specialist: 'a', time: '10:00' });
  attempt.finish(true);
  assert.notEqual(attempt.begin({ specialist: 'a', time: '11:00' }), first);
});
test('confirmed submission cannot be submitted again before navigation', () => {
  const attempt = createSubmissionAttempt();
  attempt.begin({ specialist: 'a', time: '10:00' });
  attempt.finish(true);
  attempt.finish();
  assert.equal(attempt.begin({ specialist: 'a', time: '10:00' }), null);
});