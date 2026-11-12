import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { HorizontalNavigation } from '@/components/HorizontalNavigation';
import Footer from '@/components/Footer';
import publication from '@/content/legal/publication.json';
import { isLegalPublished } from '@/lib/legalPublication.js';
import disclosure from '@/content/legal/2026-11-12-yayin-v9/aydinlatma-metni.md?raw';
import consent from '@/content/legal/2026-11-12-yayin-v9/acik-riza.md?raw';
import call from '@/content/legal/2026-11-12-yayin-v9/cagri-merkezi.md?raw';

export type LegalDocument = keyof typeof publication.documents;
const texts = { disclosure, consent, call };
export default function LegalPage({ document, draft = false }: { document: LegalDocument; draft?: boolean }) {
  const entry = publication.documents[document];
  const published = isLegalPublished(entry) && !draft;
  return <div className="min-h-screen bg-background text-foreground">
    <Helmet>
      <title>{entry.title} | Doktorum Ol{published ? '' : ' – Yayın Adayı'}</title>
      <meta name="description" content={`Doktorum Ol ${entry.title.toLocaleLowerCase('tr')}.`} />
      <meta name="legal-document-version" content={publication.version} />
      {published && <meta name="legal-published-at" content={entry.published_at ?? undefined} />}
      <meta name="robots" content={published ? 'index, follow' : 'noindex, nofollow'} />
      {published && <link rel="canonical" href={`https://doktorumol.com.tr${entry.path}`} />}
    </Helmet>
    <HorizontalNavigation />
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      {!published && <p role="status" className="mb-6 border-l-4 border-destructive bg-destructive/10 p-4 text-sm text-destructive">Yayın adayı — {entry.blocking_reason ?? "İçerik değerlendirmesi bekleniyor."} Bu sayfa açık rıza kaydetmez.</p>}
      <article className="min-w-0 break-words text-[15px] leading-relaxed">
        <ReactMarkdown components={{
          h1: p => <h1 className="mb-6 text-2xl font-bold leading-snug sm:text-3xl" {...p} />,
          h2: p => <h2 className="mb-3 mt-9 border-b border-border pb-2 text-xl font-semibold" {...p} />,
          h3: p => <h3 className="mb-2 mt-6 text-lg font-semibold" {...p} />,
          p: p => <p className="my-3" {...p} />,
          ul: p => <ul className="my-3 list-disc space-y-2 pl-5" {...p} />,
          ol: p => <ol className="my-3 list-decimal space-y-2 pl-5" {...p} />,
          a: ({ href, children }) => href?.startsWith('/') ? <Link to={href} className="text-primary underline underline-offset-4">{children}</Link> : <a href={href} className="text-primary underline underline-offset-4">{children}</a>,
        }}>{texts[document]}</ReactMarkdown>
      </article>
    </main>
    <Footer />
  </div>;
}