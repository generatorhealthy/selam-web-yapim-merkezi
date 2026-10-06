import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

type Row = {
  campaign_id: string; campaign_name: string | null; spend: number; impressions: number; clicks: number;
  meta_leads: number; leads: number; registrations: number; checkouts: number; paid: number; revenue: number;
};
type Rec = { campaign_id: string; campaign_name: string | null; decision: string; confidence: string; reason: string; created_at?: string };

const DECISION: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  BUYUT: { label: "BÜYÜT", variant: "default" },
  KORU: { label: "KORU", variant: "secondary" },
  IZLE: { label: "İZLE", variant: "outline" },
  AZALT: { label: "AZALT", variant: "destructive" },
  DURDUR: { label: "DURDUR", variant: "destructive" },
  YETERSIZ_VERI: { label: "YETERSİZ VERİ", variant: "outline" },
};
const CONF: Record<string, string> = { DUSUK: "Düşük güven", ORTA: "Orta güven", YUKSEK: "Yüksek güven" };

const tl = (n: number) => `₺${Math.round(n).toLocaleString("tr-TR")}`;
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

async function errText(error: unknown) {
  return error instanceof FunctionsHttpError ? await error.context.text() : (error as Error)?.message;
}

export default function AdPerformancePanel({ days }: { days: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, r] = await Promise.all([
      supabase.rpc("get_ad_performance" as any, { p_days: days }),
      supabase.from("ai_ad_recommendations" as any).select("campaign_id,campaign_name,decision,confidence,reason,created_at")
        .order("created_at", { ascending: false }).limit(60),
    ]);
    if (error) toast.error(error.message);
    setRows(((data as any) || []).map((x: any) => ({ ...x, spend: Number(x.spend), revenue: Number(x.revenue) })));
    const seen = new Set<string>();
    setRecs(((r.data as any) || []).filter((x: Rec) => (seen.has(x.campaign_id) ? false : (seen.add(x.campaign_id), true))));
    setLoading(false);
  };
  useEffect(() => { load(); }, [days]);

  const sync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("meta-ad-intelligence", { body: { action: "sync" } });
    setSyncing(false);
    if (error) return toast.error(await errText(error));
    if (data?.metricError) toast.error(`Meta: ${data.metricError}`);
    else toast.success(`Meta verisi güncellendi (${data?.metricRows ?? 0} satır, ${data?.purchasesSent ?? 0} ödeme bildirildi)`);
    load();
  };
  const analyze = async () => {
    setAnalyzing(true);
    const { data, error } = await supabase.functions.invoke("meta-ad-intelligence", { body: { action: "analyze", days } });
    setAnalyzing(false);
    if (error) return toast.error(await errText(error));
    if (data?.note) toast.info(data.note);
    else toast.success("Öneriler hazır");
    load();
  };

  const t = rows.reduce((a, r) => ({
    spend: a.spend + r.spend, leads: a.leads + Number(r.leads), reg: a.reg + Number(r.registrations),
    paid: a.paid + Number(r.paid), rev: a.rev + r.revenue,
  }), { spend: 0, leads: 0, reg: 0, paid: 0, rev: 0 });
  const recBy = new Map(recs.map((r) => [r.campaign_id, r]));
  const kpis = [
    ["Harcama", tl(t.spend)],
    ["CPL", ratio(t.spend, t.leads) != null ? tl(ratio(t.spend, t.leads)!) : "—"],
    ["Kayıt başı maliyet", ratio(t.spend, t.reg) != null ? tl(ratio(t.spend, t.reg)!) : "—"],
    ["CAC", ratio(t.spend, t.paid) != null ? tl(ratio(t.spend, t.paid)!) : "—"],
    ["Gelir", tl(t.rev)],
    ["ROAS", ratio(t.rev, t.spend) != null ? `${ratio(t.rev, t.spend)!.toFixed(2)}x` : "—"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />Meta verisini güncelle
        </Button>
        <Button size="sm" onClick={analyze} disabled={analyzing || !rows.length}>
          <Sparkles className={`w-4 h-4 mr-2 ${analyzing ? "animate-pulse" : ""}`} />AI önerisi al
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {kpis.map(([k, v]) => (
          <Card key={k}><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="text-lg font-semibold text-foreground">{v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Kampanyalar</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="h-20 rounded bg-muted animate-pulse" />}
          {!loading && !rows.length && (
            <p className="text-sm text-muted-foreground">Henüz reklam harcaması verisi yok. "Meta verisini güncelle"ye basın; sistem ayrıca her gün otomatik çeker.</p>
          )}
          {rows.map((r) => {
            const rec = recBy.get(r.campaign_id);
            const noSale = r.spend >= 1000 && Number(r.paid) === 0;
            return (
              <div key={r.campaign_id} className={`rounded-lg border p-3 ${noSale ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-foreground">{r.campaign_name || r.campaign_id}</div>
                  {rec && <Badge variant={DECISION[rec.decision]?.variant || "outline"}>{DECISION[rec.decision]?.label || rec.decision}</Badge>}
                </div>
                <div className="mt-2 grid grid-cols-3 md:grid-cols-8 gap-2 text-xs text-muted-foreground">
                  <span>Harcama <b className="text-foreground">{tl(r.spend)}</b></span>
                  <span>Tıklama <b className="text-foreground">{r.clicks}</b></span>
                  <span>Lead <b className="text-foreground">{r.leads}</b></span>
                  <span>Kayıt <b className="text-foreground">{r.registrations}</b></span>
                  <span>Ücretli <b className="text-foreground">{r.paid}</b></span>
                  <span>Gelir <b className="text-foreground">{tl(r.revenue)}</b></span>
                  <span>CAC <b className="text-foreground">{Number(r.paid) ? tl(r.spend / Number(r.paid)) : "—"}</b></span>
                  <span>ROAS <b className="text-foreground">{r.spend ? `${(r.revenue / r.spend).toFixed(2)}x` : "—"}</b></span>
                </div>
                {noSale && <p className="mt-2 text-xs text-destructive">Çok harcadı, hiç ücretli üye yok.</p>}
                {rec && <p className="mt-2 text-sm text-foreground">{rec.reason} <span className="text-xs text-muted-foreground">({CONF[rec.confidence] || rec.confidence})</span></p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Reklamdan gelenlerin doğru kampanyaya bağlanması için Meta reklam bağlantılarına şu parametreleri ekleyin:
        utm_source=facebook&utm_campaign={"{{campaign.name}}"}&meta_campaign_id={"{{campaign.id}}"}&meta_adset_id={"{{adset.id}}"}&meta_ad_id={"{{ad.id}}"}
      </p>
    </div>
  );
}
