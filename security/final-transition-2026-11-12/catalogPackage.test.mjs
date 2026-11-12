import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogSql, catalogHashes, catalogVersion } from './catalogPackage.mjs';

const approval = {
  legalApprovedAt: '2026-11-12T20:00:00Z', publishedAt: '2026-11-12T20:01:00Z',
  approvedDisclosureHash: catalogHashes.disclosure, approvedConsentHash: catalogHashes.consent,
  healthTransferBasisVerified: true,
};
test('catalog cannot assert an unapproved document is approved', () => {
  assert.throws(() => catalogSql({ ...approval, legalApprovedAt: null }));
});
test('approval is bound to the exact health disclosure and consent bytes', () => {
  for (const key of ['approvedDisclosureHash', 'approvedConsentHash']) assert.throws(() => catalogSql({ ...approval, [key]: '0'.repeat(64) }));
});
test('general health consent cannot be treated as foreign transfer assurance', () => {
  assert.throws(() => catalogSql({ ...approval, healthTransferBasisVerified: false }));
});
test('publication must follow actual legal approval', () => {
  assert.throws(() => catalogSql({ ...approval, publishedAt: '2026-11-12T19:59:00Z' }));
});
test('catalog is separate from 57 legacy membership approvals and activation', () => {
  const sql = catalogSql(approval);
  assert.match(sql, /INSERT INTO public\.health_test_documents/);
  assert.ok(sql.includes(catalogVersion));
  assert.doesNotMatch(sql, /(?:UPDATE|DELETE|ALTER|INSERT INTO public\.user_consent_logs|health_test_release)/i);
});