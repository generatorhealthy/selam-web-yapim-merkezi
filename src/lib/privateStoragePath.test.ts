import { test } from 'node:test';
import assert from 'node:assert/strict';
import { privateStoragePath, PRIVATE_FILE_URL_TTL } from './privateStoragePath';
const origin = 'https://synthetic.example.invalid';
test('private links last five minutes, not ten years', () => assert.equal(PRIVATE_FILE_URL_TTL, 300));
test('old signed URL preserves complete owner folder without reusing token', () => {
  assert.equal(privateStoragePath(`${origin}/storage/v1/object/sign/legal-documents/owner/contract.pdf?token=synthetic`, 'legal-documents', origin), 'owner/contract.pdf');
});
test('public legacy evidence locator becomes a private path', () => {
  assert.equal(privateStoragePath(`${origin}/storage/v1/object/public/legal-evidence/evidence/owner/file.png`, 'legal-evidence', origin), 'evidence/owner/file.png');
});
test('foreign origin and wrong bucket are rejected', () => {
  assert.throws(() => privateStoragePath('https://other.example.invalid/storage/v1/object/sign/legal-documents/file.pdf', 'legal-documents', origin));
  assert.throws(() => privateStoragePath(`${origin}/storage/v1/object/sign/profile-pictures/file.png`, 'legal-documents', origin));
});
test('unsafe paths cannot be signed', () => {
  for (const value of ['../file.pdf', 'owner/../file.pdf', '/file.pdf', 'owner\\file.pdf', 'file.pdf?token=x', 'owner//file.pdf']) {
    assert.throws(() => privateStoragePath(value, 'legal-documents', origin));
  }
});
test('new saved documents retain only storage path', () => assert.equal(privateStoragePath('2026/11/file.zip', 'accounting-documents', origin), '2026/11/file.zip'));