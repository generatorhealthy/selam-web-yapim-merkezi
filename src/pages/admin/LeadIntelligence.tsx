import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdPerformancePanel from "@/components/admin/AdPerformancePanel";

type Lead = {
  user_id: string; name: string | null; email: string | null; phone: string | null; created_at: string;
  specialty: string | null; city: string | null; score: number; professional: number; capacity: number; intent: number;
  lead_class: string; stage: string; paid: boolean; revenue: number; signals: string[];
  utm_source: string | null; utm_campaign: string | null; utm_content: string | null;
  meta_campaign_id: string | null; meta_adset_id: string | null; meta_ad_id: string | null;
};
type Rule = { id: string; rule_key: string; rule_name: string; category: string; points: number; enabled: boolean; description: string | null };

const CLASS_STYLE: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-secondary text-secondary-foreground",
  HIGH: "bg-primary/15 text-primary",
  HOT: "bg-destructive/15 text-destructive",
  CONVERTED: "bg-primary text-primary-foreground",
};
const CLASS_TR: Record<string, string> = { LOW: "Düşük", MEDIUM: "Orta", HIGH: "Yüksek", HOT: "Sıcak", CONVERTED: "Dönüştü" };
const STAGES = ["NEW_LEAD","ENGAGED","QUALIFIED_LEAD","REGISTRATION_STARTED","REGISTERED","PROFILE_COMPLETED","CHECKOUT_STARTED","PAYMENT_ATTEMPTED","PAID_SUBSCRIBER","LOST","CANCELLED"];
const STAGE_TR: Record<string, string> = {
  NEW_LEAD: "Yeni", ENGAGED: "İlgili", QUALIFIED_LEAD: "Nitelikli", REGISTRATION_STARTED: "Kayıt Başladı", REGISTERED: "Kayıtlı",
  PROFILE_COMPLETED: "Profil Tamam", CHECKOUT_STARTED: "Ödeme Sayfasında", PAYMENT_ATTEMPTED: "Ödeme Denedi",
  PAID_SUBSCRIBER: "Ücretli Üye", LOST: "Kayıp", CANCELLED: "İptal",
};
const EVENT_TR: Record<string, string> = {
  landing_page_view: "Kayıt sayfası görüntüleme", pricing_page_view: "Fiyat sayfası görüntüleme", registration_started: "Kayıt başlatıldı",
  capacity_entered: "Kapasite girildi", registration_completed: "Kayıt tamamlandı", profile_completed: "Profil tamamlandı",
  checkout_started: "Ödeme başlatıldı", payment_failed: "Ödeme başarısız", payment_completed: "Ödeme tamamlandı",
};
const CAT_TR: Record<string, string> = { professional: "Profesyonel Hazırlık", capacity: "İş Kapasitesi", intent: "Satın Alma Niyeti" };
const fmtTL = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} ₺`;
const pct = (a: number, b: number) => (b ? `%${((a / b) * 100).toFixed(1)}` : "—");

const LeadIntelligence = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState("30");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [timeline, setTimeline] = useState<{ event_name: string; created_at: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, r] = await Promise.all([
      supabase.rpc("get_lead_intelligence" as any, { p_days: parseInt(days) }),
      supabase.from("scoring_rules" as any).select("*").order("category").order("points", { ascending: false }),
    ]);
    if (error) toast.error("Veriler alınamadı");
    setLeads((data as any) || []);
    setRules(((r as any).data as Rule[]) || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [days]);

  const openLead = async (l: Lead) => {
    setSelected(l);
    setTimeline([]);
    const { data } = await supabase.from("analytics_events" as any).select("event_name, created_at")
      .eq("user_id", l.user_id).order("created_at").limit(200);
    setTimeline((data as any) || []);
  };

  const setStage = async (l: Lead, stage: string) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("lead_pipeline" as any).upsert({ user_id: l.user_id, stage, manual: true, updated_at: new Date().toISOString() });
    await supabase.from("lead_stage_history" as any).insert({ user_id: l.user_id, previous_stage: l.stage, new_stage: stage, changed_by: u.user?.id, change_source: "ADMIN" });
    toast.success("Aşama güncellendi");
    setSelected({ ...l, stage });
    setLeads((ls) => ls.map((x) => (x.user_id === l.user_id ? { ...x, stage } : x)));
  };

  const updateRule = async (rule: Rule, patch: Partial<Rule>) => {
    setRules((rs) => rs.map((x) => (x.id === rule.id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("scoring_rules" as any).update({ ...patch, updated_at: new Date().toISOString() }).eq("id", rule.id);
    if (error) toast.error("Kural kaydedilemedi"); else toast.success("Kural kaydedildi");
  };

  const stats = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => l.lead_class === "HIGH" || l.lead_class === "HOT" || l.paid).length;
    const registered = leads.filter((l) => l.signals?.includes("registration_completed")).length;
    const profile = leads.filter((l) => l.signals?.includes("profile_completed")).length;
    const checkout = leads.filter((l) => l.signals?.includes("checkout_started") || l.paid).length;
    const paid = leads.filter((l) => l.paid).length;
    const revenue = leads.reduce((s, l) => s + Number(l.revenue || 0), 0);
    return { total, qualified, registered, profile, checkout, paid, revenue };
  }, [leads]);

  const bySource = useMemo(() => {
    const m = new Map<string, { leads: number; qualified: number; paid: number; revenue: number }>();
    leads.forEach((l) => {
      const key = l.utm_campaign || l.meta_campaign_id || (l.utm_source ? `(${l.utm_source})` : "Kaynak bilinmiyor");
      const v = m.get(key) || { leads: 0, qualified: 0, paid: 0, revenue: 0 };
      v.leads++; if (["HIGH","HOT","CONVERTED"].includes(l.lead_class)) v.qualified++;
      if (l.paid) { v.paid++; v.revenue += Number(l.revenue || 0); }
      m.set(key, v);
    });
    return [...m.entries()].sort((a, b) => b[1].paid - a[1].paid || b[1].leads - a[1].leads);
  }, [leads]);

  const funnel = [
    ["Kayıt başlatan", stats.total], ["Nitelikli", stats.qualified], ["Kayıt tamamlayan", stats.registered],
    ["Profil tamamlayan", stats.profile], ["Ödeme sayfasına geçen", stats.checkout], ["Ücretli üye", stats.paid],
  ] as const;

  const shown = leads.filter((l) => classFilter === "all" || l.lead_class === classFilter);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/divan_paneli/dashboard")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AI Reklam Merkezi</h1>
            <p className="text-sm text-muted-foreground">Reklamdan gelen uzmanların ticari uygunluğu ve ücretli üyeliğe dönüşümü</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{["7","14","30","90"].map((d) => <SelectItem key={d} value={d}>Son {d} gün</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[["Lead", stats.total], ["Nitelikli", stats.qualified], ["Kayıt", stats.registered], ["Profil", stats.profile],
          ["Ödeme Başlatan", stats.checkout], ["Ücretli Üye", stats.paid], ["Gelir", fmtTL(stats.revenue)]].map(([k, v]) => (
          <Card key={k as string}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="text-xl font-semibold text-foreground">{loading ? <span className="inline-block h-6 w-12 rounded bg-muted animate-pulse" /> : v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="ads">Reklam Performansı & AI</TabsTrigger>
          <TabsTrigger value="funnel">Huni & Kaynak</TabsTrigger>
          <TabsTrigger value="leads">Leadler</TabsTrigger>
          <TabsTrigger value="rules">Puan Kuralları</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Dönüşüm Hunisi</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {funnel.map(([label, n], i) => {
                const prev = i ? funnel[i - 1][1] : n;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm"><span className="text-foreground">{label}</span>
                      <span className="text-muted-foreground">{n} {i > 0 && `· ${pct(n, prev)}`}</span></div>
                    <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: stats.total ? `${(n / stats.total) * 100}%` : 0 }} /></div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Kampanya Bazında Gerçek Sonuç</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="py-1">Kampanya</th><th>Lead</th><th>Nitelikli</th><th>Ücretli</th><th>Gelir</th><th>Satın alma</th></tr></thead>
                <tbody>{bySource.map(([k, v]) => (
                  <tr key={k} className="border-t border-border">
                    <td className="py-1 max-w-[180px] truncate text-foreground">{k}</td><td>{v.leads}</td><td>{v.qualified}</td>
                    <td>{v.paid}</td><td>{fmtTL(v.revenue)}</td>
                    <td>{v.leads < 10 ? <span className="text-muted-foreground">Yetersiz veri</span> : pct(v.paid, v.leads)}</td>
                  </tr>))}</tbody>
              </table></div>
              <p className="mt-3 text-xs text-muted-foreground">Harcama, CPL, CAC ve ROAS, Meta reklam verisi bağlandığında burada görünecek. Kaynak bilgisi bu sürümün yayınından sonra gelen kişiler için toplanır.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card><CardContent className="p-4 space-y-3">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tüm sınıflar</SelectItem>
                {Object.keys(CLASS_TR).map((c) => <SelectItem key={c} value={c}>{CLASS_TR[c]}</SelectItem>)}</SelectContent>
            </Select>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-2">Uzman</th><th>Puan</th><th>Sınıf</th><th>Aşama</th><th>Kampanya</th><th>Kayıt</th></tr></thead>
              <tbody>{shown.map((l) => (
                <tr key={l.user_id} className="border-t border-border cursor-pointer hover:bg-muted/50" onClick={() => openLead(l)}>
                  <td className="py-2"><div className="text-foreground">{l.name || l.email}</div><div className="text-xs text-muted-foreground">{l.specialty || "—"} · {l.city || "—"}</div></td>
                  <td className="font-semibold text-foreground">{l.score}</td>
                  <td><Badge className={CLASS_STYLE[l.lead_class]}>{CLASS_TR[l.lead_class]}</Badge></td>
                  <td className="text-muted-foreground">{STAGE_TR[l.stage] || l.stage}</td>
                  <td className="max-w-[160px] truncate text-muted-foreground">{l.utm_campaign || l.utm_source || "—"}</td>
                  <td className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString("tr-TR")}</td>
                </tr>))}</tbody>
            </table></div>
            {!loading && shown.length === 0 && <p className="text-sm text-muted-foreground">Bu aralıkta kayıt yok.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card><CardContent className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">Puan yalnızca Doktorum Ol üyeliğine uygunluğu ölçer; mesleki kalite veya kişisel gelir değerlendirmez. Toplam puan, açık kuralların toplamına göre 100 üzerinden hesaplanır.</p>
            {["professional","capacity","intent"].map((cat) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-foreground mb-2">{CAT_TR[cat]}</h3>
                {rules.filter((r) => r.category === cat).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-1.5 border-t border-border">
                    <Switch checked={r.enabled} onCheckedChange={(v) => updateRule(r, { enabled: v })} />
                    <div className="flex-1"><div className="text-sm text-foreground">{r.rule_name}</div><div className="text-xs text-muted-foreground">{r.description}</div></div>
                    <Input type="number" className="w-20" defaultValue={r.points}
                      onBlur={(e) => { const v = parseInt(e.target.value) || 0; if (v !== r.points) updateRule(r, { points: v }); }} />
                  </div>))}
              </div>))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="ads">
          <AdPerformancePanel days={parseInt(days)} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (<>
            <DialogHeader><DialogTitle>{selected.name || selected.email}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">E-posta:</span> {selected.email}</div>
              <div><span className="text-muted-foreground">Telefon:</span> {selected.phone || "—"}</div>
              <div><span className="text-muted-foreground">Uzmanlık:</span> {selected.specialty || "—"}</div>
              <div><span className="text-muted-foreground">Şehir:</span> {selected.city || "—"}</div>
              <div><span className="text-muted-foreground">Ödeme:</span> {selected.paid ? fmtTL(selected.revenue) : "Yok"}</div>
              <div><span className="text-muted-foreground">Kaynak:</span> {selected.utm_source || "—"} / {selected.utm_campaign || "—"}</div>
              <div><span className="text-muted-foreground">Reklam:</span> {selected.utm_content || selected.meta_ad_id || "—"}</div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/15 p-3">
              <div className="text-3xl font-semibold text-foreground">{selected.score}</div>
              <Badge className={CLASS_STYLE[selected.lead_class]}>{CLASS_TR[selected.lead_class]}</Badge>
              <div className="text-xs text-muted-foreground">Hazırlık {selected.professional} · Kapasite {selected.capacity} · Niyet {selected.intent}</div>
            </div>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Aşama:</span>
              <Select value={selected.stage} onValueChange={(v) => setStage(selected, v)}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_TR[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><h4 className="text-sm font-semibold mb-1 text-foreground">Sinyaller</h4>
              <div className="flex flex-wrap gap-1">{selected.signals?.map((s) => <Badge key={s} variant="outline">{rules.find((r) => r.rule_key === s)?.rule_name || s}</Badge>)}</div></div>
            <div><h4 className="text-sm font-semibold mb-2 text-foreground">Zaman Çizelgesi</h4>
              {timeline.length === 0 ? <p className="text-xs text-muted-foreground">Kayıtlı olay yok (takip yayından sonra başlar).</p> :
                <ol className="border-l border-border ml-2 space-y-2">{timeline.map((t, i) => (
                  <li key={i} className="pl-3 relative"><span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground mr-2">{new Date(t.created_at).toLocaleString("tr-TR")}</span>
                    <span className="text-sm text-foreground">{EVENT_TR[t.event_name] || t.event_name}</span></li>))}</ol>}
            </div>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadIntelligence;
