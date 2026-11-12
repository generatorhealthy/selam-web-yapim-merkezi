import { approvedLegalPages } from './legalPublication.mjs';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function staticLegalFiles(root = process.cwd()) {
  const pages = approvedLegalPages(root);
  const footer = pages.map(p => `<a href="${p.path}">${escape(p.title)}</a>`).join(' · ');
  return pages.map(page => {
    const url = `https://doktorumol.com.tr${page.path}`;
    // Self-contained document: no boot.js, app bundle, credentials or health activation.
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} | Doktorum Ol</title><meta name="description" content="${escape(page.description)}"><link rel="canonical" href="${url}"><meta property="og:title" content="${escape(page.title)} | Doktorum Ol"><meta property="og:description" content="${escape(page.description)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary"><meta name="legal-document-sha256" content="${page.hash}"><meta name="legal-published-at" content="${page.published_at}"></head><body><header><a href="/">Doktorum Ol</a></header><main>${page.html}</main><footer><nav aria-label="Hukuki metinler">${footer}</nav><a href="/uzmanlar">Uzmanlar</a></footer></body></html>\n`;
    return { path: `pre${page.path}.html`, html, documentHash: page.hash, htmlHash: createHash('sha256').update(html).digest('hex'), publishedAt: page.published_at };
  });
}

export function writeStaticLegalPackage(destination, root = process.cwd()) {
  const files = staticLegalFiles(root);
  if (!files.length) throw new Error('No independently approved legal document; no package emitted');
  const out = resolve(destination);
  mkdirSync(`${out}/pre`, { recursive: true });
  for (const file of files) writeFileSync(`${out}/${file.path}`, file.html);
  writeFileSync(`${out}/legal-release.json`, JSON.stringify(files.map(({ html, ...record }) => record), null, 2));
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const destination = process.argv[2];
  if (!destination) throw new Error('Explicit package destination required');
  writeStaticLegalPackage(destination);
}