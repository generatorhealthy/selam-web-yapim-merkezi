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
const STATUS: Record<string, string> = { initializing: "Ödeme bekleniyor", paid: "Ödendi", completed: "12 ödeme tamamlandı", failed: "Başarısız", cancelled: "İptal" };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("tr-TR") : "—");

const GarantiPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [ctrlAmount, setCtrlAmount] = useState("1");
  const [ctrlUser, setCtrlUser] = useState<"PROVAUT" | "PROVOOS">("PROVAUT");
  const [controls, setControls] = useState<any[]>([]);
  const db = supabase as any;
  const load = async () => {
    const [s, a, t, c] = await Promise.all([
      db.from("garanti_settings").select("*").maybeSingle(),
      db.from("garanti_subscriptions").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("garanti_transactions").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("garanti_control_payments").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setSettings(s.data); setSubs(a.data ?? []); setTxns(t.data ?? []); setControls(c.data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const save = async (patch: Record<string, unknown>) => {
    if (patch.enabled === true && !confirm("Garanti BBVA gerçek müşterilere açılsın mı? Kontrollü test ödemesi tamamlanmadıysa açmayın.")) return;
    const { data, error } = await supabase.functions.invoke("garanti-payment", { body: { action: "settings", ...patch } });
    toast({ title: error || data?.error ? "Kaydedilemedi" : "Kaydedildi", variant: error || data?.error ? "destructive" : "default" });
    void load();
  };
  const call = async (body: Record<string, unknown>, okTitle: string) => {
    const { data, error } = await supabase.functions.invoke("garanti-payment", { body });
    const failed = error || data?.error;
    toast({ title: failed ? "İşlem yapılamadı" : okTitle, description: failed ? String(data?.error ?? "Bağlantı hatası") : data?.summary ? `Kod: ${data.summary.returnCode ?? "—"} · Durum: ${data.summary.status ?? "—"}${data.sales !== undefined ? ` · Bankada onaylı tahsilat: ${data.sales}` : ""}` : undefined, variant: failed ? "destructive" : "default" });
    void load();
    return data;
  };
  const startControl = async () => {
    const amount = Number(ctrlAmount);
    if (!(amount >= 1 && amount <= 10)) { toast({ title: "Tutar 1–10 TL arasında olmalı", variant: "destructive" }); return; }
    if (!confirm(`GERÇEK ${amount} TL tek seferlik kontrol tahsilatı yapılacak (${ctrlUser}). Abonelik veya 12 aylık talimat oluşmaz. Onaylıyor musunuz?`)) return;
    const { data, error } = await supabase.functions.invoke("garanti-payment", { body: { action: "start_control", amount, provUser: ctrlUser, confirm: true } });
    if (error || !data?.action) { toast({ title: "Başlatılamadı", description: data?.error, variant: "destructive" }); return; }
    const f = document.createElement("form");
    f.method = "POST"; f.action = data.action;
    Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => { const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; f.appendChild(i); });
    document.body.appendChild(f); f.submit();
  };
  const refund = (kind: "subscription" | "control", id: string, max: number) => {
    const v = prompt(`İade tutarı (TL, en çok ${max}):`, String(max));
    const amount = Number(v?.replace(",", "."));
    if (!v || !(amount > 0)) return;
    if (!confirm(`GERÇEK ${amount} TL iade bankaya gönderilecek. Onaylıyor musunuz?`)) return;
    void call({ action: "refund", kind, id, amount, confirm: true }, "İade bankada onaylandı");
  };
  const cancelRecurring = (id: string, stage: "requested" | "confirmed") => {
    const note = prompt(stage === "requested" ? "Banka panelinde talimat iptali başlatıldı. Not (kim/ne zaman):" : "Bankada iptalin tamamlandığını gördünüz mü? Doğrulama notu:");
    if (!note || note.trim().length < 3) return;
    void call({ action: "recurring_cancel", id, stage, note: note.trim() }, stage === "requested" ? "İptal bankada bekliyor olarak işaretlendi" : "Talimat iptali doğrulandı");
  };
  const RSTATUS: Record<string, string> = { none: "Yok", requested: "Bankaya iletildi", cancel_pending_bank: "İptal bankada bekliyor", cancelled_confirmed: "İptal doğrulandı" };

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Kontrollü canlı ödeme (yalnız yönetici)</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">Tek seferlik 3D Secure tahsilat; sipariş, abonelik veya tekrarlı talimat oluşturmaz, paket fiyatını değiştirmez. Muhasebede “kontrol işlemi” olarak ayrı tutulur.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-24" type="number" min={1} max={10} value={ctrlAmount} onChange={(e) => setCtrlAmount(e.target.value)} />
            <span>TL ·</span>
            {(["PROVAUT", "PROVOOS"] as const).map((u) => <Button key={u} size="sm" variant={ctrlUser === u ? "default" : "outline"} onClick={() => setCtrlUser(u)}>{u}</Button>)}
            <Button onClick={startControl}>Kontrol ödemesini başlat</Button>
          </div>
          {controls.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 border-t pt-2">
              <span>{new Date(c.created_at).toLocaleString("tr-TR")}</span><span>{c.bank_order_id}</span><span>{c.amount} TL · {c.prov_user}</span>
              <Badge variant={c.status === "paid" ? "default" : c.status === "failed" ? "destructive" : "outline"}>{STATUS[c.status] ?? c.status}</Badge>
              <span>Hash: {c.hash_verified ? "doğru" : "—"}</span>{c.refunded_amount > 0 && <span>İade: {c.refunded_amount} TL</span>}
              {c.error_message && <span className="text-destructive">{c.proc_return_code} {c.error_message}</span>}
              <Button size="sm" variant="outline" onClick={() => call({ action: "query", kind: "control", id: c.id }, "Banka sorgusu")}>Sorgula</Button>
              {c.status === "paid" && <Button size="sm" variant="outline" onClick={() => refund("control", c.id, Number(c.amount) - Number(c.refunded_amount))}>İade</Button>}
            </div>
          ))}
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
            <div>Talimat: {RSTATUS[s.recurring_status] ?? s.recurring_status}</div>
            {s.last_reconciled_at && <div className="text-xs text-muted-foreground">Son banka mutabakatı: {new Date(s.last_reconciled_at).toLocaleString("tr-TR")}</div>}
            {s.refunded_amount > 0 && <div>İade: {s.refunded_amount} ₺</div>}
            <div className="text-xs text-muted-foreground">Ref: {s.bank_order_id}{s.host_ref ? ` · ${s.host_ref}` : ""}</div>
            {s.last_error && <div className="text-xs text-destructive">{s.last_error_code} {s.last_error}</div>}
            <div className="flex gap-1 pt-1">
              <Button size="sm" variant="outline" onClick={() => call({ action: "query", kind: "subscription", id: s.id }, "Banka sorgusu")}>Sorgula</Button>
              {["paid", "completed"].includes(s.status) && <Button size="sm" variant="outline" onClick={() => refund("subscription", s.id, Number(s.monthly_amount) - Number(s.refunded_amount))}>İade</Button>}
              {s.recurring_status === "requested" && <Button size="sm" variant="outline" onClick={() => cancelRecurring(s.id, "requested")}>Talimat iptali başlat</Button>}
              {s.recurring_status === "cancel_pending_bank" && <Button size="sm" variant="outline" onClick={() => cancelRecurring(s.id, "confirmed")}>Bankada iptali doğrula</Button>}
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
