import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderLegalTexts, OUTPUT } from './build-legal-texts.mjs';

test('sayfadaki hukuki metinler markdown dosyalarıyla birebir aynı', () => {
  assert.equal(readFileSync(OUTPUT, 'utf8'), renderLegalTexts());
});
