import test from 'node:test';
import assert from 'node:assert/strict';
import publication from '../content/legal/publication.json' with { type: 'json' };
import { isLegalPublished, canShowLegalCandidate } from './legalPublication.js';

test('all three v9 information pages are independently published', () => {
  assert.deepEqual(Object.values(publication.documents).map(d => d.path), ['/aydinlatma-metni', '/acik-riza', '/cagri-merkezi-aydinlatma-metni']);
  assert.equal(isLegalPublished(publication.documents.disclosure), true);
  assert.equal(isLegalPublished(publication.documents.call), true);
  assert.equal(isLegalPublished(publication.documents.consent), true);
});
test('every published document carries its own approval, authorization and publication time', () => {
  for (const document of Object.values(publication.documents)) {
    assert.equal(document.decision, 'information_release');
    assert.equal(document.blocking_reason, null);
    for (const key of ['legal_approved_at', 'publication_authorized_at', 'published_at']) {
      assert.equal(typeof document[key], 'string');
      assert.ok(Number.isFinite(Date.parse(document[key])));
    }
  }
  assert.equal(isLegalPublished({ publication_authorized_at: '2026-11-12T18:37:00Z', published_at: '2026-11-12T18:37:00Z' }), false);
});
test('only the hash-verified production information page records deployment verification', () => {
  for (const document of Object.values(publication.documents)) {
    if (document.path === "/acik-riza") assert.equal(document.deployment_verified_at, "2026-11-12T20:52:26Z");
    else assert.equal(document.deployment_verified_at, null);
    assert.equal(document.scope, 'public_information_only_not_compliance_certification');
  }
});
test('complete document approval allows only that document', () => {
  const approved = { legal_approved_at: '2026-11-12T18:37:00Z', publication_authorized_at: '2026-11-12T18:37:00Z', published_at: '2026-11-12T18:37:00Z' };
  assert.equal(isLegalPublished(approved), true);
  assert.equal(isLegalPublished({ ...approved, legal_approved_at: 'invalid' }), false);
  assert.equal(isLegalPublished({ ...approved, published_at: null }), false);
});
test('published text is visible on production and preview hosts alike', () => {
  const d = publication.documents.call;
  for (const h of ['localhost', 'id-preview--27547471-8128-4c80-9069-f0c3832f9ac9.lovable.app', 'doktorumol.com.tr', 'yenii.lovable.app']) assert.equal(canShowLegalCandidate(d, h), true);
  const unpublished = { ...d, legal_approved_at: null };
  assert.equal(canShowLegalCandidate(unpublished, 'doktorumol.com.tr'), false);
  assert.equal(canShowLegalCandidate(unpublished, 'localhost'), true);
});
