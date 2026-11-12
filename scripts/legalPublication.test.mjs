import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { approvedLegalPages } from './legalPublication.mjs';

test('all three independently approved v9 information pages are emitted', () => {
  assert.deepEqual(approvedLegalPages().map(page => page.path), ['/aydinlatma-metni', '/acik-riza', '/cagri-merkezi-aydinlatma-metni']);
});
test('prerender emits only an approved document and rejects altered text', () => {
  const root = mkdtempSync(join(tmpdir(), 'legal-publication-'));
  try {
    const registry = JSON.parse(readFileSync('src/content/legal/publication.json', 'utf8'));
    for (const entry of Object.values(registry.documents)) entry.legal_approved_at = null;
    registry.documents.call = { ...registry.documents.call, legal_approved_at: '2026-11-12T18:37:00Z', publication_authorized_at: '2026-11-12T18:37:00Z', published_at: '2026-11-12T18:37:00Z' };
    const folder = join(root, 'src/content/legal', registry.version);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(root, 'src/content/legal/publication.json'), JSON.stringify(registry));
    const text = '# Synthetic document\n\nSynthetic content.';
    writeFileSync(join(folder, 'cagri-merkezi.md'), text);
    writeFileSync(join(folder, 'SHA256SUMS'), `${createHash('sha256').update(text).digest('hex')}  cagri-merkezi.md\n`);
    const pages = approvedLegalPages(root);
    assert.deepEqual(pages.map(p => p.path), ['/cagri-merkezi-aydinlatma-metni']);
    writeFileSync(join(folder, 'cagri-merkezi.md'), 'changed');
    assert.throws(() => approvedLegalPages(root), /legal_document_hash_mismatch/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});