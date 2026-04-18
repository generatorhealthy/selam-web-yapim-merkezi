import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { FileSignature, FileText, Download, X } from "lucide-react";

export default function MobileSpecialistContracts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [viewer, setViewer] = useState<{ title: string; html: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/mobile/login"); return; }

      // Specialist adını da al (edge function ad bazlı eşleşme yapar)
      const { data: spec } = await supabase
        .from("specialists")
        .select("name")
        .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
        .maybeSingle();

      const { data } = await supabase
        .from("orders")
        .select("*")
        .ilike("customer_email", session.user.email || "")
        .in("status", ["pending", "approved", "completed"])
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      // Edge function — daha geniş eşleşme (email + name)
      let merged: any[] = data || [];
      try {
        const { data: edgeData } = await supabase.functions.invoke("get-specialist-contracts", {
          body: { email: session.user.email, name: spec?.name || null },
        });
        if (Array.isArray(edgeData)) {
          merged = Array.from(
            new Map([...(merged as any[]), ...(edgeData as any[])].map((o: any) => [o.id, o])).values(),
          ).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
      } catch {}

      // Web ile aynı: sadece ilk (en eski) sözleşmeyi göster
      setContracts(merged.slice(0, 1));
      setLoading(false);
    })();
  }, [navigate]);

  const openContract = (content: string | null, title: string) => {
    if (!content) {
      setViewer({
        title,
        html: `<p style="color:#666;text-align:center;padding:24px">Bu sipariş için ${title.toLowerCase()} henüz oluşturulmamış.</p>`,
      });
      return;
    }
    setViewer({ title, html: content });
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Sözleşmeler" subtitle="Belgelerim" />

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        ) : contracts.length === 0 ? (
          <MobileEmptyState icon={FileSignature} title="Henüz sözleşmeniz yok" />
        ) : (
          contracts.map((c) => (
            <div key={c.id} className="m-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--m-accent-soft))" }}
                >
                  <FileSignature className="w-5 h-5" style={{ color: "hsl(var(--m-accent))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px]" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {c.package_name}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {new Date(c.created_at).toLocaleDateString("tr-TR")} · {c.amount}₺
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openContract(c.pre_info_pdf_content, "Ön Bilgilendirme Formu")}
                  className="h-11 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable"
                  style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
                  disabled={!c.pre_info_pdf_content}
                >
                  <FileText className="w-4 h-4" /> Ön Bilgi
                </button>
                <button
                  onClick={() => openContract(c.distance_sales_pdf_content, "Mesafeli Satış Sözleşmesi")}
                  className="h-11 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable"
                  style={{ background: "hsl(var(--m-accent))", color: "white" }}
                  disabled={!c.distance_sales_pdf_content}
                >
                  <Download className="w-4 h-4" /> Sözleşme
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {viewer && (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: "hsl(var(--m-bg))" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              borderColor: "hsl(var(--m-border, var(--m-text-tertiary) / 0.2))",
              paddingTop: "calc(12px + var(--m-safe-top, 0px))",
            }}
          >
            <h2 className="font-bold text-[16px]" style={{ color: "hsl(var(--m-text-primary))" }}>
              {viewer.title}
            </h2>
            <button
              onClick={() => setViewer(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
              style={{ background: "hsl(var(--m-surface-muted))" }}
              aria-label="Kapat"
            >
              <X className="w-5 h-5" style={{ color: "hsl(var(--m-text-primary))" }} />
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto px-5 py-4 text-[14px] leading-relaxed"
            style={{ color: "hsl(var(--m-text-primary))", WebkitOverflowScrolling: "touch" }}
            dangerouslySetInnerHTML={{ __html: viewer.html }}
          />
        </div>
      )}
    </div>
  );
}
