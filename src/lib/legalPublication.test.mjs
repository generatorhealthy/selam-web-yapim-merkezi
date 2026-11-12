import test from 'node:test';
import assert from 'node:assert/strict';
import publication from '../content/legal/publication.json' with { type: 'json' };
import { isLegalPublished, canShowLegalCandidate } from './legalPublication.js';

test('each of the three v6 pages stays unpublished until its own approvals exist', () => {
  assert.deepEqual(Object.values(publication.documents).map(d => d.path), ['/aydinlatma-metni', '/acik-riza', '/cagri-merkezi-aydinlatma-metni']);
  for (const d of Object.values(publication.documents)) assert.equal(isLegalPublished(d), false);
});
test('a publication instruction alone does not declare legal approval', () => {
  for (const document of Object.values(publication.documents)) {
    assert.equal(document.publication_authorized_at, '2026-11-12T18:55:00Z');
    assert.equal(document.legal_approved_at, null);
    assert.equal(document.published_at, null);
  }
  assert.equal(isLegalPublished({ publication_authorized_at: '2026-11-12T18:37:00Z', published_at: '2026-11-12T18:37:00Z' }), false);
});
test('complete document approval allows only that document', () => {
  const approved = { legal_approved_at: '2026-11-12T18:37:00Z', publication_authorized_at: '2026-11-12T18:37:00Z', published_at: '2026-11-12T18:37:00Z' };
  assert.equal(isLegalPublished(approved), true);
  assert.equal(isLegalPublished({ ...approved, legal_approved_at: 'invalid' }), false);
  assert.equal(isLegalPublished(publication.documents.call), false);
});
test('unapproved text is visible only on localhost and the actual editor preview host', () => {
  const d = publication.documents.call;
  for (const h of ['localhost', 'id-preview--27547471-8128-4c80-9069-f0c3832f9ac9.lovable.app']) assert.equal(canShowLegalCandidate(d, h), true);
  for (const h of ['doktorumol.com.tr', 'yenii.lovable.app', 'id-preview--evil.example.com']) assert.equal(canShowLegalCandidate(d, h), false);
});