import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Hash, Phone, PhoneCall, PhoneMissed, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { safeCsv } from "@/lib/safeCsv";
import { callLine, callResult, isAnswered, IVR_RESULT_LABELS, secondsBetween, type IvrCall, type IvrStatsResponse } from "@/lib/ivrStatistics";

const areaLabels: Record<string, string> = { bireysel: "Bireysel Terapi", cocuk: "Çocuk Terapisi", cift: "Çift Terapisi", aile: "Aile Danışmanlığı", iliski: "İlişki Danışmanlığı" };
const stamp = (value?: string | null) => value ? new Date(value).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Kaydedilmemiş";
const duration = (value: number | null) => value === null ? "—" : `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
const name = (call: IvrCall) => call.name || (call.lead_id ? "Danışan" : "Deneme araması");
function Result({ call }: { call: IvrCall }) {
  const result = callResult(call);
  const success = isAnswered(call);
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${success ? "bg-ivr-success-soft text-ivr-success" : result === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}><span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />{IVR_RESULT_LABELS[result]}</span>;
}

export default function IvrStatisticsPanel({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<IvrStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [campaign, setCampaign] = useState("latest");
  const [line, setLine] = useState("all");
  const [result, setResult] = useState("all");
  const [scope, setScope] = useState("real");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<IvrCall | null>(null);
  const [now, setNow] = useState(Date.now());
  const generation = useRef(0);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 350); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { setPage(1); }, [campaign, line, result, scope, debounced, from, to]);
  const filters = { campaign, line, result, scope, search: debounced, from, to, page };
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const load = useCallback(async (manual = false) => {
    if (inFlight.current || document.hidden) return;
    inFlight.current = true;
    if (manual) setRefreshing(true);
    const current = generation.current;
    try {
      const { data: response, error: requestError } = await supabase.functions.invoke("lead-ivr-statistics", { body: filtersRef.current });
      if (requestError) throw requestError;
      if (current !== generation.current || !mounted.current) return;
      if (!response?.summary || !Array.isArray(response.calls)) throw new Error("invalid_response");
      setData(response); setError(null);
    } catch {
      if (current === generation.current && mounted.current) setError("Arama istatistiklerine şu anda ulaşılamıyor. Ayrıntılı istatistik hizmeti henüz açılmamış veya bağlantı kesilmiş olabilir.");
    } finally {
      inFlight.current = false;
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    generation.current++;
    void load();
    const refresh = () => { if (!document.hidden) { setNow(Date.now()); void load(); } };
    const poll = setInterval(refresh, 5000);
    const clock = setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => { mounted.current = false; generation.current++; clearInterval(poll); clearInterval(clock); document.removeEventListener("visibilitychange", refresh); };
  }, [load, campaign, line, result, scope, debounced, from, to, page]);

  const download = async () => {
    setExporting(true);
    try {
      const { data: response, error: requestError } = await supabase.functions.invoke("lead-ivr-statistics", { body: { ...filters, export: true } });
      if (requestError || !Array.isArray(response?.calls)) throw new Error("export");
      const rows = response.calls as IvrCall[];
      const text = safeCsv([["Kişi", "Telefon", "Hat", "Terapi", "Başlangıç", "Açılma", "Kapanma", "Çalma (sn)", "Görüşme (sn)", "Tuş", "Sonuç"], ...rows.map(call => [name(call), call.phone, callLine(call), areaLabels[call.area_key], stamp(call.dispatched_at), stamp(call.answered_at), stamp(call.ended_at), secondsBetween(call.ringing_at, call.answered_at || call.ended_at), secondsBetween(call.answered_at, call.ended_at), call.digit === "1" || call.digit === "2" ? call.digit : "", IVR_RESULT_LABELS[callResult(call)]])], ";");
      const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "otomatik-arama-istatistigi.csv"; anchor.click(); URL.revokeObjectURL(url);
    } catch { setError("Dosya indirilemedi. Bağlantıyı kontrol edip yeniden deneyin."); }
    finally { setExporting(false); }
  };
  const summary = data?.summary;
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / 50));
  const metrics = [
    { label: "Toplam arama", value: summary?.total, icon: Phone, tone: "text-foreground" },
    { label: "Sırada", value: summary?.counts.queued, icon: Clock3, tone: "text-muted-foreground" },
    { label: "Devam eden", value: summary?.active, icon: PhoneCall, tone: "text-primary" },
    { label: "Açan", value: summary?.answered, icon: CheckCircle2, tone: "text-ivr-success" },
    { label: "Yanıt yok", value: summary?.counts.no_answer, icon: PhoneMissed, tone: "text-muted-foreground" },
    { label: "Hata", value: summary?.counts.failed, icon: XCircle, tone: "text-destructive" },
  ];

  return <section className="space-y-6" aria-label="Otomatik Arama İstatistiği">
    <header className="flex flex-col gap-4 border-b pb-5">
      <Button onClick={onBack} variant="ghost" size="sm" className="self-start -ml-3"><ArrowLeft className="mr-2 h-4 w-4" />Danışanlara dön</Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-primary/10 p-3 text-primary"><Activity className="h-6 w-6" /></div><div className="min-w-0"><h1 className="text-xl sm:text-2xl font-semibold break-words">Otomatik Arama İstatistiği</h1><p className="mt-1 text-xs text-muted-foreground">80 ve 81 hatları <span className="mx-2">·</span> Türkiye saati 10:00–18:00</p></div></div>
        <div className="flex items-center gap-3"><span className={`flex items-center gap-1.5 text-xs ${error ? "text-destructive" : "text-ivr-success"}`}><span className="h-2 w-2 rounded-full bg-current" />{error ? "Güncel değil" : data ? "Güncel" : "Bağlanıyor"}</span><Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "motion-safe:animate-spin" : ""}`} />Yenile</Button></div>
      </div>
    </header>
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}{data && <p className="mt-1">Son alınan veriler gösteriliyor: {stamp(data.updatedAt)}</p>}</div>}
    {data && !data.telemetryReady && <div className="flex items-start gap-2 border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Santralden saniye bilgisi henüz gelmiyor. Eski aramalarda açılma, kapanma ve kesin yanıt durumu kaydedilmemiş olabilir.</p></div>}
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <div className="col-span-2 md:col-span-1"><label className="mb-1.5 block text-xs text-muted-foreground">Kampanya</label><Select value={campaign} onValueChange={setCampaign}><SelectTrigger aria-label="Kampanya"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="latest">Son kampanya</SelectItem><SelectItem value="all">Tüm kampanyalar</SelectItem>{data?.campaigns.map(c => <SelectItem key={c.id} value={c.id}>{stamp(c.created_at)} · {c.total} arama {c.status === "test" ? "(Deneme)" : ""}</SelectItem>)}</SelectContent></Select></div>
      <div><label className="mb-1.5 block text-xs text-muted-foreground">Hat</label><Select value={line} onValueChange={setLine}><SelectTrigger aria-label="Hat"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">İki hat</SelectItem><SelectItem value="81">81 · 0531 789 38 80</SelectItem><SelectItem value="80">80 · 0532 822 22 75</SelectItem></SelectContent></Select></div>
      <div><label className="mb-1.5 block text-xs text-muted-foreground">Arama türü</label><Select value={scope} onValueChange={setScope}><SelectTrigger aria-label="Arama türü"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="real">Danışan aramaları</SelectItem><SelectItem value="test">Deneme aramaları</SelectItem></SelectContent></Select></div>
      <div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="ivr-from">Başlangıç tarihi</label><Input id="ivr-from" type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></div>
      <div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="ivr-to">Bitiş tarihi</label><Input id="ivr-to" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></div>
      <div className="flex items-end"><Button variant="ghost" className="w-full" onClick={() => { setCampaign("latest"); setLine("all"); setScope("real"); setFrom(""); setTo(""); setSearch(""); setResult("all"); }}>Filtreleri sıfırla</Button></div>
    </div>
    <div className="grid grid-cols-2 gap-0 divide-x divide-border md:grid-cols-3 xl:grid-cols-6 border-y py-5">
      {metrics.map(m => <div key={m.label} className="px-4 py-3 first:pl-0"><div className={`flex items-center gap-2 text-xs ${m.tone}`}><m.icon className="h-4 w-4" />{m.label}</div><div className={`mt-3 text-3xl font-semibold tabular-nums ${m.tone}`}>{loading ? <span className="block h-9 w-14 rounded bg-muted animate-pulse" /> : m.value?.toLocaleString("tr-TR") ?? "—"}</div></div>)}
    </div>
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <section className="min-w-0"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold flex items-center gap-2"><PhoneCall className="h-4 w-4 text-primary" />Anlık aramalar</h2><span className="text-xs text-muted-foreground">Her hatta en fazla 1 arama</span></div>
        <div className="grid gap-3 sm:grid-cols-2">{[{ id: "81", number: "0531 789 38 80" }, { id: "80", number: "0532 822 22 75" }].map(l => {
          const call = data?.activeCalls.find(c => callLine(c) === l.id);
          const fresh = Boolean(call?.observed_at && now - Date.parse(call.observed_at) < 15000 && !error);
          const elapsed = fresh && call ? secondsBetween(call.answered_at || call.ringing_at || call.dispatched_at, new Date(now).toISOString()) : null;
          return <article key={l.id} className={`min-w-0 rounded-lg border p-4 ${call ? "border-primary/30 bg-primary/5" : "bg-card/60"}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">Hat {l.id}</span><Phone className={`h-4 w-4 ${call ? "text-primary" : "text-muted-foreground"}`} /></div><p className="mt-1 text-sm font-semibold">{l.number}</p><div className="mt-5 min-h-[110px]">{call ? <><p className="font-semibold break-words">{name(call)}</p><p className="mt-1 text-xs text-muted-foreground break-all">{call.phone}</p><p className="mt-1 text-xs text-muted-foreground">{areaLabels[call.area_key]}</p><div className="mt-3 flex items-center justify-between gap-2"><Result call={call} /><span className="text-lg font-semibold tabular-nums">{duration(elapsed)}</span></div>{!fresh && <p className="mt-2 text-xs text-muted-foreground">Anlık hat durumu doğrulanamadı</p>}</> : <div className="flex h-24 flex-col items-center justify-center gap-2 text-muted-foreground"><Phone className="h-5 w-5" /><p className="text-xs">{data ? "Devam eden kayıt yok" : "Hat bilgisi bekleniyor"}</p></div>}</div></article>;
        })}</div>
      </section>
      <section className="min-w-0"><h2 className="mb-4 text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Kampanya özeti</h2><div className="flex items-baseline justify-between"><span className="text-xs text-muted-foreground">Tamamlanan</span><span className="text-xl font-semibold tabular-nums">{summary ? `${summary.completed} / ${summary.total}` : "—"}</span></div><progress aria-label="Kampanya ilerlemesi" max={summary?.total || 1} value={summary?.completed || 0} className="ivr-progress mt-3 h-2 w-full" /><div className="mt-4 grid grid-cols-3 gap-3 border-b pb-4">{[{ label: "Yanıt oranı", value: summary?.answerRate !== null && summary?.answerRate !== undefined ? `%${summary.answerRate}` : "—" }, { label: "Tuşlama oranı", value: summary?.keyRate !== null && summary?.keyRate !== undefined ? `%${summary.keyRate}` : "—" }, { label: "Ort. görüşme", value: duration(summary?.averageTalk ?? null) }].map(item => <div key={item.label}><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 text-lg font-semibold tabular-nums">{item.value}</p></div>)}</div><div className="mt-4 space-y-2 text-sm">{[{ key: "pressed_1" as const, label: "1'i tuşlayanlar" }, { key: "pressed_2" as const, label: "2'yi tuşlayanlar" }, { key: "no_key" as const, label: "Açtı, tuşlamadı" }, { key: "unknown" as const, label: "Doğrulanamayan sonuç" }, { key: "busy" as const, label: "Meşgul" }].map(item => <div key={item.key} className="flex items-center justify-between"><span className="text-muted-foreground">{item.label}</span><span className="font-medium tabular-nums">{summary?.counts[item.key]?.toLocaleString("tr-TR") ?? "—"}</span></div>)}</div></section>
    </div>
    {data && <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-3 text-xs text-muted-foreground"><span>Kalan çalışma süresi: <b className="font-medium text-foreground">{data.remainingSeconds === null || data.remainingSeconds === undefined ? "Yeterli ölçüm yok" : `yaklaşık ${Math.ceil(data.remainingSeconds / 60)} dakika`}</b></span><span>18:00 sonrası kalan aramalar sonraki çalışma saatine kalır.</span></div>}
    <section className="border-t pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">Arama geçmişi <span className="ml-2 text-sm font-normal text-muted-foreground">{data?.total.toLocaleString("tr-TR") ?? "—"}</span></h2><Button variant="outline" size="sm" disabled={!data || exporting} onClick={() => void download()}><Download className="mr-2 h-4 w-4" />{exporting ? "Hazırlanıyor" : "CSV indir"}</Button></div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Kişi veya telefon ara" placeholder="Kişi veya telefon ara" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={result} onValueChange={setResult}><SelectTrigger className="sm:w-56" aria-label="Arama sonucu"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tüm sonuçlar</SelectItem>{Object.entries(IVR_RESULT_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="hidden lg:table-header-group border-y bg-muted/40 text-xs text-muted-foreground"><tr>{["Kişi / Telefon", "Hat", "Başlangıç", "Çalma", "Görüşme", "Tuş / Sonuç", ""].map((label, i) => <th className="px-3 py-3 font-medium" key={i}>{label}</th>)}</tr></thead><tbody>{data?.calls.map(call => <tr key={call.id} className="block lg:table-row border-b hover:bg-muted/30"><td className="block lg:table-cell p-3"><p className="font-medium break-words">{name(call)}</p><p className="mt-1 text-xs text-muted-foreground break-all">{call.phone} · {areaLabels[call.area_key] || call.area_key}</p></td><td className="inline-block lg:table-cell p-3 text-xs">Hat {callLine(call) || "—"}</td><td className="inline-block lg:table-cell p-3 text-xs text-muted-foreground">{stamp(call.dispatched_at)}</td><td className="hidden lg:table-cell p-3 tabular-nums">{duration(secondsBetween(call.ringing_at, call.answered_at || call.ended_at))}</td><td className="hidden lg:table-cell p-3 tabular-nums">{duration(secondsBetween(call.answered_at, call.ended_at))}</td><td className="inline-block lg:table-cell p-3"><Result call={call} /></td><td className="inline-block lg:table-cell p-3"><Button aria-label={`${name(call)} arama ayrıntısı`} title="Arama ayrıntısı" variant="ghost" size="icon" onClick={() => setSelected(call)}><ArrowRight className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>
      {!data?.calls.length && <div className="py-12 text-center text-muted-foreground"><PhoneMissed className="mx-auto mb-3 h-7 w-7" /><p className="text-sm">{loading ? "Arama kayıtları yükleniyor…" : data ? "Bu filtrelerde arama kaydı yok." : "Arama kayıtları henüz alınamadı."}</p></div>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>{data ? `Son güncelleme: ${stamp(data.updatedAt)}` : "—"}</span><div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Önceki sayfa" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><span>{page} / {totalPages}</span><Button variant="outline" size="icon" aria-label="Sonraki sayfa" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Arama ayrıntısı</DialogTitle><DialogDescription>{selected ? `${name(selected)} · ${selected.phone}` : ""}</DialogDescription></DialogHeader>{selected && <><div className="flex flex-wrap items-center justify-between gap-2"><Result call={selected} /><span className="text-xs text-muted-foreground">Hat {callLine(selected) || "—"} · {areaLabels[selected.area_key]}</span></div><dl className="grid grid-cols-3 gap-3 border-y py-4">{[{ label: "Çalma", value: secondsBetween(selected.ringing_at, selected.answered_at || selected.ended_at) }, { label: "Görüşme", value: secondsBetween(selected.answered_at, selected.ended_at) }, { label: "Toplam", value: secondsBetween(selected.dispatched_at, selected.ended_at) }].map(m => <div key={m.label}><dt className="text-xs text-muted-foreground">{m.label}</dt><dd className="mt-2 text-xl font-semibold tabular-nums">{duration(m.value)}</dd></div>)}</dl><ol className="space-y-4 py-2">{[{ label: "Sıraya alındı", at: selected.created_at, icon: Clock3 }, { label: "Arama gönderildi", at: selected.dispatched_at, icon: Phone }, { label: "Çalmaya başladı", at: selected.ringing_at, icon: PhoneCall }, { label: "Telefon açıldı", at: selected.answered_at, icon: CheckCircle2 }, { label: selected.digit === "1" || selected.digit === "2" ? `${selected.digit} tuşlandı` : "Tuşlama", at: selected.digit_at, icon: Hash }, { label: "Çağrı kapandı", at: selected.ended_at, icon: PhoneMissed }].map(event => <li key={event.label} className="flex gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.at ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><event.icon className="h-4 w-4" /></div><div><p className="text-sm font-medium">{event.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{stamp(event.at)}</p></div></li>)}</ol>{!selected.ended_at && <p className="text-xs text-muted-foreground">Kesin kapanma zamanı kaydedilmemiş. Gönderimden geçen süre görüşme süresi değildir.</p>}</>}</DialogContent></Dialog>
  </section>;
}