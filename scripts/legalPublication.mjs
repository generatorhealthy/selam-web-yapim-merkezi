import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { isLegalPublished } from '../src/lib/legalPublication.js';

export function approvedLegalPages(root = process.cwd()) {
  const registry = JSON.parse(readFileSync(resolve(root, 'src/content/legal/publication.json'), 'utf8'));
  return Object.values(registry.documents).filter(isLegalPublished).map(entry => {
    const folder = resolve(root, 'src/content/legal', registry.version);
    const text = readFileSync(resolve(folder, entry.file), 'utf8');
    const hash = createHash('sha256').update(text).digest('hex');
    const sums = readFileSync(resolve(folder, 'SHA256SUMS'), 'utf8');
    if (!sums.split('\n').includes(`${hash}  ${entry.file}`)) throw new Error('legal_document_hash_mismatch');
    return { ...entry, description: `Doktorum Ol ${entry.title.toLocaleLowerCase('tr')}.`, html: renderToStaticMarkup(React.createElement('article', null, React.createElement(ReactMarkdown, null, text))), hash };
  });
}