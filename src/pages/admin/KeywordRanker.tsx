import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Download, ArrowUp, ArrowDown, Minus, Search, Sparkles, Target, MousePointerClick, Eye, Percent, Trophy, Clock, ExternalLink, Check, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { classifyPage, clickPotential, expectedCtr } from "../../../supabase/functions/_shared/seoRules";

type Snap = { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number };
type Agg = { key: string; clicks: number; impressions: number; ctr: number; position: number; pages: number; prevPosition: number | null; prevClicks: number; topPage?: string };
type Eng = { path: string; views: number; search_views: number; avg_seconds: number; median_seconds: number; bounce_rate: number };
type Sugg = { id: string; page: string; target_type: string; issue: string; severity: string; main_query: string | null; impressions: number; ctr: number; position: number; current_title: string | null; current_description: string | null; suggested_title: string | null; suggested_description: string | null; status: string; created_at: string; applied_at: string | null };

const nf = (n: number) => Math.round(n).toLocaleString("tr-TR");
const pc = (n: number) => `%${(n * 100).toFixed(1)}`;
const pathOf = (u: string) => { try { return decodeURIComponent(new URL(u).pathname); } catch { return u; } };
const segment = (u: string) => {
  const p = pathOf(u).split("/").filter(Boolean);
  if (!p.length) return "home";
  if (p[0] === "blog") return "blog";
  if (p[0] === "uzmanlik") return "local";
  if (p[0] === "uzmanlar" || p.length === 1) return "other";
  return p.length === 2 ? "specialist" : "other";
};
const SEG_TR: Record<string, string> = { all: "Tüm sayfalar", blog: "Blog yazıları", specialist: "Uzman profilleri", local: "Şehir/branş sayfaları", home: "Ana sayfa", other: "Diğer sayfalar" };
const ISSUE_TR: Record<string, string> = {
  low_ctr: "Görünüyor ama tıklanmıyor", striking_distance: "İlk sayfaya çok yakın",
  title_length: "Başlık uzunluğu uygun değil", missing_description: "Açıklama eksik/kısa",
};
const ISSUE_HELP: Record<string, string> = {
  low_ctr: "Bu sıradaki sayfalar normalde çok daha fazla tıklanır. Başlık ve açıklama aranan kelimeye daha net cevap vermeli.",
  striking_distance: "Sayfa 8–20. sıralar arasında. Başlıkta ana kelimeyi öne almak ve içeriği derinleştirmek ilk sayfaya taşıyabilir.",
  title_length: "Google 60 karakterden uzun başlıkları keser, çok kısa başlıklar da az tıklanır.",
  missing_description: "Açıklama yoksa Google rastgele bir cümle gösterir; tıklama oranı düşer.",
};

function aggregate(rows: Snap[], by: "query" | "page", prev: Map<string, { pos: number; clicks: number }>): Agg[] {
  const m = new Map<string, Agg & { posW: number; pageSet: Set<string>; topImp: number }>();
  for (const r of rows) {
    const k = by === "query" ? r.query : r.page;
    let a = m.get(k);
    if (!a) { a = { key: k, clicks: 0, impressions: 0, ctr: 0, position: 0, pages: 0, prevPosition: null, prevClicks: 0, posW: 0, pageSet: new Set(), topImp: 0 }; m.set(k, a); }
    a.clicks += r.clicks; a.impressions += r.impressions; a.posW += r.position * r.impressions;
    const other = by === "query" ? r.page : r.query;
    a.pageSet.add(other);
    if (r.impressions > a.topImp) { a.topImp = r.impressions; a.topPage = other; }
  }
  return [...m.values()].map((a) => {
    const p = prev.get(a.key);
    return { key: a.key, clicks: a.clicks, impressions: a.impressions, ctr: a.impressions ? a.clicks / a.impressions : 0,
      position: a.impressions ? a.posW / a.impressions : 0, pages: a.pageSet.size, prevPosition: p?.pos ?? null, prevClicks: p?.clicks ?? 0, topPage: a.topPage };
  });
}
function prevMap(rows: Snap[], by: "query" | "page") {
  const m = new Map<string, { imp: number; posW: number; clicks: number }>();
  for (const r of rows) {
    const k = by === "query" ? r.query : r.page;
    const a = m.get(k) ?? { imp: 0, posW: 0, clicks: 0 };
    a.imp += r.impressions; a.posW += r.position * r.impressions; a.clicks += r.clicks; m.set(k, a);
  }
  return new Map([...m].map(([k, v]) => [k, { pos: v.imp ? v.posW / v.imp : 0, clicks: v.clicks }]));
}

async function fetchAll(period: string): Promise<Snap[]> {
  const { count } = await supabase.from("seo_keyword_snapshots").select("id", { count: "exact", head: true }).eq("period", period);
  const pages = Math.ceil((count ?? 0) / 1000);
  const res = await Promise.all(Array.from({ length: pages }, (_, i) =>
    supabase.from("seo_keyword_snapshots").select("query,page,clicks,impressions,ctr,position").eq("period", period).order("id").range(i * 1000, i * 1000 + 999)));
  return res.flatMap((r) => (r.data ?? []) as Snap[]);
}

function Delta({ cur, prev, invert = false, fmt = (n: number) => nf(n) }: { cur: number; prev: number | null; invert?: boolean; fmt?: (n: number) => string }) {
  if (prev === null || prev === 0) return <span className="text-xs text-muted-foreground">yeni</span>;
  const d = cur - prev;
  const good = invert ? d < 0 : d > 0;
  if (Math.abs(d) < (invert ? 0.1 : 0.5)) return <span className="inline-flex items-center text-xs text-muted-foreground"><Minus className="h-3 w-3" /></span>;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? "text-primary" : "text-destructive"}`}>
      {good ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{fmt(Math.abs(d))}
    </span>
  );
}

function PosBadge({ p }: { p: number }) {
  const cls = p <= 3 ? "bg-primary text-primary-foreground" : p <= 10 ? "bg-primary/15 text-primary" : p <= 20 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex min-w-[2.75rem] justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>{p.toFixed(1)}</span>;
}

function exportCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = name; a.click();
}

const PAGE = 50;

export default function KeywordRanker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cur, setCur] = useState<Snap[]>([]);
  const [prev, setPrev] = useState<Snap[]>([]);
  const [eng, setEng] = useState<Eng[]>([]);
  const [sugg, setSugg] = useState<Sugg[]>([]);
  const [lastRun, setLastRun] = useState<{ status: string; finished_at: string | null; started_at: string; error: string | null } | null>(null);

  // filtreler
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("all");
  const [band, setBand] = useState("all");
  const [minImp, setMinImp] = useState("10");
  const [sort, setSort] = useState<{ k: keyof Agg; dir: 1 | -1 }>({ k: "impressions", dir: -1 });
  const [kwPage, setKwPage] = useState(0);
  const [pgPage, setPgPage] = useState(0);
  const [detail, setDetail] = useState<{ type: "query" | "page"; key: string } | null>(null);
  const [edit, setEdit] = useState<Sugg | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggFilter, setSuggFilter] = useState("pending");

  const load = async () => {
    setLoading(true);
    const [c, p, e, s, r] = await Promise.all([
      fetchAll("current"), fetchAll("previous"),
      supabase.rpc("get_seo_page_engagement", { _days: 28 }),
      supabase.from("seo_suggestions").select("*").order("impressions", { ascending: false }).limit(500),
      supabase.from("seo_sync_runs").select("status,finished_at,started_at,error").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setCur(c); setPrev(p); setEng((e.data ?? []) as Eng[]); setSugg((s.data ?? []) as Sugg[]); setLastRun(r.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const runSync = async () => {
    setSyncing(true);
    toast.info("Google verileri çekiliyor, bu 1–2 dakika sürebilir…");
    const { data, error } = await supabase.functions.invoke("seo-rank-sync", { body: { action: "sync" } });
    setSyncing(false);
    if (error || data?.error) { toast.error(data?.error || "Yenileme başarısız oldu"); return; }
    toast.success(`${nf(data.rows)} satır güncellendi, ${data.suggestions} yeni öneri`);
    load();
  };

  const prevQ = useMemo(() => prevMap(prev, "query"), [prev]);
  const prevP = useMemo(() => prevMap(prev, "page"), [prev]);
  const segRows = useMemo(() => (seg === "all" ? cur : cur.filter((r) => segment(r.page) === seg)), [cur, seg]);
  const kws = useMemo(() => aggregate(segRows, "query", prevQ), [segRows, prevQ]);
  const pages = useMemo(() => aggregate(segRows, "page", prevP), [segRows, prevP]);
  const engMap = useMemo(() => new Map(eng.map((e) => [e.path, e])), [eng]);

  const totals = useMemo(() => {
    const t = (rows: Snap[]) => {
      const clicks = rows.reduce((s, r) => s + r.clicks, 0), imp = rows.reduce((s, r) => s + r.impressions, 0);
      const pos = imp ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / imp : 0;
      return { clicks, imp, ctr: imp ? clicks / imp : 0, pos };
    };
    const prevSeg = seg === "all" ? prev : prev.filter((r) => segment(r.page) === seg);
    return { c: t(segRows), p: t(prevSeg) };
  }, [segRows, prev, seg]);

  const dist = useMemo(() => {
    const b = [{ name: "1–3", v: 0 }, { name: "4–10", v: 0 }, { name: "11–20", v: 0 }, { name: "21–50", v: 0 }, { name: "51+", v: 0 }];
    for (const k of kws) { const p = k.position; b[p <= 3.5 ? 0 : p <= 10.5 ? 1 : p <= 20.5 ? 2 : p <= 50.5 ? 3 : 4].v++; }
    return b;
  }, [kws]);

  const movers = useMemo(() => {
    const withPrev = kws.filter((k) => k.prevPosition !== null && k.impressions >= 50);
    const d = (k: Agg) => (k.prevPosition ?? 0) - k.position;
    return {
      up: [...withPrev].sort((a, b) => d(b) - d(a)).slice(0, 8).filter((k) => d(k) > 0.5),
      down: [...withPrev].sort((a, b) => d(a) - d(b)).slice(0, 8).filter((k) => d(k) < -0.5),
    };
  }, [kws]);

  const filteredKws = useMemo(() => {
    const min = Number(minImp) || 0;
    const s = q.trim().toLocaleLowerCase("tr");
    return kws.filter((k) => {
      if (k.impressions < min) return false;
      if (s && !k.key.toLocaleLowerCase("tr").includes(s)) return false;
      const p = k.position;
      if (band === "top3" && p > 3.5) return false;
      if (band === "top10" && p > 10.5) return false;
      if (band === "striking" && (p <= 7.5 || p > 20.5)) return false;
      if (band === "deep" && p <= 20.5) return false;
      if (band === "lowctr" && !(k.impressions >= 100 && k.ctr < expectedCtr(k.position) * 0.5)) return false;
      if (band === "rising" && !(k.prevPosition !== null && k.prevPosition - k.position > 1)) return false;
      if (band === "falling" && !(k.prevPosition !== null && k.position - k.prevPosition > 1)) return false;
      return true;
    }).sort((a, b) => {
      const av = a[sort.k] ?? 0, bv = b[sort.k] ?? 0;
      return typeof av === "string" ? String(av).localeCompare(String(bv), "tr") * sort.dir : ((av as number) - (bv as number)) * sort.dir;
    });
  }, [kws, q, band, minImp, sort]);

  const filteredPages = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    return pages.filter((p) => !s || pathOf(p.key).toLocaleLowerCase("tr").includes(s))
      .sort((a, b) => ((a[sort.k] as number) - (b[sort.k] as number)) * sort.dir);
  }, [pages, q, sort]);

  const opportunities = useMemo(() => pages
    .filter((p) => p.impressions >= 100)
    .map((p) => ({ ...p, potential: clickPotential({ page: p.key, clicks: p.clicks, impressions: p.impressions, ctr: p.ctr, position: p.position, topQuery: null }) }))
    .sort((a, b) => b.potential - a.potential).slice(0, 40), [pages]);

  const strikingKws = useMemo(() => kws.filter((k) => k.position > 7.5 && k.position <= 20.5 && k.impressions >= 50).sort((a, b) => b.impressions - a.impressions).slice(0, 40), [kws]);

  const engagementPages = useMemo(() => eng.filter((e) => seg === "all" || segment(`https://x${e.path}`) === seg), [eng, seg]);
  const engTotals = useMemo(() => {
    const v = engagementPages.reduce((s, e) => s + Number(e.views), 0);
    const avg = v ? engagementPages.reduce((s, e) => s + Number(e.avg_seconds) * Number(e.views), 0) / v : 0;
    return { views: v, avg, search: engagementPages.reduce((s, e) => s + Number(e.search_views), 0) };
  }, [engagementPages]);

  const totalPotential = opportunities.reduce((s, o) => s + o.potential, 0);
  const pendingCount = sugg.filter((s) => s.status === "pending").length;

  const toggleSort = (k: keyof Agg) => setSort((s) => (s.k === k ? { k, dir: (s.dir * -1) as 1 | -1 } : { k, dir: k === "position" ? 1 : -1 }));
  const SortHead = ({ k, children, className = "" }: { k: keyof Agg; children: React.ReactNode; className?: string }) => (
    <TableHead className={`cursor-pointer select-none whitespace-nowrap ${className}`} onClick={() => toggleSort(k)}>
      {children}{sort.k === k ? (sort.dir === -1 ? " ↓" : " ↑") : ""}
    </TableHead>
  );

  const openEdit = (s: Sugg) => { setEdit(s); setEditTitle(s.suggested_title ?? s.current_title ?? ""); setEditDesc(s.suggested_description ?? s.current_description ?? ""); };
  const actOn = async (id: string, action: "apply" | "dismiss", title?: string, description?: string) => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("seo-rank-sync", { body: { action, id, title, description } });
    setSaving(false);
    if (error || data?.error) { toast.error(data?.error || "İşlem başarısız"); return; }
    toast.success(action === "apply" ? "Uygulandı — bir sonraki yayında Google'a yansır" : "Öneri kapatıldı");
    setEdit(null); load();
  };

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const applicable = useMemo(() => sugg.filter((s) => s.status === "pending" && s.target_type !== "other" && s.suggested_title && s.suggested_description), [sugg]);
  const togglePick = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulkApply = async (ids: string[]) => {
    // Aynı sayfanın birden fazla önerisi tek uygulamada kapanır; sayfa başına bir kez gönder.
    const seen = new Set<string>();
    ids = ids.filter((id) => { const pg = sugg.find((s) => s.id === id)?.page ?? id; if (seen.has(pg)) return false; seen.add(pg); return true; });
    if (!ids.length) return;
    if (!window.confirm(`${ids.length} öneri onaylanıp uygulanacak. Devam edilsin mi?`)) return;
    setBulk({ done: 0, total: ids.length });
    let ok = 0, fail = 0;
    for (const id of ids) {
      const { data, error } = await supabase.functions.invoke("seo-rank-sync", { body: { action: "apply", id } });
      if (error || data?.error) fail++; else ok++;
      setBulk({ done: ok + fail, total: ids.length });
    }
    setBulk(null); setPicked(new Set());
    if (fail) toast.warning(`${ok} öneri uygulandı, ${fail} öneri uygulanamadı`);
    else toast.success(`${ok} öneri uygulandı — bir sonraki yayında Google'a yansır`);
    load();
  };

  const detailRows = useMemo(() => {
    if (!detail) return [];
    return cur.filter((r) => (detail.type === "query" ? r.query === detail.key : r.page === detail.key)).sort((a, b) => b.impressions - a.impressions).slice(0, 100);
  }, [detail, cur]);

  const kpis = [
    { label: "Tıklama (28 gün)", icon: MousePointerClick, v: nf(totals.c.clicks), d: <Delta cur={totals.c.clicks} prev={totals.p.clicks} /> },
    { label: "Gösterim", icon: Eye, v: nf(totals.c.imp), d: <Delta cur={totals.c.imp} prev={totals.p.imp} /> },
    { label: "Tıklama oranı", icon: Percent, v: pc(totals.c.ctr), d: <Delta cur={totals.c.ctr * 100} prev={totals.p.ctr * 100} fmt={(n) => `${n.toFixed(2)} puan`} /> },
    { label: "Ortalama sıra", icon: Trophy, v: totals.c.pos.toFixed(1), d: <Delta cur={totals.c.pos} prev={totals.p.pos} invert fmt={(n) => n.toFixed(1)} /> },
    { label: "Sıralanan kelime", icon: Search, v: nf(kws.length), d: <span className="text-xs text-muted-foreground">{nf(dist[0].v + dist[1].v)} tanesi ilk sayfada</span> },
    { label: "Ort. kalma süresi", icon: Clock, v: engTotals.views ? `${Math.round(engTotals.avg)} sn` : "—", d: <span className="text-xs text-muted-foreground">{nf(engTotals.views)} sayfa görüntüleme</span> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/divan_paneli/dashboard")} aria-label="Geri"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="mr-auto">
            <h1 className="text-lg font-bold leading-tight">Kelime Sıralayıcısı</h1>
            <p className="text-xs text-muted-foreground">
              Google Search Console · son 28 gün, önceki 28 günle karşılaştırma
              {lastRun && <> · son yenileme {new Date(lastRun.finished_at ?? lastRun.started_at).toLocaleString("tr-TR")} {lastRun.status === "error" && <span className="text-destructive">(hata)</span>}</>}
            </p>
          </div>
          <Select value={seg} onValueChange={(v) => { setSeg(v); setKwPage(0); setPgPage(0); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SEG_TR).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={runSync} disabled={syncing}><RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Yenileniyor" : "Şimdi yenile"}</Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : !cur.length ? (
          <Card><CardContent className="py-12 text-center">
            <p className="font-medium">Henüz veri yok.</p>
            <p className="mb-4 text-sm text-muted-foreground">Google'dan ilk veriyi çekmek için yenileyin.</p>
            <Button onClick={runSync} disabled={syncing}>Verileri çek</Button>
          </CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {kpis.map((k) => (
                <Card key={k.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><k.icon className="h-3.5 w-3.5" />{k.label}</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{k.v}</div>
                    <div className="mt-0.5">{k.d}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                <TabsTrigger value="keywords">Anahtar Kelimeler</TabsTrigger>
                <TabsTrigger value="pages">Sayfalar</TabsTrigger>
                <TabsTrigger value="opps">Fırsatlar</TabsTrigger>
                <TabsTrigger value="fixes">Düzeltmeler {pendingCount > 0 && <Badge className="ml-2" variant="destructive">{pendingCount}</Badge>}</TabsTrigger>
              </TabsList>

              {/* GENEL BAKIŞ */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">Kelimelerin sıra dağılımı</CardTitle><CardDescription>İlk 3 sıradaki kelimeler tıklamaların çoğunu getirir.</CardDescription></CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dist}>
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip formatter={(v: number) => [nf(v), "Kelime"]} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                          <Bar dataKey="v" radius={[6, 6, 0, 0]}>{dist.map((_, i) => <Cell key={i} fill={`hsl(var(--primary) / ${1 - i * 0.18})`} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" />Tıklama potansiyeli</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold text-primary tabular-nums">+{nf(totalPotential)}</div>
                      <p className="text-sm text-muted-foreground">En değerli 40 sayfa, bulunduğu sıranın normal tıklama oranına ulaşırsa 28 günde kazanılabilecek tahmini ek tıklama. Kesin sonuç değildir.</p>
                      <div className="flex flex-col gap-1 text-sm">
                        <span><b>{nf(strikingKws.length)}</b> kelime ilk sayfaya çok yakın</span>
                        <span><b>{pendingCount}</b> düzeltme önerisi onay bekliyor</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {([["up", "Yükselen kelimeler", movers.up], ["down", "Düşen kelimeler", movers.down]] as const).map(([k, title, list]) => (
                    <Card key={k}>
                      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
                      <CardContent className="space-y-1">
                        {list.length === 0 && <p className="text-sm text-muted-foreground">Belirgin değişim yok.</p>}
                        {list.map((m) => (
                          <button key={m.key} onClick={() => setDetail({ type: "query", key: m.key })} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
                            <span className="flex-1 truncate">{m.key}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{m.prevPosition!.toFixed(1)} →</span>
                            <PosBadge p={m.position} />
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ANAHTAR KELİMELER */}
              <TabsContent value="keywords">
                <Card>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Kelime ara… (ör. psikolog, kaygı)" value={q} onChange={(e) => { setQ(e.target.value); setKwPage(0); }} />
                      </div>
                      <Select value={band} onValueChange={(v) => { setBand(v); setKwPage(0); }}>
                        <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm sıralar</SelectItem>
                          <SelectItem value="top3">İlk 3</SelectItem>
                          <SelectItem value="top10">İlk sayfa (1–10)</SelectItem>
                          <SelectItem value="striking">İlk sayfaya yakın (8–20)</SelectItem>
                          <SelectItem value="deep">20 sonrası</SelectItem>
                          <SelectItem value="lowctr">Az tıklananlar</SelectItem>
                          <SelectItem value="rising">Yükselenler</SelectItem>
                          <SelectItem value="falling">Düşenler</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={minImp} onValueChange={(v) => { setMinImp(v); setKwPage(0); }}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>{["0", "10", "50", "100", "500", "1000"].map((v) => <SelectItem key={v} value={v}>En az {v} gösterim</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => exportCsv("anahtar-kelimeler.csv", [["Kelime", "Tıklama", "Gösterim", "TO", "Sıra", "Önceki sıra", "Sayfa"], ...filteredKws.map((k) => [k.key, k.clicks, k.impressions, (k.ctr * 100).toFixed(2), k.position.toFixed(1), k.prevPosition?.toFixed(1) ?? "", pathOf(k.topPage ?? "")])])}>
                        <Download className="mr-2 h-4 w-4" />Excel
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{nf(filteredKws.length)} kelime · satıra tıklayınca hangi sayfaların sıralandığını görürsünüz</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <SortHead k="key">Kelime</SortHead>
                          <SortHead k="position" className="text-center">Sıra</SortHead>
                          <TableHead className="text-center">Değişim</TableHead>
                          <SortHead k="clicks" className="text-right">Tıklama</SortHead>
                          <SortHead k="impressions" className="text-right">Gösterim</SortHead>
                          <SortHead k="ctr" className="text-right">TO</SortHead>
                          <TableHead>Sıralanan sayfa</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {filteredKws.slice(kwPage * PAGE, kwPage * PAGE + PAGE).map((k) => (
                            <TableRow key={k.key} className="cursor-pointer" onClick={() => setDetail({ type: "query", key: k.key })}>
                              <TableCell className="max-w-[280px] truncate font-medium">{k.key}</TableCell>
                              <TableCell className="text-center"><PosBadge p={k.position} /></TableCell>
                              <TableCell className="text-center">{k.prevPosition !== null ? <Delta cur={k.position} prev={k.prevPosition} invert fmt={(n) => n.toFixed(1)} /> : <span className="text-xs text-muted-foreground">yeni</span>}</TableCell>
                              <TableCell className="text-right tabular-nums">{nf(k.clicks)}</TableCell>
                              <TableCell className="text-right tabular-nums">{nf(k.impressions)}</TableCell>
                              <TableCell className={`text-right tabular-nums ${k.impressions >= 100 && k.ctr < expectedCtr(k.position) * 0.5 ? "text-destructive" : ""}`}>{pc(k.ctr)}</TableCell>
                              <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">{pathOf(k.topPage ?? "")}{k.pages > 1 && <Badge variant="outline" className="ml-1">+{k.pages - 1}</Badge>}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pager page={kwPage} total={filteredKws.length} onChange={setKwPage} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SAYFALAR */}
              <TabsContent value="pages">
                <Card>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Sayfa ara… (ör. /blog/, uzman adı)" value={q} onChange={(e) => { setQ(e.target.value); setPgPage(0); }} />
                      </div>
                      <Button variant="outline" onClick={() => exportCsv("sayfalar.csv", [["Sayfa", "Tıklama", "Gösterim", "TO", "Sıra", "Görüntüleme", "Ort. süre sn", "Hızlı çıkış %"], ...filteredPages.map((p) => { const e = engMap.get(pathOf(p.key)); return [pathOf(p.key), p.clicks, p.impressions, (p.ctr * 100).toFixed(2), p.position.toFixed(1), e?.views ?? "", e?.avg_seconds ?? "", e?.bounce_rate ?? ""]; })])}>
                        <Download className="mr-2 h-4 w-4" />Excel
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Görüntüleme ve kalma süresi sitenin kendi sayacından gelir (yeni kuruldu, veri biriktikçe dolar). "Hızlı çıkış" 10 saniyeden kısa kalan ziyaretlerin oranıdır.</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Sayfa</TableHead>
                          <SortHead k="position" className="text-center">Sıra</SortHead>
                          <SortHead k="clicks" className="text-right">Tıklama</SortHead>
                          <SortHead k="impressions" className="text-right">Gösterim</SortHead>
                          <SortHead k="ctr" className="text-right">TO</SortHead>
                          <SortHead k="pages" className="text-right">Kelime</SortHead>
                          <TableHead className="text-right">Görüntüleme</TableHead>
                          <TableHead className="text-right">Ort. süre</TableHead>
                          <TableHead className="text-right">Hızlı çıkış</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {filteredPages.slice(pgPage * PAGE, pgPage * PAGE + PAGE).map((p) => {
                            const e = engMap.get(pathOf(p.key));
                            return (
                              <TableRow key={p.key} className="cursor-pointer" onClick={() => setDetail({ type: "page", key: p.key })}>
                                <TableCell className="max-w-[320px]">
                                  <div className="truncate font-medium">{pathOf(p.key)}</div>
                                  <div className="text-xs text-muted-foreground">{SEG_TR[segment(p.key)]}</div>
                                </TableCell>
                                <TableCell className="text-center"><PosBadge p={p.position} /></TableCell>
                                <TableCell className="text-right tabular-nums">{nf(p.clicks)} <Delta cur={p.clicks} prev={p.prevClicks || null} /></TableCell>
                                <TableCell className="text-right tabular-nums">{nf(p.impressions)}</TableCell>
                                <TableCell className="text-right tabular-nums">{pc(p.ctr)}</TableCell>
                                <TableCell className="text-right tabular-nums">{nf(p.pages)}</TableCell>
                                <TableCell className="text-right tabular-nums">{e ? nf(Number(e.views)) : "—"}</TableCell>
                                <TableCell className="text-right tabular-nums">{e ? `${Math.round(Number(e.avg_seconds))} sn` : "—"}</TableCell>
                                <TableCell className={`text-right tabular-nums ${e && Number(e.bounce_rate) > 60 ? "text-destructive" : ""}`}>{e ? `%${e.bounce_rate}` : "—"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <Pager page={pgPage} total={filteredPages.length} onChange={setPgPage} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FIRSATLAR */}
              <TabsContent value="opps" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">En çok ek tıklama getirecek sayfalar</CardTitle><CardDescription>Gösterimi yüksek ama sırasına göre az tıklanan sayfalar. Önce bunlar düzeltilmeli.</CardDescription></CardHeader>
                  <CardContent className="space-y-2">
                    {opportunities.map((o) => {
                      const issues = classifyPage({ page: o.key, clicks: o.clicks, impressions: o.impressions, ctr: o.ctr, position: o.position, topQuery: null }, "x".repeat(40), "x".repeat(100));
                      return (
                        <div key={o.key} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                          <div className="min-w-0 flex-1">
                            <button onClick={() => setDetail({ type: "page", key: o.key })} className="block truncate text-left font-medium hover:underline">{pathOf(o.key)}</button>
                            <div className="mt-1 flex flex-wrap gap-1">{issues.map((i) => <Badge key={i.issue} variant="secondary">{ISSUE_TR[i.issue]}</Badge>)}</div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground tabular-nums">{nf(o.impressions)} gösterim · {pc(o.ctr)} · sıra {o.position.toFixed(1)}</div>
                          <div className="w-24 text-right text-lg font-bold text-primary tabular-nums">+{nf(o.potential)}</div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">İlk sayfaya çok yakın kelimeler (8–20. sıra)</CardTitle><CardDescription>Bu kelimeler için sayfaya ilgili başlık, alt başlık ve soru-cevap eklemek en hızlı kazanımdır.</CardDescription></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Kelime</TableHead><TableHead className="text-center">Sıra</TableHead><TableHead className="text-right">Gösterim</TableHead><TableHead>Sayfa</TableHead></TableRow></TableHeader>
                      <TableBody>{strikingKws.map((k) => (
                        <TableRow key={k.key} className="cursor-pointer" onClick={() => setDetail({ type: "query", key: k.key })}>
                          <TableCell className="font-medium">{k.key}</TableCell><TableCell className="text-center"><PosBadge p={k.position} /></TableCell>
                          <TableCell className="text-right tabular-nums">{nf(k.impressions)}</TableCell><TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">{pathOf(k.topPage ?? "")}</TableCell>
                        </TableRow>))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* DÜZELTMELER */}
              <TabsContent value="fixes" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={suggFilter} onValueChange={setSuggFilter}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Onay bekleyen</SelectItem><SelectItem value="applied">Uygulananlar</SelectItem><SelectItem value="dismissed">Kapatılanlar</SelectItem></SelectContent>
                  </Select>
                  {suggFilter === "pending" && applicable.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPicked(picked.size === applicable.length ? new Set() : new Set(applicable.map((s) => s.id)))}>
                        {picked.size === applicable.length ? "Seçimi kaldır" : "Tümünü seç"}
                      </Button>
                      <Button size="sm" disabled={!!bulk || picked.size === 0} onClick={() => bulkApply([...picked])}>
                        <Check className="mr-1 h-4 w-4" />Seçilenleri onayla ({picked.size})
                      </Button>
                      <Button size="sm" variant="secondary" disabled={!!bulk} onClick={() => bulkApply(applicable.map((s) => s.id))}>
                        Tümünü onayla ({applicable.length})
                      </Button>
                      {bulk && <span className="text-sm text-muted-foreground tabular-nums">Uygulanıyor {bulk.done}/{bulk.total}…</span>}
                    </div>
                  )}
                  <p className="w-full text-xs text-muted-foreground">Sistem her 6 saatte bir sayfaları SEO kurallarına göre tarar ve önerileri buraya ekler. Onayladığınız başlık/açıklama bir sonraki yayında Google'a yansır; etkisi 2–4 haftada görülür.</p>
                </div>
                {sugg.filter((s) => s.status === suggFilter).length === 0 && <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Bu listede öneri yok.</CardContent></Card>}
                {sugg.filter((s) => s.status === suggFilter).map((s) => (
                  <Card key={s.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start gap-2">
                        {s.status === "pending" && s.target_type !== "other" && s.suggested_title && (
                          <input type="checkbox" aria-label="Seç" className="mt-1 h-4 w-4 accent-primary" checked={picked.has(s.id)} onChange={() => togglePick(s.id)} />
                        )}
                        <Badge variant={s.severity === "high" ? "destructive" : "secondary"}>{s.severity === "high" ? "Yüksek öncelik" : s.severity === "medium" ? "Orta" : "Düşük"}</Badge>
                        <Badge variant="outline">{ISSUE_TR[s.issue] ?? s.issue}</Badge>
                        <a href={s.page} target="_blank" rel="noreferrer" className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-sm font-medium hover:underline">{pathOf(s.page)}<ExternalLink className="h-3 w-3 shrink-0" /></a>
                        <span className="text-xs text-muted-foreground tabular-nums">{nf(s.impressions)} gösterim · {pc(Number(s.ctr))} · sıra {Number(s.position).toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{ISSUE_HELP[s.issue]}{s.main_query && <> Ana kelime: <b className="text-foreground">{s.main_query}</b></>}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg bg-muted p-3 text-sm">
                          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Şu an Google'da</div>
                          <div className="font-medium">{s.current_title || "—"}</div>
                          <div className="mt-1 text-muted-foreground">{s.current_description || "Açıklama yok"}</div>
                        </div>
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                          <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-primary"><Sparkles className="h-3 w-3" />Önerilen</div>
                          <div className="font-medium">{s.suggested_title || "Öneri metni bir sonraki yenilemede yazılacak"}</div>
                          <div className="mt-1 text-muted-foreground">{s.suggested_description}</div>
                        </div>
                      </div>
                      {s.status === "pending" && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="ghost" size="sm" disabled={saving} onClick={() => actOn(s.id, "dismiss")}><X className="mr-1 h-4 w-4" />Kapat</Button>
                          {s.target_type !== "other" && <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Düzenle ve uygula</Button>}
                          {s.target_type !== "other" && s.suggested_title && <Button size="sm" disabled={saving} onClick={() => actOn(s.id, "apply")}><Check className="mr-1 h-4 w-4" />Onayla ve uygula</Button>}
                          {s.target_type === "other" && <span className="text-xs text-muted-foreground">Bu sayfa panelden düzenlenemiyor; bize iletin.</span>}
                        </div>
                      )}
                      {s.status === "applied" && s.applied_at && <p className="text-xs text-primary">Uygulandı: {new Date(s.applied_at).toLocaleString("tr-TR")}</p>}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="break-all">{detail?.type === "page" ? pathOf(detail.key) : detail?.key}</DialogTitle>
            <DialogDescription>{detail?.type === "page" ? "Bu sayfanın Google'da çıktığı kelimeler" : "Bu kelimede çıkan sayfalarınız"}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader><TableRow><TableHead>{detail?.type === "page" ? "Kelime" : "Sayfa"}</TableHead><TableHead className="text-center">Sıra</TableHead><TableHead className="text-right">Tıklama</TableHead><TableHead className="text-right">Gösterim</TableHead><TableHead className="text-right">TO</TableHead></TableRow></TableHeader>
              <TableBody>{detailRows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="max-w-[320px] truncate">{detail?.type === "page" ? r.query : pathOf(r.page)}</TableCell>
                  <TableCell className="text-center"><PosBadge p={Number(r.position)} /></TableCell>
                  <TableCell className="text-right tabular-nums">{nf(r.clicks)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nf(r.impressions)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pc(Number(r.ctr))}</TableCell>
                </TableRow>))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Google başlığı ve açıklaması</DialogTitle><DialogDescription className="break-all">{edit && pathOf(edit.page)}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs"><span>Başlık</span><span className={editTitle.length > 60 ? "text-destructive" : "text-muted-foreground"}>{editTitle.length}/60</span></div>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={70} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs"><span>Açıklama</span><span className={editDesc.length > 160 ? "text-destructive" : "text-muted-foreground"}>{editDesc.length}/160</span></div>
              <Textarea rows={4} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={170} />
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Google önizleme</div>
              <div className="truncate text-base text-primary">{editTitle || "Başlık"}</div>
              <div className="truncate text-xs text-muted-foreground">doktorumol.com.tr{edit && pathOf(edit.page)}</div>
              <div className="line-clamp-2 text-sm text-muted-foreground">{editDesc}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEdit(null)}>Vazgeç</Button>
              <Button disabled={saving || editTitle.length < 10 || editDesc.length < 50} onClick={() => edit && actOn(edit.id, "apply", editTitle, editDesc)}>Uygula</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pager({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">{page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} / {nf(total)}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>Önceki</Button>
        <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>Sonraki</Button>
      </div>
    </div>
  );
}
