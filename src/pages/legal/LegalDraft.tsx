import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import aydinlatma from "@/content/legal/2026-11-12-yayin-adayi-v4/aydinlatma-metni.md?raw";
import cagri from "@/content/legal/2026-11-12-yayin-adayi-v4/cagri-merkezi.md?raw";
import riza from "@/content/legal/2026-11-12-yayin-adayi-v4/acik-riza.md?raw";

const DOCS: Record<string, string> = { "aydinlatma-metni": aydinlatma, "cagri-merkezi": cagri, "acik-riza": riza };

// Hukuki onay öncesi taslak önizlemesi: yalnız editör önizlemesinde ve yerelde açılır, yayındaki sitede açılmaz.
export const isLegalDraftHost = () =>
  typeof window !== "undefined" && (/^id-preview--/.test(window.location.hostname) || window.location.hostname === "localhost");

const LegalDraft = () => {
  const { doc = "" } = useParams();
  const text = DOCS[doc];
  if (!isLegalDraftHost() || !text) {
    return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Sayfa bulunamadı.</div>;
  }
  return (
    <div className="min-h-screen bg-muted/30">
      <Helmet><meta name="robots" content="noindex, nofollow" /><title>Taslak – KVKK metni</title></Helmet>
      <HorizontalNavigation />
      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            YAYIN ADAYI – hukuki belirsizlikler için onay bekliyor, yayında değil. Sürüm: 2026-11-12-v4
          </div>
          <article className="rounded-lg bg-card p-5 sm:p-8 shadow-sm text-foreground text-[15px]">
            <ReactMarkdown components={{
              h1: (p) => <h1 className="text-xl sm:text-2xl font-bold mb-2 leading-snug" {...p} />,
              h2: (p) => <h2 className="text-lg font-semibold mt-8 mb-3 border-b border-border pb-1" {...p} />,
              h3: (p) => <h3 className="text-base font-semibold mt-5 mb-2" {...p} />,
              p: (p) => <p className="my-3 leading-relaxed text-foreground/90" {...p} />,
              ul: (p) => <ul className="my-3 list-disc pl-5 space-y-1" {...p} />,
              ol: (p) => <ol className="my-3 list-decimal pl-5 space-y-1" {...p} />,
              strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
            }}>{text}</ReactMarkdown>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default LegalDraft;
