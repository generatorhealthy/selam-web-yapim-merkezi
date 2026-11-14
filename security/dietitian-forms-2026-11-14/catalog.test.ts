import { test } from 'node:test';
import assert from 'node:assert/strict';
import catalog from './catalog.json';

test('dietitian intake contains exactly 15 unscored forms and no active release', () => {
  assert.equal(catalog.forms.length, 15);
  assert.equal(catalog.scoring, null);
  assert.equal(catalog.is_active, false);
  assert.equal(catalog.status, 'draft');
  assert.equal(catalog.specialty, 'Diyetisyen');
  assert.equal(new Set(catalog.forms.map(f => f.slug)).size, 15);
});
test('all 60 questions permit withholding answers and have no numeric score options', () => {
  const questions = catalog.forms.flatMap(f => f.questions);
  assert.equal(questions.length, 60);
  for (const q of questions) {
    assert.equal(q.is_required, false);
    assert.ok(q.options.includes('Paylaşmak istemiyorum'));
    assert.ok(q.options.includes('Bana uygun değil'));
    assert.ok(q.options.every(option => typeof option === 'string'));
  }
});