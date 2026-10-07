import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, CheckCircle2, ChevronRight, RefreshCw, Sparkles, XCircle, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { DECISION_LABEL, CONFIDENCE_LABEL } from "../../../supabase/functions/_shared/adDecision";
import { attributedRoas, canWarnNoSales, hasTrackedSample, type Coverage } from "../../../supabase/functions/_shared/adAttribution";

type Level = "campaign" | "adset" | "ad";
type Row = Coverage & {
  entity_id: string; entity_name: string | null; parent_id: string | null; campaign_id: string | null;
  spend: number; impressions: number; clicks: number; link_clicks: number; meta_leads: number; active_days: number;
  visits: number; leads: number; qualified: number; qualified_paid: number; registrations: number; profiles: number; checkouts: number; paid: number;
  gross_revenue: number; refund_amount: number; revenue: number;
  thumbnail_url: string | null; creative_id: string | null;
};
type Rec = { level: string; entity_id: string; decision: string; confidence: string; reason: string; decision_reason_metrics: string | null };
type Completeness = { eligible_visits: number; attributed_visits: number; eligible_leads: number; attributed_leads: number; eligible_registrations: number; attributed_registrations: number; eligible_paid: number; attributed_paid: number };
type Status = { source: string; ad_account_id: string | null; ad_account_name: string | null; last_sync_at: string | null; last_sync_status: string | null; last_error: string | null };
type Settings = { qualified_threshold: number; min_leads_for_decision: number; min_purchases_for_scale: number; min_spend_for_pause: number; min_days_active: number; target_cac: number;
  min_roas_for_scale: number; min_roas_for_keep: number; high_conf_min_paid: number; min_attribution_completeness: number };

const DECISION: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  BUYUT: { label: DECISION_LABEL.BUYUT, variant: "default" }, KORU: { label: DECISION_LABEL.KORU, variant: "secondary" },
  IZLE: { label: DECISION_LABEL.IZLE, variant: "outline" }, AZALT: { label: DECISION_LABEL.AZALT, variant: "destructive" },
  DURDUR: { label: DECISION_LABEL.DURDUR, variant: "destructive" }, YETERSIZ_VERI: { label: DECISION_LABEL.YETERSIZ_VERI, variant: "outline" },
};
const CONF: Record<string, string> = CONFIDENCE_LABEL;
const PERIODS = [
  { v: "today", l: "Bugün" }, { v: "yesterday", l: "Dün" }, { v: "7", l: "Son 7 gün" }, { v: "14", l: "Son 14 gün" }, { v: "30", l: "Son 30 gün" },
];
const LEVEL_LABEL: Record<Level, string> = { campaign: "Kampanyalar", adset: "Reklam Setleri", ad: "Reklamlar" };

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const range = (p: string) => {
  const now = new Date();
  if (p === "today") return { from: ymd(now), to: ymd(now) };
  if (p === "yesterday") { const y = new Date(Date.now() - 864e5); return { from: ymd(y), to: ymd(y) }; }
  return { from: ymd(new Date(Date.now() - (parseInt(p) - 1) * 864e5)), to: ymd(now) };
};
const div = (a: number, b: number) => (b > 0 ? a / b : null);
const tl = (n: number | null) => (n == null ? "N/A" : `₺${Math.round(n).toLocaleString("tr-TR")}`);
const pct = (n: number | null) => (n == null ? "N/A" : `%${n.toFixed(1)}`);
const x2 = (n: number | null) => (n == null ? "N/A" : `${n.toFixed(2)}x`);
const errText = async (e: unknown) => (e instanceof FunctionsHttpError ? await e.context.text() : (e as Error)?.message);

const kpi = (r: Row) => ({
  ctr: div(r.clicks * 100, r.impressions), cpc: div(r.spend, r.clicks), cpl: div(r.spend, r.leads), cpql: div(r.spend, r.qualified),
  cpr: div(r.spend, r.registrations), cac: div(r.spend, r.paid), roas: attributedRoas(r.revenue, r.spend, r.paid),
  l2q: div(r.qualified * 100, r.leads), l2r: div(r.registrations * 100, r.leads), r2c: div(r.checkouts * 100, r.registrations),
  c2p: div(r.paid * 100, r.checkouts), l2p: div(r.paid * 100, r.leads), q2p: div(r.qualified_paid * 100, r.qualified),
});

const invoke = (body: Record<string, unknown>) => supabase.functions.invoke("meta-ad-intelligence", { body });

export default function AdPerformancePanel(_: { days?: number }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [period, setPeriod] = useState("30");
  const [level, setLevel] = useState<Level>("campaign");
  const [parent, setParent] = useState<{ id: string; name: string; level: Level }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: "spend", d: -1 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [test, setTest] = useState<{ ok: boolean; steps: { name: string; ok: boolean; detail?: string }[]; diagnosis?: string; error?: any } | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string }[] | null>(null);
  const [events, setEvents] = useState<{ id: string; event_name: string; status: string; meta_status: string | null; event_time: string | null;
    http_status: number | null; events_received: number | null; fbtrace_id: string | null; attempts: number; last_error: string | null }[]>([]);
  const [debug, setDebug] = useState<any[]>([]);
  const [model, setModel] = useState<"last" | "first">("last");

  const { from, to } = range(period);
  const connected = status && status.source !== "none" && status.last_sync_status === "ok";

  const loadStatus = async () => {
    const [{ data }, s, ev, dbg] = await Promise.all([
      invoke({ action: "status" }),
      supabase.from("ad_intel_settings" as any).select("*").eq("id", 1).maybeSingle(),
      supabase.from("meta_capi_events" as any).select("id,event_name,status,meta_status,event_time,http_status,events_received,fbtrace_id,attempts,last_error")
        .eq("is_test", false).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("created_at", { ascending: false }).limit(200),
      supabase.rpc("get_attribution_debug" as any),
    ]);
    setStatus(data as Status); setSettings(s.data as any); setEvents((ev.data as any) || []); setDebug((dbg.data as any) || []);
  };
  const loadRows = async () => {
    setLoading(true);
    const p = parent[parent.length - 1];
    const [{ data, error }, r, coverage] = await Promise.all([
      supabase.rpc("get_ad_performance" as any, { p_from: from, p_to: to, p_level: level, p_parent: p?.id ?? null, p_model: model }),
      supabase.from("ai_ad_recommendations" as any).select("level,entity_id,decision,confidence,reason,decision_reason_metrics,created_at").eq("level", level).order("created_at", { ascending: false }).limit(200),
      supabase.rpc("get_ad_attribution_coverage" as any, { p_from: from, p_to: to, p_level: level, p_parent: p?.id ?? null }),
    ]);
    const cmp = await supabase.rpc("get_ad_attribution_completeness" as any, { p_from: from, p_to: to });
    const c0: any = ((cmp.data as any[]) || [])[0];
    setCompleteness(c0 ? (Object.fromEntries(Object.entries(c0).map(([k, v]) => [k, Number(v)])) as Completeness) : null);
    if (error) toast.error(error.message);
    if (coverage.error) toast.error("Atıf kapsamı alınamadı; satışsız harcama uyarıları gösterilmiyor.");
    const byId = new Map<string, Coverage>(((coverage.data as any[]) || []).map((c) => [c.entity_id, {
      attribution_started_at: c.attribution_started_at, tracked_visits: Number(c.tracked_visits),
      tracked_spend: Number(c.tracked_spend), tracked_active_days: Number(c.tracked_active_days),
    }]));
    // Bihter kampanyaları ayrı projeye ait: bu panelde (tablo + toplamlar) gösterilmez. Veri silinmez.
    const hidden = await supabase.from("meta_daily_metrics" as any).select("campaign_id").ilike("campaign_name", "%bihter%").limit(1000);
    const hiddenIds = new Set<string>(((hidden.data as any[]) || []).map((h) => String(h.campaign_id)));
    const isHidden = (x: any) => /bihter/i.test(x.entity_name || "") || hiddenIds.has(String(x.campaign_id ?? "")) || (level === "campaign" && hiddenIds.has(String(x.entity_id)));
    setRows(((data as any) || []).filter((x: any) => !isHidden(x)).map((x: any) => ({ ...x, ...byId.get(x.entity_id), spend: Number(x.spend), revenue: Number(x.revenue), gross_revenue: Number(x.gross_revenue || 0), refund_amount: Number(x.refund_amount || 0),
      ...Object.fromEntries(["impressions", "clicks", "link_clicks", "meta_leads", "active_days", "visits", "leads", "qualified", "qualified_paid", "registrations", "profiles", "checkouts", "paid"].map((k) => [k, Number(x[k] || 0)])) })));
    const seen = new Set<string>();
    setRecs(((r.data as any) || []).filter((x: Rec) => (seen.has(x.entity_id) ? false : (seen.add(x.entity_id), true))));
    setLoading(false);
  };
  useEffect(() => { loadStatus(); }, []);
  useEffect(() => { loadRows(); }, [period, level, parent, model]);

  const run = async (name: string, body: Record<string, unknown>) => {
    setBusy(name);
    const { data, error } = await invoke(body);
    setBusy(null);
    if (error) { toast.error(await errText(error)); return null; }
    return data;
  };
  const doTest = async () => { const d = await run("test", { action: "test" }); if (d) setTest(d); };
  const doAccounts = async () => {
    const d = await run("acc", { action: "listAccounts" });
    if (!d) return;
    if (d.error) toast.error(d.diagnosis || d.error.message);
    setAccounts(d.accounts || []);
  };
  const pick = async (id: string) => {
    const a = accounts?.find((x) => x.id === id);
    if (await run("pick", { action: "selectAccount", accountId: id, accountName: a?.name })) { toast.success("Reklam hesabı kaydedildi"); loadStatus(); }
  };
  const doSync = async () => {
    const d = await run("sync", { action: "sync", days: 30 });
    if (!d) return;
    if (d.metricError) toast.error(d.diagnosis || d.metricError);
    else toast.success(`Meta verisi güncellendi (${d.metricRows} satır)`);
    loadStatus(); loadRows();
  };
  const doAnalyze = async () => {
    const d = await run("ai", { action: "analyze", from, to, level });
    if (!d) return;
    d.note ? toast.info(d.note) : toast.success("AI önerileri hazır");
    loadRows();
  };
  const doTestVisit = async () => {
    const { error } = await supabase.rpc("create_test_ad_visit" as any);
    error ? toast.error(error.message) : toast.success("Test ziyareti oluşturuldu (raporlara dahil edilmez)");
    loadStatus();
  };
  const saveSettings = async () => {
    if (!settings) return;
    const { error } = await supabase.from("ad_intel_settings" as any).update({ ...settings, updated_at: new Date().toISOString() }).eq("id", 1);
    error ? toast.error(error.message) : toast.success("Ayarlar kaydedildi");
  };

  const recBy = useMemo(() => new Map(recs.map((r) => [r.entity_id, r])), [recs]);
  const sorted = useMemo(() => {
    const val = (r: Row) => { const k = kpi(r) as any; return (r as any)[sort.k] ?? k[sort.k] ?? -Infinity; };
    return [...rows].sort((a, b) => ((val(a) ?? -Infinity) > (val(b) ?? -Infinity) ? 1 : -1) * sort.d);
  }, [rows, sort]);
  const tot = rows.reduce((a, r) => ({ spend: a.spend + r.spend, imp: a.imp + r.impressions, clk: a.clk + r.clicks, leads: a.leads + r.leads, q: a.q + r.qualified, reg: a.reg + r.registrations, chk: a.chk + r.checkouts, paid: a.paid + r.paid, rev: a.rev + r.revenue }),
    { spend: 0, imp: 0, clk: 0, leads: 0, q: 0, reg: 0, chk: 0, paid: 0, rev: 0 });

  const insights = useMemo(() => {
    if (!settings || !rows.length) return [];
    const avgCpl = div(tot.spend, tot.leads), avgCtr = div(tot.clk * 100, tot.imp), avgL2p = div(tot.paid * 100, tot.leads);
    const out: { tone: "bad" | "good" | "mixed"; title: string; name: string; text: string }[] = [];
    for (const r of rows) {
      const k = kpi(r), n = r.entity_name || r.entity_id;
      if (canWarnNoSales(r, settings)) out.push({ tone: "bad", title: "Yüksek harcama / satış yok", name: n, text: `Takip sonrası ${tl(Number(r.tracked_spend))} harcandı, 0 ücretli üye.` });
      if (avgCpl && k.cpl && k.cpl > avgCpl * 1.5 && r.paid >= 2) out.push({ tone: "mixed", title: "Pahalı lead / iyi satış", name: n, text: `CPL ${tl(k.cpl)} ama ${r.paid} ücretli üye.` });
      if (hasTrackedSample(r, settings) && avgCpl && k.cpl && k.cpl < avgCpl * 0.6 && r.leads >= settings.min_leads_for_decision && (k.l2p ?? 0) < (avgL2p ?? 0) * 0.5) out.push({ tone: "bad", title: "Ucuz lead / zayıf satış", name: n, text: `CPL ${tl(k.cpl)}, lead→ücretli ${pct(k.l2p)}.` });
      if (k.roas && k.roas >= 3 && r.paid >= settings.min_purchases_for_scale) out.push({ tone: "good", title: "Yüksek ROAS", name: n, text: `ROAS ${x2(k.roas)}, ${r.paid} ücretli üye.` });
      if (k.cac && k.cac <= settings.target_cac * 0.7 && r.paid >= settings.min_purchases_for_scale) out.push({ tone: "good", title: "Düşük CAC", name: n, text: `CAC ${tl(k.cac)} (hedef ${tl(settings.target_cac)}).` });
      if (k.l2q && k.l2q >= 50 && r.leads >= settings.min_leads_for_decision) out.push({ tone: "good", title: "Yüksek nitelikli oran", name: n, text: `Leadlerin ${pct(k.l2q)}'i nitelikli.` });
      if (hasTrackedSample(r, settings) && avgCtr && k.ctr && k.ctr > avgCtr * 1.3 && r.leads >= settings.min_leads_for_decision && r.paid === 0) out.push({ tone: "mixed", title: "İyi CTR / kötü dönüşüm", name: n, text: `CTR ${pct(k.ctr)} ama satış yok.` });
      if (avgCtr && k.ctr && k.ctr < avgCtr * 0.7 && r.paid >= 2) out.push({ tone: "mixed", title: "Düşük CTR / iyi dönüşüm", name: n, text: `CTR ${pct(k.ctr)}, ${r.paid} ücretli üye.` });
    }
    return out.slice(0, 12);
  }, [rows, settings]);

  const evStats = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    events.forEach((e) => { const k = e.meta_status || e.status; const s = m.get(e.event_name) || {}; s[k] = (s[k] || 0) + 1; m.set(e.event_name, s); });
    return [...m.entries()];
  }, [events]);

  const SortH = ({ k, label }: { k: string; label: string }) => (
    <th className="px-2 py-2 text-left font-medium whitespace-nowrap cursor-pointer select-none" onClick={() => setSort((s) => ({ k, d: s.k === k ? (s.d === 1 ? -1 : 1) : -1 }))}>
      <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3 opacity-50" /></span>
    </th>
  );
  const drill = (r: Row) => {
    if (level === "ad") return;
    setParent((p) => [...p, { id: r.entity_id, name: r.entity_name || r.entity_id, level }]);
    setLevel(level === "campaign" ? "adset" : "ad");
  };
  const goLevel = (l: Level) => { setParent([]); setLevel(l); };

  return (
    <div className="space-y-4">
      {/* Meta Bağlantısı */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Meta Bağlantısı</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><div className="text-xs text-muted-foreground">Bağlantı</div>
              <Badge variant={!status ? "outline" : status.source === "none" ? "outline" : connected ? "default" : "destructive"}>
                {!status ? "…" : status.source === "none" ? "DISCONNECTED" : connected ? "CONNECTED" : "ERROR"}</Badge></div>
            <div><div className="text-xs text-muted-foreground">Reklam hesabı</div><div className="text-foreground">{status?.ad_account_name || "Seçilmedi"}</div></div>
            <div><div className="text-xs text-muted-foreground">Hesap ID</div><div className="text-foreground">{status?.ad_account_id || "—"}</div></div>
            <div><div className="text-xs text-muted-foreground">Son güncelleme</div><div className="text-foreground">{status?.last_sync_at ? new Date(status.last_sync_at).toLocaleString("tr-TR") : "Hiç"}</div></div>
            <div><div className="text-xs text-muted-foreground">API durumu</div><div className="text-foreground">{status?.last_sync_status === "ok" ? "Healthy" : status?.last_sync_status === "error" ? "Error" : "—"}</div></div>
          </div>
          {status?.last_error && <p className="text-xs text-destructive">Son hata: {status.last_error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={doTest} disabled={busy === "test"}>Bağlantıyı Test Et</Button>
            <Button size="sm" variant="outline" onClick={doAccounts} disabled={busy === "acc"}>Reklam Hesaplarını Listele</Button>
            <Button size="sm" onClick={doSync} disabled={busy === "sync"}><RefreshCw className={`w-4 h-4 mr-2 ${busy === "sync" ? "animate-spin" : ""}`} />Meta Verilerini Şimdi Güncelle</Button>
          </div>
          {accounts && (accounts.length ? (
            <Select onValueChange={pick}><SelectTrigger className="max-w-md"><SelectValue placeholder="Doktorum Ol reklam hesabını seçin" /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} (•••{a.id.slice(-4)}, {a.currency})</SelectItem>)}</SelectContent></Select>
          ) : <p className="text-xs text-muted-foreground">Reklam hesabı listelenemedi — Meta bağlantısı yenilenmeli.</p>)}
          {test && (
            <div className="rounded-md border border-border p-3 space-y-1">
              {test.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2">{s.ok ? <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5" />}
                  <span className="text-foreground">{s.name}{s.detail ? <span className="text-muted-foreground"> — {s.detail}</span> : null}</span></div>
              ))}
              {test.diagnosis && <p className="text-xs text-destructive pt-1">Teşhis: {test.diagnosis}</p>}
              {test.error && <p className="text-xs text-muted-foreground">HTTP {test.error.http_status} · kod {test.error.code ?? "—"} · alt kod {test.error.subcode ?? "—"} · {test.error.type ?? "—"} · fbtrace {test.error.fbtrace_id ?? "—"}</p>}
            </div>
          )}
          {status && !connected && (
            <p className="text-xs text-muted-foreground">Meta Marketing API bağlantısını yenilemek için sohbette "Meta hesabımı bağla" yazın; güvenli Meta giriş kartı açılır. Bu ekrandaki tüm reklam işlemleri yalnızca okumadır.</p>
          )}
        </CardContent>
      </Card>

      {/* Dönem + seviye + KPI */}
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">Meta Reklamlarına Atfedilen Performans</h2>
        <p className="text-xs text-muted-foreground">Yalnızca reklam kimliğiyle eşleştirilebilen ziyaret, kayıt ve ödemeler bu bölümde Meta reklamlarına atfedilir. İzleme sistemi devreye alınmadan önceki dönüşümler reklam bazında eşleştirilemez.</p>
        <p className="text-xs text-muted-foreground">ROAS, reklam kimliğiyle eşleşmiş ilk başarılı ödemeden sonra hesaplanır. Satışsız harcama uyarıları yalnızca takip edilebilir reklamların ilk ziyaretinden sonraki tam günleri ve minimum veri eşiklerini dikkate alır.</p>
      </div>
      <Card><CardContent className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {(completeness ? [
          ["Takip kapsamı (ziyaret)", completeness.attributed_visits, completeness.eligible_visits],
          ["Atıf tamlığı · Lead", completeness.attributed_leads, completeness.eligible_leads],
          ["Atıf tamlığı · Kayıt", completeness.attributed_registrations, completeness.eligible_registrations],
          ["Atıf tamlığı · Ücretli", completeness.attributed_paid, completeness.eligible_paid],
        ] as [string, number, number][] : []).map(([l, a, e]) => (
          <div key={l}><div className="text-muted-foreground">{l}</div>
            <div className="text-sm font-semibold text-foreground">{a} / {e} <span className="text-muted-foreground font-normal">{e > 0 ? `(%${((a / e) * 100).toFixed(1)})` : "(N/A)"}</span></div></div>
        ))}
        {!completeness && <div className="text-muted-foreground col-span-4">Atıf tamlığı hesaplanamadı.</div>}
        <div className="col-span-2 md:col-span-4 text-muted-foreground">Kapsam = geçerli reklam kimliği taşıyan kayıtlar / dönemdeki tüm kayıtlar. Dönüşüm oranı değildir. Kısmi iade tutarı sistemde tutulmadığı için iade yalnızca tam iade edilen siparişlerden hesaplanır.</div>
      </CardContent></Card>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{PERIODS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent></Select>
        {(["campaign", "adset", "ad"] as Level[]).map((l) => (
          <Button key={l} size="sm" variant={level === l ? "default" : "outline"} onClick={() => goLevel(l)}>{LEVEL_LABEL[l]}</Button>
        ))}
        <Select value={model} onValueChange={(v) => setModel(v as "last" | "first")}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="last">Atıf: Son ücretli temas</SelectItem><SelectItem value="first">Atıf: İlk temas</SelectItem></SelectContent></Select>
        <Button size="sm" variant="secondary" onClick={doAnalyze} disabled={busy === "ai" || !rows.length}>
          <Sparkles className={`w-4 h-4 mr-2 ${busy === "ai" ? "animate-pulse" : ""}`} />AI önerisi al ({LEVEL_LABEL[level]})
        </Button>
      </div>
      {parent.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <button className="underline" onClick={() => goLevel("campaign")}>Tüm kampanyalar</button>
          {parent.map((p, i) => (<span key={p.id} className="inline-flex items-center gap-1"><ChevronRight className="w-3 h-3" />
            <button className="underline" onClick={() => { setParent(parent.slice(0, i + 1)); setLevel(p.level === "campaign" ? "adset" : "ad"); }}>{p.name}</button></span>))}
        </div>
      )}

      {!rows.length && !loading ? (
        <Card><CardContent className="p-4 text-sm text-muted-foreground">
          {connected ? "Bu dönemde reklam harcaması yok." : "Meta reklam hesabı bağlı değil. Reklam harcaması verisi alınamıyor; CAC ve ROAS hesaplanamaz (N/A)."}
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[["Harcama", tl(tot.spend)], ["CPL", tl(div(tot.spend, tot.leads))], ["CPQL", tl(div(tot.spend, tot.q))], ["CAC", tl(div(tot.spend, tot.paid))], ["Gelir", tl(tot.rev)], ["ROAS", x2(attributedRoas(tot.rev, tot.spend, tot.paid))],
              ["Lead→Nitelikli", pct(div(tot.q * 100, tot.leads))], ["Lead→Kayıt", pct(div(tot.reg * 100, tot.leads))], ["Kayıt→Ödeme ekranı", pct(div(tot.chk * 100, tot.reg))], ["Ödeme ekranı→Ücretli", pct(div(tot.paid * 100, tot.chk))], ["Lead→Ücretli", pct(div(tot.paid * 100, tot.leads))], ["Kayıt başı", tl(div(tot.spend, tot.reg))]]
              .map(([k, v]) => (<Card key={k}><CardContent className="p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-lg font-semibold text-foreground">{v}</div></CardContent></Card>))}
          </div>

          {insights.length > 0 && (
            <div className="grid md:grid-cols-3 gap-3">
              {insights.map((i, n) => (
                <Card key={n} className={i.tone === "bad" ? "border-destructive/50 bg-destructive/5" : i.tone === "good" ? "border-primary/30 bg-primary/5" : "border-border"}>
                  <CardContent className="p-3"><div className="text-xs font-semibold text-foreground">{i.title}</div><div className="text-sm text-foreground truncate">{i.name}</div><div className="text-xs text-muted-foreground">{i.text}</div></CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground"><tr>
                <th className="px-2 py-2 text-left font-medium">Ad</th>
                <SortH k="spend" label="Harcama" /><SortH k="impressions" label="Gösterim" /><SortH k="ctr" label="CTR" /><SortH k="cpc" label="CPC" />
                <SortH k="leads" label="Lead" /><SortH k="cpl" label="CPL" /><SortH k="qualified" label="Nitelikli" /><SortH k="cpql" label="CPQL" />
                <SortH k="registrations" label="Kayıt" /><SortH k="checkouts" label="Ödeme ekr." /><SortH k="paid" label="Ücretli" /><SortH k="revenue" label="Net ciro" /><th className="px-2 py-2 text-left font-medium">Brüt / İade</th>
                <SortH k="cac" label="CAC" /><SortH k="roas" label="Net ROAS" /><SortH k="l2p" label="Lead→Ücretli" /><SortH k="q2p" label="Nitelikli→Ücretli" />
                <th className="px-2 py-2 text-left font-medium">AI</th><th className="px-2 py-2 text-left font-medium">Güven</th>
              </tr></thead>
              <tbody>
                {sorted.map((r) => { const k = kpi(r); const savedRec = recBy.get(r.entity_id);
                  const rec = savedRec; // karar sunucuda kural tabanlı hesaplanır, burada değiştirilmez
                  return (
                  <tr key={r.entity_id} className="border-t border-border align-top">
                    <td className="px-2 py-2 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        {r.thumbnail_url && <img src={r.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />}
                        <button className={`text-left text-foreground ${level !== "ad" ? "underline" : ""}`} onClick={() => drill(r)}>{r.entity_name || r.entity_id}</button>
                      </div>
                      {rec?.decision_reason_metrics && <div className="text-foreground mt-1 max-w-xs font-medium">{rec.decision_reason_metrics}</div>}
                      {rec && rec.reason !== rec.decision_reason_metrics && <div className="text-muted-foreground mt-1 max-w-xs">{rec.reason}</div>}
                      <div className="text-muted-foreground mt-1">Huni: {r.visits} ziyaret → {r.leads} lead → {r.qualified} nitelikli → {r.registrations} kayıt → {r.profiles} profil → {r.checkouts} ödeme ekr. → {r.paid} ücretli</div>
                    </td>
                    <td className="px-2 py-2">{tl(r.spend)}</td><td className="px-2 py-2">{r.impressions.toLocaleString("tr-TR")}</td><td className="px-2 py-2">{pct(k.ctr)}</td><td className="px-2 py-2">{tl(k.cpc)}</td>
                    <td className="px-2 py-2">{r.leads}</td><td className="px-2 py-2">{tl(k.cpl)}</td><td className="px-2 py-2">{r.qualified}</td><td className="px-2 py-2">{tl(k.cpql)}</td>
                    <td className="px-2 py-2">{r.registrations}</td><td className="px-2 py-2">{r.checkouts}</td><td className="px-2 py-2">{r.paid}</td><td className="px-2 py-2">{tl(r.revenue)}</td><td className="px-2 py-2">{tl(r.gross_revenue)} / {tl(r.refund_amount)}</td>
                    <td className="px-2 py-2">{tl(k.cac)}</td><td className="px-2 py-2">{x2(k.roas)}</td><td className="px-2 py-2">{pct(k.l2p)}</td><td className="px-2 py-2">{pct(k.q2p)}</td>
                    <td className="px-2 py-2">{rec ? <Badge variant={DECISION[rec.decision]?.variant || "outline"}>{DECISION[rec.decision]?.label || rec.decision}</Badge> : "—"}</td>
                    <td className="px-2 py-2">{rec ? CONF[rec.confidence] || rec.confidence : "—"}</td>
                  </tr>); })}
              </tbody>
            </table>
          </CardContent></Card>
        </>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Meta Events */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Meta CAPI Durumu (gerçek olaylar, son 7 gün)</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {evStats.map(([name, s]) => (
              <div key={name} className="flex justify-between gap-2"><span className="text-foreground">{name}</span>
                <span className="text-muted-foreground">{s.META_ACCEPTED || 0} kabul · {s.META_RESPONSE_UNVERIFIED || 0} doğrulanamadı · {s.META_REJECTED || 0} red · {s.pending || 0} bekliyor</span></div>
            ))}
            {!events.length && <p className="text-muted-foreground">Son 7 günde gerçek olay yok.</p>}
            <div className="max-h-64 overflow-auto border-t border-border pt-2 space-y-1">
              {events.map((e) => (
                <div key={e.id} className="text-xs flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                  <Badge variant={e.meta_status === "META_ACCEPTED" ? "default" : e.meta_status === "META_REJECTED" ? "destructive" : "secondary"}>
                    {e.meta_status || "BEKLİYOR"}</Badge>
                  <span className="text-foreground">{e.event_name}</span>
                  <span className="text-muted-foreground">{e.event_time ? new Date(e.event_time).toLocaleString("tr-TR") : "—"}</span>
                  <span className="text-muted-foreground">HTTP {e.http_status ?? "—"} · alınan {e.events_received ?? "—"} · deneme {e.attempts}</span>
                  {e.fbtrace_id && <span className="text-muted-foreground font-mono">{e.fbtrace_id}</span>}
                  {e.last_error && <span className="text-destructive">{e.last_error}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ayarlar */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">AI Karar Ayarları</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs">
            {settings && ([
              ["qualified_threshold", "Nitelikli lead puan eşiği"], ["target_cac", "Hedef CAC (₺)"], ["min_leads_for_decision", "Karar için min. lead"],
              ["min_purchases_for_scale", "Büyütme için min. satış"], ["min_spend_for_pause", "Durdurma için min. harcama (₺)"], ["min_days_active", "Min. aktif gün"], ["min_roas_for_scale", "Büyütme için min. net ROAS"], ["min_roas_for_keep", "Koruma için min. net ROAS"], ["high_conf_min_paid", "Yüksek güven için min. ücretli"], ["min_attribution_completeness", "Min. atıf tamlığı (%)"],
            ] as [keyof Settings, string][]).map(([k, l]) => (
              <label key={k} className="space-y-1"><span className="text-muted-foreground">{l}</span>
                <Input type="number" value={settings[k] as any} onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) })} /></label>
            ))}
            <Button size="sm" className="col-span-2" onClick={saveSettings}>Ayarları Kaydet</Button>
          </CardContent>
        </Card>
      </div>

      {/* Attribution Debugger */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-base">Attribution Debugger (son 20 reklam ziyareti)</CardTitle>
          <Button size="sm" variant="outline" onClick={doTestVisit}><FlaskConical className="w-4 h-4 mr-2" />Test Reklam Ziyareti Oluştur</Button></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground"><tr>{["Zaman", "İlk kaynak", "Son kaynak", "Kampanya ID", "Set ID", "Reklam ID", "Kampanya", "Reklam", "fbclid", "fbc", "fbp", "Kullanıcı", "Kayıt", "Ödeme ekr.", "Ödeme", "Tutar", ""].map((h) => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {!debug.length && <tr><td colSpan={17} className="px-2 py-3 text-muted-foreground">Henüz reklam parametreli ziyaret yok.</td></tr>}
              {debug.map((d, i) => { const t = (v?: string) => (v ? new Date(v).toLocaleString("tr-TR") : "—"); return (
                <tr key={i} className="border-t border-border">
                  <td className="px-2 py-1 whitespace-nowrap">{t(d.visit_at)}</td>
                  <td className="px-2 py-1">{d.first_source || "—"}</td><td className="px-2 py-1">{d.last_source || "—"}</td>
                  <td className="px-2 py-1">{d.campaign_id || "—"}</td><td className="px-2 py-1">{d.adset_id || "—"}</td><td className="px-2 py-1">{d.ad_id || "—"}</td>
                  <td className="px-2 py-1">{d.campaign_name || "—"}</td><td className="px-2 py-1">{d.ad_name || "—"}</td>
                  {[d.has_fbclid, d.has_fbc, d.has_fbp, d.user_linked].map((v: boolean, j: number) => <td key={j} className="px-2 py-1">{v ? "✓" : "—"}</td>)}
                  <td className="px-2 py-1 whitespace-nowrap">{t(d.registered_at)}</td><td className="px-2 py-1 whitespace-nowrap">{t(d.checkout_at)}</td><td className="px-2 py-1 whitespace-nowrap">{t(d.paid_at)}</td>
                  <td className="px-2 py-1">{d.paid_amount != null ? tl(Number(d.paid_amount)) : "—"}</td>
                  <td className="px-2 py-1">{d.is_test && <Badge variant="outline">TEST</Badge>}</td>
                </tr>); })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground break-all">
        Meta reklam URL parametreleri: utm_source=meta&utm_medium=paid&utm_campaign={"{{campaign.name}}"}&utm_content={"{{ad.name}}"}&meta_campaign_id={"{{campaign.id}}"}&meta_adset_id={"{{adset.id}}"}&meta_ad_id={"{{ad.id}}"}
      </p>
    </div>
  );
}
