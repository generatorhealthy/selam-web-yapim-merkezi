import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CreditCard, RefreshCw } from "lucide-react";
import { paymentErrorMessage } from '@/lib/paymentError';

const LABEL: Record<string, string> = {
  initializing: "Ödeme bekleniyor", active: "Aktif", card_missing: "Kart kayıtlı değil",
  retrying: "Tekrar denenecek", failed: "Başarısız", needs_review: "Sonuç bilinmiyor – kontrol edin", cancelled: "İptal",
};

type Sub = { id: string; customer_name: string; customer_phone: string; package_name: string; monthly_amount: number;
  status: string; card_masked: string | null; paid_months: number; next_charge_at: string | null; failed_attempts: number; last_error: string | null };

const HoppaSubscriptions = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Sub[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("hoppa_subscriptions").select("*").order("created_at", { ascending: false }).limit(200);
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const act = async (id: string, action: "retry" | "cancel") => {
    if (action === "cancel" && !confirm("Abonelik iptal edilsin mi? Sonraki aylarda çekim yapılmaz.")) return;
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("hoppa-subscription", { body: { action, id } });
    setBusy(null);
    const failed = error || data?.error || data?.result === 'unavailable';
    toast({ title: failed ? "İşlem yapılamadı" : action === "cancel" ? "İptal edildi" : `Sonuç: ${data?.result}`, description: failed ? await paymentErrorMessage(data, error) : undefined, variant: failed ? "destructive" : "default" });
    void load();
  };
  return (
    <div className="container mx-auto max-w-[1800px] p-4 space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate("/divan_paneli")}><ArrowLeft className="h-4 w-4 mr-2" />Geri Dön</Button>
      <div>
        <h1 className="text-2xl font-bold text-primary">Hoppa Ödemeleri</h1>
        <p className="text-sm text-muted-foreground">Kartlı abonelikleri takip edin, başarısız çekimleri yeniden deneyin</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2"><Clock className="h-5 w-5 text-primary" /></div>
          <div><div className="font-medium">Otomatik Çekim Aktif</div><div className="text-xs text-muted-foreground">Her gün 10:00'da; başarısız çekim 3. ve 7. gün tekrar denenir</div></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2"><CreditCard className="h-5 w-5 text-primary" /></div>
          <div className="flex-1"><div className="font-medium">Manuel Kontrol</div><div className="text-xs text-muted-foreground">Listeyi yenile ve durumu kontrol et</div></div>
          <Button size="sm" disabled={loading} onClick={() => void load()}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Kontrol Et</Button>
        </CardContent></Card>
      </div>
      {rows.length === 0 && <p className="text-muted-foreground">Henüz kartlı abonelik yok.</p>}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
      {rows.map((s) => (
        <Card key={s.id} className="flex flex-col">
          <CardHeader className="p-3 pb-1 space-y-1"><CardTitle className="text-sm truncate" title={s.customer_name}>{s.customer_name}</CardTitle>
            <Badge className="w-fit text-[10px]" variant={s.status === "active" ? "default" : s.status === "failed" || s.status === "needs_review" ? "destructive" : "secondary"}>{LABEL[s.status] ?? s.status}</Badge>
          </CardHeader>
          <CardContent className="p-3 pt-1 text-xs space-y-0.5 flex-1 flex flex-col">
            <div className="truncate" title={s.package_name}>{s.package_name}</div>
            <div className="font-medium">{Number(s.monthly_amount).toLocaleString("tr-TR")} ₺/ay · {s.paid_months} ay</div>
            <div className="text-muted-foreground">{s.customer_phone}</div>
            <div className="text-muted-foreground">Kart: {s.card_masked ?? "—"}</div>
            <div className="text-muted-foreground">Sonraki: {s.next_charge_at ? new Date(s.next_charge_at).toLocaleDateString("tr-TR") : "—"} · Hata: {s.failed_attempts}</div>
            {s.last_error && <div className="text-destructive line-clamp-2" title={s.last_error}>{s.last_error}</div>}
            {s.status !== "cancelled" && (
              <div className="flex flex-wrap gap-1 pt-2 mt-auto">
                {["failed", "retrying", "card_missing"].includes(s.status) && <Button size="sm" className="h-7 px-2 text-xs" disabled={busy === s.id} onClick={() => act(s.id, "retry")}>Tekrar dene</Button>}
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={busy === s.id} onClick={() => act(s.id, "cancel")}>İptal et</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
};
export default HoppaSubscriptions;
