import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveSpecialistProfileOnce } from './registrationCompletion.ts';

test('finished unpaid specialist does not create a second profile', async () => {
  let inserts = 0;
  const created = await saveSpecialistProfileOnce(
    async () => ({ data: { id: 'finished-unpaid-profile' }, error: null }),
    async () => { inserts++; return { error: null }; },
  );
  assert.equal(created, false);
  assert.equal(inserts, 0);
});

test('failed existence check cannot be treated as incomplete registration', async () => {
  let inserts = 0;
  const error = new Error('network unavailable');
  await assert.rejects(saveSpecialistProfileOnce(
    async () => ({ data: null, error }),
    async () => { inserts++; return { error: null }; },
  ), error);
  assert.equal(inserts, 0);
});

test('incomplete specialist creates one profile, reopening creates none', async () => {
  let id: string | null = null;
  let inserts = 0;
  const find = async () => ({ data: id ? { id } : null, error: null });
  const insert = async () => { inserts++; id = 'completed-profile'; return { error: null }; };
  assert.equal(await saveSpecialistProfileOnce(find, insert), true);
  assert.equal(await saveSpecialistProfileOnce(find, insert), false);
  assert.equal(inserts, 1);
});