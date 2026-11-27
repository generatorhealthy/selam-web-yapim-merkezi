import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw } from "lucide-react";

const PROVIDERS = { hoppa: "Hoppa", garanti: "Garanti BBVA", bank_transfer: "Yalnız Havale" } as const;
const PACKAGES = { expert_os: "Expert OS (5.000 TL)", expert_os_plus: "Expert OS Plus (7.500 TL)" } as const;
const STATUS: Record<string, string> = { initializing: "Ödeme bekleniyor", paid: "İlk ödeme alındı", failed: "Başarısız", cancelled: "İptal" };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("tr-TR") : "—");

const GarantiPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [testOrder, setTestOrder] = useState("");
  const db = supabase as any;
  const load = async () => {
    const [s, a, t] = await Promise.all([
      db.from("garanti_settings").select("*").maybeSingle(),
      db.from("garanti_subscriptions").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("garanti_transactions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setSettings(s.data); setSubs(a.data ?? []); setTxns(t.data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const save = async (patch: Record<string, unknown>) => {
    if (patch.enabled === true && !confirm("Garanti BBVA gerçek müşterilere açılsın mı? Kontrollü test ödemesi tamamlanmadıysa açmayın.")) return;
    const { data, error } = await supabase.functions.invoke("garanti-payment", { body: { action: "settings", ...patch } });
    toast({ title: error || data?.error ? "Kaydedilemedi" : "Kaydedildi", variant: error || data?.error ? "destructive" : "default" });
    void load();
  };
  const startTest = async () => {
    const { data, error } = await supabase.functions.invoke("garanti-payment", { body: { action: "start", orderId: testOrder.trim() } });
    if (error || !data?.action) { toast({ title: "Başlatılamadı", description: data?.error, variant: "destructive" }); return; }
    if (!confirm(`Bu GERÇEK bir ${Number(data.fields.txnamount) / 100} TL tahsilattır ve 12 aylık talimat oluşturur. Devam edilsin mi?`)) return;
    const f = document.createElement("form");
    f.method = "POST"; f.action = data.action;
    Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => { const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; f.appendChild(i); });
    document.body.appendChild(f); f.submit();
  };
  const unavailable = () => toast({ title: "Banka teyidi bekleniyor", description: "Sorgulama, iade ve talimat iptali bankanın parametreleri doğrulanınca açılacak. Şimdilik Garanti Sanal POS panelinden yapın." });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-semibold">Garanti BBVA Ödemeleri</h1>
        <Button variant="outline" size="sm" className="ml-auto" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Yenile</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ayarlar</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Switch checked={!!settings?.enabled} onCheckedChange={(v) => save({ enabled: v })} />
            <span>Garanti BBVA {settings?.enabled ? "aktif (müşterilere açık)" : "pasif (yalnız yönetici testi)"}</span>
          </div>
          {Object.entries(PACKAGES).map(([key, label]) => (
            <div key={key} className="flex flex-wrap items-center gap-2">
              <span className="w-56">{label}</span>
              {Object.entries(PROVIDERS).map(([p, pl]) => (
                <Button key={p} size="sm" variant={settings?.package_providers?.[key] === p ? "default" : "outline"}
                  onClick={() => save({ package_providers: { ...settings?.package_providers, [key]: p } })}>{pl}</Button>
              ))}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Seçim yalnız yeni satışlar için kaydedilir; ödeme sayfası Garanti’yi ancak aktivasyon onayından sonra kullanacak. Mevcut Hoppa abonelikleri taşınmaz.</p>
          <div className="flex gap-2 pt-2">
            <Input placeholder="Bekleyen sipariş ID (kontrollü test)" value={testOrder} onChange={(e) => setTestOrder(e.target.value)} />
            <Button onClick={startTest} disabled={!testOrder.trim()}>Test ödemesi başlat</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subs.map((s) => (
          <Card key={s.id}><CardContent className="p-3 text-sm space-y-1">
            <div className="flex justify-between gap-2"><b className="truncate">{s.customer_name}</b><Badge variant="outline">{STATUS[s.status] ?? s.status}</Badge></div>
            {s.is_test && <Badge variant="secondary">Test</Badge>}
            <div>{s.package_name} · {Number(s.monthly_amount).toLocaleString("tr-TR")} ₺</div>
            <div>Ödenen: {s.paid_count}/{s.total_payments} · Kalan: {s.total_payments - s.paid_count}</div>
            <div>Sonraki tahsilat (tahmini): {fmt(s.next_charge_at)}</div>
            <div>Talimat: {s.recurring_status === "requested" ? "Bankaya iletildi (teyit bekliyor)" : "Yok"}</div>
            <div className="text-xs text-muted-foreground">Ref: {s.bank_order_id}{s.host_ref ? ` · ${s.host_ref}` : ""}</div>
            {s.last_error && <div className="text-xs text-destructive">{s.last_error_code} {s.last_error}</div>}
            <div className="flex gap-1 pt-1">
              {["Sorgula", "İade", "Talimatı iptal"].map((l) => <Button key={l} size="sm" variant="outline" onClick={unavailable}>{l}</Button>)}
            </div>
          </CardContent></Card>
        ))}
        {!subs.length && <p className="text-sm text-muted-foreground">Henüz Garanti BBVA aboneliği yok.</p>}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tahsilatlar</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          {txns.map((t) => (
            <div key={t.id} className="flex flex-wrap gap-3 border-b py-1">
              <span>{new Date(t.created_at).toLocaleString("tr-TR")}</span><span>{t.bank_order_id}</span>
              <Badge variant={t.success ? "default" : "destructive"}>{t.success ? "Başarılı" : "Başarısız"}</Badge>
              <span>Kod: {t.proc_return_code ?? "—"}</span><span>Hash: {t.hash_verified ? "doğru" : "doğrulanamadı"}</span>
              {t.error_message && <span className="text-destructive">{t.error_message}</span>}
            </div>
          ))}
          {!txns.length && <p className="text-muted-foreground">Kayıt yok.</p>}
        </CardContent>
      </Card>
    </div>
  );
};
export default GarantiPayments;
