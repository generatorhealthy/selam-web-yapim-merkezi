// PACKAGE A CANDIDATE ONLY; copy to src/pages/legal after explicit legal release approval.
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import { HorizontalNavigation } from '@/components/HorizontalNavigation';
import Footer from '@/components/Footer';
import disclosure from '@/content/legal/2026-11-12-yayin-adayi-v5/aydinlatma-metni.md?raw';
import consent from '@/content/legal/2026-11-12-yayin-adayi-v5/acik-riza.md?raw';
import call from '@/content/legal/2026-11-12-yayin-adayi-v5/cagri-merkezi.md?raw';
const documents={disclosure:{text:disclosure,path:'/aydinlatma-metni',title:'KVKK Aydınlatma Metni'},
 consent:{text:consent,path:'/acik-riza',title:'Açık Rıza Metni'},
 call:{text:call,path:'/cagri-merkezi-aydinlatma-metni',title:'Çağrı Merkezi Aydınlatma Metni'}};
export default function LegalPage({document}:{document:keyof typeof documents}){
 const doc=documents[document];
 return <div className="min-h-screen bg-background text-foreground">
  <Helmet><title>{doc.title} | Doktorum Ol</title><meta name="description" content={`Doktorum Ol ${doc.title}.`}/>
   <link rel="canonical" href={`https://doktorumol.com.tr${doc.path}`}/></Helmet>
  <HorizontalNavigation/>
  <main className="container mx-auto px-4 py-8 max-w-3xl">
   <article className="prose max-w-none break-words text-foreground prose-headings:text-foreground prose-a:text-primary">
    <ReactMarkdown>{doc.text}</ReactMarkdown>
   </article>
  </main><Footer/>
 </div>;
}