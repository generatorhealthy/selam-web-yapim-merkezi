import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { captureHomeOpening } from './home-opening.mjs';

test('home capture blocks external reads and every mutation, without restoring a session', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'home-opening-'));
  const requests = [];
  try {
    await captureHomeOpening({
      directory,
      css: '',
      template: `<html><body><div class="min-h-screen"><header><img src="/logo.webp"></header><main><div class="hero-section"><h1>Public fixture</h1></div></main></div><script>
        fetch('https://example.invalid/private', {method:'POST'}).catch(()=>{});
        fetch('https://example.invalid/profile').catch(()=>{});
        fetch('/mutation', {method:'POST'}).catch(()=>{});
      </script></body></html>`,
      launchBrowser: async () => {
        const browser = process.env.OPENING_TEST_CDP
          ? await chromium.connectOverCDP(process.env.OPENING_TEST_CDP)
          : await chromium.launch({ headless: true });
        const newContext = browser.newContext.bind(browser);
        browser.newContext = async (...args) => {
          const context = await newContext(...args);
          context.on('requestfailed', request => requests.push([request.method(), new URL(request.url()).pathname]));
          return context;
        };
        return browser;
      },
    });
    assert.equal(requests.filter(([method, path]) => method === 'POST' && path === '/private').length, 2);
    assert.equal(requests.filter(([method, path]) => method === 'GET' && path === '/profile').length, 2);
    assert.equal(requests.filter(([method, path]) => method === 'POST' && path === '/mutation').length, 2);
  } finally { await rm(directory, { recursive: true, force: true }); }
});