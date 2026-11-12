import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const banner = readFileSync('src/components/CookieConsent.tsx', 'utf8');
const pixel = readFileSync('src/lib/metaPixel.ts', 'utf8');

test('consent defaults load before any measurement tag and deny by default', () => {
  const defaultsAt = html.indexOf('gtag("consent", "default"');
  const gtagLoaderAt = html.indexOf('googletagmanager.com/gtag/js');
  assert.ok(defaultsAt > -1, 'consent defaults script missing');
  assert.ok(gtagLoaderAt > -1, 'gtag loader missing');
  assert.ok(defaultsAt < gtagLoaderAt, 'defaults must come before the tag loader');
  const defaultsBlock = html.slice(defaultsAt, html.indexOf('</script>', defaultsAt));
  assert.match(defaultsBlock, /analytics_storage: "denied"/);
  assert.match(defaultsBlock, /ad_storage: "denied"/);
});

test('google tags load only after a stored grant, never on idle alone', () => {
  assert.match(html, /function consentGranted\(\)/);
  assert.match(html, /if \(gtagLoaded \|\| !consentGranted\(\)\) return;/);
  assert.match(html, /if \(consentGranted\(\)\) \{/);
  assert.match(html, /window\.addEventListener\('consent-change', loadGtag\)/);
  assert.match(html, /navigator\.globalPrivacyControl === true\) return false/);
});

test('unverifiable legacy single-key answer is never auto-granted to new purposes', () => {
  const consentGrantedBlock = html.slice(html.indexOf('function consentGranted()'), html.indexOf('var gtagLoaded'));
  assert.doesNotMatch(consentGrantedBlock, /cookie-consent/, 'legacy key must not grant measurement');
  assert.match(html, /cookie_consent_analytics/);
  assert.match(html, /cookie_consent_advertising/);
  assert.doesNotMatch(pixel, /cookie-consent'\) === "accepted"/, 'meta pixel must not read the legacy key');
});

test('banner saves per-purpose answers and offers withdraw path', () => {
  assert.match(banner, /saveChoices\(\{ analytics: "granted", advertising: "granted" \}\)/);
  assert.match(banner, /saveChoices\(\{ analytics: "denied", advertising: "denied" \}\)/);
  assert.match(banner, /open-cookie-settings/);
  assert.match(banner, /Tercihleri Yönet/);
});

test('meta pixel reads the per-purpose advertising answer', () => {
  assert.match(pixel, /cookie_consent_advertising/);
});
