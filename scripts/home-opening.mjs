import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';
import postcss from 'postcss';

// Capture only public presentation in a fresh, offline browser. No sessions,
// production requests, consent actions or database writes are permitted.
export async function captureHomeOpening({ template, css, directory, launchBrowser = () => chromium.launch({ headless: true }) }) {
  const root = resolve(directory);
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (path === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(template);
        return;
      }
      const file = resolve(root, `.${path}`);
      if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const types = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Opening capture server unavailable');
  const origin = `http://127.0.0.1:${address.port}`;
  let browser;
  try {
    browser = await launchBrowser();
    const selectors = [...new Set(postcss.parse(css).nodes.flatMap(function collect(node) {
      if (node.type === 'rule') return [node.selector];
      return node.nodes ? node.nodes.flatMap(collect) : [];
    }))];
    const matched = new Set();
    const headers = [];
    let main = '';
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 1800 } });
      await context.route('**/*', route => {
        const request = route.request();
        if (new URL(request.url()).origin === origin && request.method() === 'GET') return route.continue();
        return route.abort();
      });
      const page = await context.newPage();
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('.hero-section h1').waitFor();
      await page.waitForFunction(() => document.querySelector('header img[src="/logo.webp"]')?.complete);
      // Only these existing page elements; never serialize overlays, footer legal
      // candidates, localStorage or the rest of the application shell.
      const result = await page.evaluate((selectors) => {
        const hero = document.querySelector('.hero-section');
        const wrapper = hero?.closest('.min-h-screen');
        const header = wrapper?.querySelector('header');
        const main = wrapper?.querySelector('main');
        if (!header || !main) throw new Error('Existing home presentation not found');
        const matches = selectors.filter(selector => {
          try {
            const clean = selector.replace(/::[\w-]+(?:\([^)]*\))?/g, '').replace(/:(?:hover|focus-visible|focus-within|focus|active|visited)\b/g, '');
            return [...document.querySelectorAll(clean)].some(element =>
              header.contains(element) || hero.contains(element) || element.contains(header) || element.contains(hero));
          } catch { return true; } // Preserve complex selectors rather than drop needed CSS.
        });
        return { header: header.outerHTML, main: `<main>${hero.outerHTML}</main>`, matches };
      }, selectors);
      headers.push(result.header);
      if (!main) main = result.main;
      for (const selector of result.matches) matched.add(selector);
      await context.close();
    }
    const critical = postcss.parse(css);
    critical.walkRules(rule => {
      if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
      if (!matched.has(rule.selector)) rule.remove();
    });
    critical.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
    // Before React takes over, existing specialty/search destinations remain
    // real navigable links (including for crawlers and JavaScript-off visitors).
    const destinations = { 'Psikolog': 'psikolog', 'Psikolojik Danışmanlık': 'psikolojik-danismanlik', 'Aile Danışmanı': 'aile-danismani', 'Psikiyatri': 'psikiyatri', 'Kadın Hastalıkları ve Doğum': 'kadin-hastaliklari-ve-dogum', 'Diyetisyen': 'diyetisyen', 'Klinik Psikolog': 'klinik-psikolog', 'Romatoloji': 'romatoloji', 'Genel Cerrahi': 'genel-cerrahi', 'Tıbbi Onkoloji': 'tibbi-onkoloji' };
    main = main.replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/g, (original, attrs, content) => {
      const title = attrs.match(/\btitle="([^"]+)"/)?.[1];
      const slug = destinations[title];
      const href = slug ? `/uzmanlik/${slug}` : /Tümünü Göster|Randevu Ara/.test(content) ? '/uzmanlar' : null;
      return href ? `<a${attrs} href="${href}">${content}</a>` : original;
    });
    const html = `<div class="min-h-screen bg-gray-50"><div class="opening-desktop">${headers[0]}</div><div class="opening-mobile">${headers[1]}</div>${main}</div>`;
    return { html, css: critical.toString() + '.opening-mobile{display:none}@media(max-width:767px){.opening-desktop{display:none}.opening-mobile{display:block}}' };
  } finally {
    await browser?.close();
    await new Promise(r => server.close(r));
  }
}