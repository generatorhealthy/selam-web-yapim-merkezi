import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const step = name => {
  const block = workflow.split('      - name: ').find(value => value.startsWith(name + '\n'));
  assert.ok(block, `Missing step: ${name}`);
  return block;
};

test('network preparation steps have finite deadlines', () => {
  for (const [name, minutes] of [
    ['Install dependencies', 10],
    ['Prepare browser for existing home presentation capture', 10],
    ['Build project', 15],
    ["Keep older releases' assets for RETAIN_DAYS", 15],
    ['Verify live sitemap, redirects and real 404 responses', 30],
  ]) assert.match(step(name), new RegExp(`timeout-minutes: ${minutes}\\b`));
});

test('upload is not interrupted by preparation deadlines and asset retention stays 14 days', () => {
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(step("Keep older releases' assets for RETAIN_DAYS"), /RETAIN_DAYS: '14'/);
  for (const name of ['Deploy application assets', 'Deploy supporting files', 'Activate release']) {
    assert.doesNotMatch(step(name), /timeout-minutes:/);
    assert.match(step(name), /timeout: 120000/);
  }
  assert.ok(workflow.indexOf("- name: Keep older releases' assets") < workflow.indexOf('- name: Deploy application assets'));
  assert.doesNotMatch(step("Keep older releases' assets for RETAIN_DAYS"), /continue-on-error: true/);
});