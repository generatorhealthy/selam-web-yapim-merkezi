import { useParams } from "react-router-dom";
import LegalPage, { type LegalDocument } from "./LegalPage";
import { isLegalPreviewHost } from "@/lib/legalPublication.js";
const documents: Record<string, LegalDocument> = { "aydinlatma-metni": "disclosure", "acik-riza": "consent", "cagri-merkezi": "call" };
export const isLegalDraftHost = () => typeof window !== "undefined" && isLegalPreviewHost(window.location.hostname);
export default function LegalDraft() {
  const { doc = "" } = useParams();
  const document = documents[doc];
  if (!isLegalDraftHost() || !document) return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Sayfa bulunamadı.</div>;
  return <LegalPage document={document} draft />;
}
