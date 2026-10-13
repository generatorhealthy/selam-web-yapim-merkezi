import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_BRANCHES, parseLocalSlug, buildLocalPages } from './localSeo.js';

test('Klinik Psikolog and all bare branches are not city pages', () => {
  assert.equal(parseLocalSlug('klinik-psikolog'), null);
  for (const branch of LOCAL_BRANCHES) assert.equal(parseLocalSlug(branch.slug), null);
});

test('city and online clinical psychologist pages still resolve correctly', () => {
  assert.equal(parseLocalSlug('istanbul-klinik-psikolog')?.citySlug, 'istanbul');
  assert.equal(parseLocalSlug('istanbul-klinik-psikolog')?.branch.slug, 'klinik-psikolog');
  assert.equal(parseLocalSlug('online-klinik-psikolog')?.kind, 'online');
  const pages = buildLocalPages([{ id: 'clinical-profile', specialty: 'Klinik Psikolog', city: 'İstanbul', online_consultation: true }]);
  assert.deepEqual(pages.map(p => p.slug), ['istanbul-klinik-psikolog', 'online-klinik-psikolog']);
  assert.equal(pages[0].list[0].id, 'clinical-profile');
});