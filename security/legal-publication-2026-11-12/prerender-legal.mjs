// Candidate module: only render supplied approved content. No network or implicit publication.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
export const LEGAL_PATHS = ['/aydinlatma-metni','/acik-riza','/cagri-merkezi-aydinlatma-metni'];
export function renderLegalHtml({path,text,manifest}) {
 if(!LEGAL_PATHS.includes(path)||manifest?.status!=='approved_for_publication'||!manifest.published_at) {
  throw new Error('legal_publication_not_approved');
 }
 return renderToStaticMarkup(React.createElement('article',{className:'legal-document'},
  React.createElement(ReactMarkdown,null,text)));
}