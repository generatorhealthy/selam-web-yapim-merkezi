import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { staticLegalFiles, writeStaticLegalPackage } from './legal-static-package.mjs';

test('no legal document is released without its own approval', () => {
  assert.deepEqual(staticLegalFiles(), []);
  assert.throws(() => writeStaticLegalPackage('/tmp/should-not-emit-legal'), /No independently approved/);
});
test('one approved independent notice is not blocked by two unapproved activities', () => {
  const root = mkdtempSync(join(tmpdir(), 'independent-legal-'));
  try {
    const folder = join(root, 'src/content/legal/synthetic'); mkdirSync(folder, { recursive: true });
    const entry = { path: '/cagri-merkezi-aydinlatma-metni', file: 'call.md', title: 'Synthetic notice', legal_approved_at: '2026-11-12T20:08:00Z', publication_authorized_at: '2026-11-12T20:08:00Z', published_at: '2026-11-12T20:09:00Z' };
    writeFileSync(join(root, 'src/content/legal/publication.json'), JSON.stringify({ version: 'synthetic', documents: { call: entry, disclosure: { legal_approved_at: null }, consent: { legal_approved_at: null } } }));
    const text = '# Synthetic\n\nNon-health communication.';
    writeFileSync(join(folder, 'call.md'), text); writeFileSync(join(folder, 'SHA256SUMS'), `${createHash('sha256').update(text).digest('hex')}  call.md\n`);
    const files = staticLegalFiles(root);
    assert.equal(files.length, 1); assert.equal(files[0].path, 'pre/cagri-merkezi-aydinlatma-metni.html');
    assert.ok(files[0].html.includes(files[0].documentHash));
    assert.doesNotMatch(files[0].html, /<script|boot\.js|health_test_release/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});