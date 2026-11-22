import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./prerender-blog.mjs', import.meta.url), 'utf8');
const helper = source.slice(source.indexOf('function stableBootSource('), source.indexOf('const NAV ='));
const stableBootSource = vm.runInNewContext(`${helper}\nstableBootSource`, { Buffer, URL });

test('stable boot directly imports the retained core chunk without an entry request', () => {
  const result = stableBootSource('import { a } from "./app-core-123.js"; a();', '/assets/app-123.js');
  assert.equal(result, 'import { a } from "/assets/app-core-123.js"; a();');
});

test('dynamic chunk paths remain in the retained assets directory', () => {
  assert.equal(stableBootSource("import('./panel-123.js')", '/assets/app-123.js'), "import('/assets/panel-123.js')");
});

test('legacy monolithic entries stay hashed instead of duplicating megabytes in boot', () => {
  assert.equal(stableBootSource('x'.repeat(32769), '/assets/app-old.js'), 'import "/assets/app-old.js";\n');
});

test('inlining preserves the Vite preload asset table', () => {
  const code = 'const deps=["assets/panel-123.js","assets/panel-123.css"];';
  assert.equal(stableBootSource(code, '/assets/app-123.js'), code);
});