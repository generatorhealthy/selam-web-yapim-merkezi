import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const LABEL: Record<string, string> = {
  initializing: "Ödeme bekleniyor", active: "Aktif", card_missing: "Kart kayıtlı değil",
  retrying: "Tekrar denenecek", failed: "Başarısız", needs_review: "Sonuç bilinmiyor – kontrol edin", cancelled: "İptal",
};

type Sub = { id: string; customer_name: string; customer_phone: string; package_name: string; monthly_amount: number;
  status: string; card_masked: string | null; paid_months: number; next_charge_at: string | null; failed_attempts: number; last_error: string | null };

const HoppaSubscriptions = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Sub[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    const { data } = await (supabase as any).from("hoppa_subscriptions").select("*").order("created_at", { ascending: false }).limit(200);
    setRows(data ?? []);
  };
  useEffect(() => { void load(); }, []);
  const act = async (id: string, action: "retry" | "cancel") => {
    if (action === "cancel" && !confirm("Abonelik iptal edilsin mi? Sonraki aylarda çekim yapılmaz.")) return;
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("hoppa-subscription", { body: { action, id } });
    setBusy(null);
    toast({ title: error || data?.error ? "İşlem yapılamadı" : action === "cancel" ? "İptal edildi" : `Sonuç: ${data?.result}`, description: data?.error, variant: error || data?.error ? "destructive" : "default" });
    void load();
  };
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Kartlı Abonelikler</h1>
      {rows.length === 0 && <p className="text-muted-foreground">Henüz kartlı abonelik yok.</p>}
      {rows.map((s) => (
        <Card key={s.id}>
          <CardHeader className="pb-2"><CardTitle className="text-base flex flex-wrap items-center gap-2">
            {s.customer_name} <Badge variant={s.status === "active" ? "default" : s.status === "failed" || s.status === "needs_review" ? "destructive" : "secondary"}>{LABEL[s.status] ?? s.status}</Badge>
          </CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>{s.package_name} · {Number(s.monthly_amount).toLocaleString("tr-TR")} ₺/ay · {s.paid_months} ay ödendi</div>
            <div>Tel: {s.customer_phone} · Kart: {s.card_masked ?? "—"}</div>
            <div>Sonraki çekim: {s.next_charge_at ? new Date(s.next_charge_at).toLocaleDateString("tr-TR") : "—"} · Başarısız deneme: {s.failed_attempts}</div>
            {s.last_error && <div className="text-destructive">{s.last_error}</div>}
            {s.status !== "cancelled" && (
              <div className="flex gap-2 pt-2">
                {["failed", "retrying", "card_missing"].includes(s.status) && <Button size="sm" disabled={busy === s.id} onClick={() => act(s.id, "retry")}>Tekrar dene</Button>}
                <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => act(s.id, "cancel")}>Aboneliği iptal et</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
export default HoppaSubscriptions;
