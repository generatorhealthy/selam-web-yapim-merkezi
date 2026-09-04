import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneCall,
  Clock,
  Users,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  PhoneForwarded,
  XCircle,
  User,
  Play,
  Pause,
  Loader2,
  MicOff,
} from "lucide-react";

// PBX sunucusu saatleri UTC olarak yazıyor ("2026-08-04 10:51:00").
// Bu yüzden UTC olarak parse edip İstanbul saatine çeviriyoruz.
const parsePbxDate = (value: string): Date => {
  if (!value) return new Date(NaN);
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    return new Date(
      Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]),
    );
  }
  return new Date(value);
};

const formatPbxDate = (value: string): string => {
  const d = parsePbxDate(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};



interface Summary {
  total: number;
  answered: number;
  no_answer: number;
  busy: number;
  failed: number;
  total_billsec: number;
  outbound: number;
  inbound: number;
  internal_calls: number;
  outbound_people: number;
  inbound_people: number;
  talked_people: number;
}

interface DailyRow {
  gun: string;
  toplam: number;
  cevaplanan: number;
  dakika: number;
  giden: number;
  gelen: number;
}

interface ExtRow {
  ext: string;
  toplam: number;
  giden: number;
  gelen: number;
  cevaplanan: number;
  dakika: number;
}

interface RecentRow {
  calldate: string;
  src: string;
  dst: string;
  duration: number;
  billsec: number;
  disposition: string;
  yon: string;
  recordingfile?: string | null;
}

interface TransferRow {
  calldate: string;
  musteri: string;
  uzman_ext: string;
  sure: number;
  disposition: string;
  acti: number;
  yon: string;
  linkedid?: string;
  uniqueid?: string;
  recordingfile?: string | null;
}

interface CdrResponse {
  success: boolean;
  from: string;
  to: string;
  summary: Summary;
  daily: DailyRow[];
  by_extension: ExtRow[];
  recent: RecentRow[];
  transfers?: TransferRow[];
}

const RANGES = [
  { label: "Bugün", days: 0 },
  { label: "7 Gün", days: 6 },
  { label: "30 Gün", days: 29 },
  { label: "90 Gün", days: 89 },
];

const num = (v: unknown) => Number(v ?? 0) || 0;

// Telefon numaralarını son 10 haneye indirger (0/90/8 önekleri temizlenir)
const phoneKey = (v: unknown) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
};

const DISPOSITION_TR: Record<string, string> = {
  ANSWERED: "Cevaplandı",
  "NO ANSWER": "Cevapsız",
  NOANSWER: "Cevapsız",
  BUSY: "Meşgul",
  FAILED: "Başarısız",
  CONGESTION: "Hat Yoğun",
};

const dispositionTr = (v: string) => DISPOSITION_TR[(v || "").toUpperCase()] ?? (v || "Bilinmiyor");

const fmtMinutes = (totalMin: number) => {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m} dk`;
};


const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  tone: string;
}) => (
  <Card className="overflow-hidden border-border/60">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const PbxCallStats = () => {
  const [rangeDays, setRangeDays] = useState(6);
  const [data, setData] = useState<CdrResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extMap, setExtMap] = useState<Record<string, string>>({});
  const [leadMap, setLeadMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from("freepbx_extensions")
        .select("extension, customer_name");
      if (rows) {
        const map: Record<string, string> = {};
        rows.forEach((r: any) => {
          if (r.extension) map[String(r.extension)] = r.customer_name || "";
        });
        setExtMap(map);
      }
    })();
  }, []);

  // Danışan yönlendirme sisteminden telefon -> ad soyad eşlemesi
  useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      const pageSize = 1000;
      for (let page = 0; page < 10; page++) {
        const { data: rows, error: err } = await supabase
          .from("danisan_basvurulari")
          .select("full_name, phone")
          .range(page * pageSize, page * pageSize + pageSize - 1);
        if (err || !rows || rows.length === 0) break;
        rows.forEach((r: any) => {
          const key = phoneKey(r.phone);
          if (key && r.full_name && !map[key]) map[key] = r.full_name;
        });
        if (rows.length < pageSize) break;
      }
      setLeadMap(map);
    })();
  }, []);


  const fetchStats = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), days), "yyyy-MM-dd");
      const { data: res, error: fnErr } = await supabase.functions.invoke("freepbx-create-extension", {
        body: { action: "cdr_stats", from, to },
      });
      if (fnErr) throw fnErr;
      if (res?.error) throw new Error(res.error);
      setData(res as CdrResponse);
    } catch (e: any) {
      let msg = e?.message || "Çağrı istatistikleri alınamadı.";
      if (e?.context instanceof Response) {
        try {
          const p = await e.context.clone().json();
          if (p?.error) msg = p.error;
        } catch {
          /* ignore */
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(rangeDays);
  }, [rangeDays, fetchStats]);

  const s = data?.summary;
  const answerRate = useMemo(() => {
    if (!s || num(s.total) === 0) return 0;
    return Math.round((num(s.answered) / num(s.total)) * 100);
  }, [s]);

  const chartData = useMemo(
    () =>
      (data?.daily ?? []).map((d) => ({
        gun: format(new Date(d.gun), "d MMM", { locale: tr }),
        Gelen: num(d.gelen),
        Giden: num(d.giden),
        Dakika: num(d.dakika),
        Cevaplanan: num(d.cevaplanan),
      })),
    [data],
  );

  return (
    <div className="space-y-6">
      {/* Aralık seçici */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Çağrı İstatistikleri</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-card p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  rangeDays === r.days
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchStats(rangeDays)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Çağrı verisi alınamadı</p>
              <p className="text-muted-foreground">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                FreePBX sunucusundaki <code>freepbx-ext.php</code> dosyasının güncel sürümünün yüklü olduğundan emin olun.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Ana metrikler */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Clock}
              label="Toplam Görüşme Süresi"
              value={fmtMinutes(num(s?.total_billsec) / 60)}
              sub={`Ortalama %${answerRate} cevaplanma`}
              tone="bg-violet-100 text-violet-600"
            />
            <StatCard
              icon={Users}
              label="Görüşülen Kişi"
              value={num(s?.talked_people)}
              sub={`${num(s?.answered)} cevaplanan çağrı`}
              tone="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              icon={PhoneOutgoing}
              label="Aranan Kişi (Giden)"
              value={num(s?.outbound_people)}
              sub={`${num(s?.outbound)} giden arama`}
              tone="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={PhoneIncoming}
              label="Bizi Arayan (Gelen)"
              value={num(s?.inbound_people)}
              sub={`${num(s?.inbound)} gelen arama`}
              tone="bg-amber-100 text-amber-600"
            />
          </div>

          {/* İkincil metrikler */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard icon={PhoneCall} label="Toplam Çağrı" value={num(s?.total)} tone="bg-slate-100 text-slate-600" />
            <StatCard icon={CheckCircle2} label="Cevaplanan" value={num(s?.answered)} tone="bg-green-100 text-green-600" />
            <StatCard icon={AlertCircle} label="Cevapsız" value={num(s?.no_answer)} tone="bg-red-100 text-red-600" />
            <StatCard icon={PhoneCall} label="Meşgul" value={num(s?.busy)} tone="bg-orange-100 text-orange-600" />
            <StatCard icon={PhoneCall} label="Dahili Arama" value={num(s?.internal_calls)} tone="bg-cyan-100 text-cyan-600" />
          </div>

          {/* Grafikler */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Günlük Gelen / Giden Çağrılar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Gelen" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Giden" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Günlük Görüşme Dakikası</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="dakikaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(258 90% 66%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(258 90% 66%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} dk`, "Dakika"]} />
                    <Area
                      type="monotone"
                      dataKey="Dakika"
                      stroke="hsl(258 90% 66%)"
                      fill="url(#dakikaFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Dahili bazlı kırılım */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dahili Bazlı Performans</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.by_extension?.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Bu aralıkta veri yok.</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dahili</TableHead>
                        <TableHead className="text-right">Toplam</TableHead>
                        <TableHead className="text-right">Giden</TableHead>
                        <TableHead className="text-right">Gelen</TableHead>
                        <TableHead className="text-right">Cevaplanan</TableHead>
                        <TableHead className="text-right">Dakika</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.by_extension ?? []).map((e) => (
                        <TableRow key={e.ext}>
                          <TableCell className="font-mono font-medium">{e.ext}</TableCell>
                          <TableCell className="text-right">{num(e.toplam)}</TableCell>
                          <TableCell className="text-right text-blue-600">{num(e.giden)}</TableCell>
                          <TableCell className="text-right text-amber-600">{num(e.gelen)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{num(e.cevaplanan)}</TableCell>
                          <TableCell className="text-right">{fmtMinutes(num(e.dakika))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danışan Yönlendirmeleri */}
          {(() => {
            const raw = data?.transfers ?? [];
            const sorted = [...raw].sort(
              (a, b) => parsePbxDate(b.calldate).getTime() - parsePbxDate(a.calldate).getTime(),
            );
            type T = (typeof sorted)[number] & { deneme?: number };

            // 1) AYNI ÇAĞRININ PBX bacakları (leg) tek çağrıya indirgenir.
            // Asterisk bir çağrıyı (gelen bacak + Local kanal + uzmana giden bacak)
            // birden fazla CDR satırı olarak kaydeder. Aynı linkedid ya da
            // 90 saniye içindeki aynı danışan-uzman kaydı tek çağrı sayılır.
            const LEG_WINDOW = 90 * 1000;
            const calls: T[] = [];
            for (const t of sorted) {
              const sameCall = calls.find((x) => {
                if (phoneKey(x.musteri) !== phoneKey(t.musteri)) return false;
                if (String(x.uzman_ext) !== String(t.uzman_ext)) return false;
                if (x.linkedid && t.linkedid) return String(x.linkedid) === String(t.linkedid);
                return (
                  Math.abs(parsePbxDate(x.calldate).getTime() - parsePbxDate(t.calldate).getTime()) <= LEG_WINDOW
                );
              });
              if (!sameCall) {
                calls.push({ ...t });
                continue;
              }
              // Bacaklardan biri açıldıysa çağrı "açıldı" kabul edilir
              if (num(t.acti) === 1 && num(sameCall.acti) !== 1) {
                sameCall.acti = t.acti;
                sameCall.disposition = t.disposition;
              }
              if (num(t.sure) > num(sameCall.sure)) sameCall.sure = t.sure;
              if (!sameCall.recordingfile && t.recordingfile) sameCall.recordingfile = t.recordingfile;
            }

            // 2) Aynı danışan + aynı uzmana 30 dakika içindeki GERÇEK tekrar aramalar
            // tek satırda birleştirilir; deneme sayısı çağrı adedini gösterir.
            const groups: T[] = [];
            const WINDOW = 30 * 60 * 1000;
            for (const t of calls) {
              const g = groups.find(
                (x) =>
                  phoneKey(x.musteri) === phoneKey(t.musteri) &&
                  String(x.uzman_ext) === String(t.uzman_ext) &&
                  Math.abs(parsePbxDate(x.calldate).getTime() - parsePbxDate(t.calldate).getTime()) <= WINDOW,
              );
              if (!g) {
                groups.push({ ...t, deneme: 1 });
                continue;
              }
              g.deneme = (g.deneme ?? 1) + 1;
              if (num(t.acti) === 1 && num(g.acti) !== 1) {
                g.acti = t.acti;
                g.sure = t.sure;
                g.calldate = t.calldate;
                g.recordingfile = t.recordingfile ?? g.recordingfile;
              }
              if (!g.recordingfile && t.recordingfile) g.recordingfile = t.recordingfile;
            }
            const transfers = groups;
            const acti = transfers.filter((t) => num(t.acti) === 1).length;
            const acilmadi = transfers.length - acti;
            const toplamDk = transfers
              .filter((t) => num(t.acti) === 1)
              .reduce((sum, t) => sum + num(t.sure) / 60, 0);
            const initials = (name: string) =>
              name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("");


            return (
              <Card className="overflow-hidden border-primary/20 shadow-sm">
                <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/[0.03] to-transparent">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <PhoneForwarded className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Danışan Yönlendirmeleri</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Hangi danışan hangi uzmana yönlendirildi, uzman açtı mı, kaç dakika konuştular.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> {acti} Açıldı
                      </Badge>
                      <Badge variant="outline" className="gap-1 border-red-300 bg-red-50 text-red-700">
                        <XCircle className="h-3 w-3" /> {acilmadi} Açılmadı
                      </Badge>
                      <Badge variant="outline" className="gap-1 border-violet-300 bg-violet-50 text-violet-700">
                        <Clock className="h-3 w-3" /> {fmtMinutes(toplamDk)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {transfers.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Bu aralıkta yönlendirme kaydı yok.</p>
                  ) : (
                    <div className="max-h-[28rem] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-card">
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Tarih</TableHead>
                            <TableHead>Danışan</TableHead>
                            <TableHead>Uzman</TableHead>
                            <TableHead>Açtı mı?</TableHead>
                            <TableHead className="text-right">Görüşme</TableHead>
                            <TableHead className="w-[240px]">Ses Kaydı</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transfers.map((t, i) => {
                            const isOpen = num(t.acti) === 1;
                            const uzmanAdi = extMap[String(t.uzman_ext)];
                            const danisanAdi = leadMap[phoneKey(t.musteri)];
                            return (
                              <TableRow key={i} className="group">
                                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                  {formatPbxDate(t.calldate)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <p className="font-medium">{danisanAdi || "İsim bulunamadı"}</p>
                                  <span className="font-mono text-xs text-muted-foreground">{t.musteri}</span>
                                </TableCell>

                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                        uzmanAdi
                                          ? "bg-primary/10 text-primary"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {uzmanAdi ? initials(uzmanAdi) : <User className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0 leading-tight">
                                      <p className="truncate text-sm font-medium">
                                        {uzmanAdi || "Bilinmeyen uzman"}
                                      </p>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        Dahili {t.uzman_ext}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isOpen ? (
                                    <Badge className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50" variant="outline">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Açtı
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Badge className="gap-1 border-red-300 bg-red-50 text-red-700 hover:bg-red-50" variant="outline">
                                        <XCircle className="h-3.5 w-3.5" /> Açmadı
                                      </Badge>
                                      {(t.deneme ?? 1) > 1 && (
                                        <span className="text-xs text-muted-foreground">{t.deneme} deneme</span>
                                      )}
                                    </div>
                                  )}
                                </TableCell>

                                <TableCell className="text-right text-sm font-medium">
                                  {isOpen ? fmtMinutes(num(t.sure) / 60) : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}


          {/* Son çağrılar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Son Çağrılar</CardTitle>
              <p className="text-xs text-muted-foreground">
                Aranan numaraların yanında danışan yönlendirme sistemindeki ad soyad bilgisi gösterilir.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {(data?.recent?.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Bu aralıkta çağrı kaydı yok.</p>
              ) : (
                <div className="max-h-[42rem] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[130px]">Tarih</TableHead>
                        <TableHead className="w-[110px]">Yön</TableHead>
                        <TableHead className="w-[180px]">Arayan</TableHead>
                        <TableHead>Aranan Danışan</TableHead>
                        <TableHead className="w-[100px] text-right">Süre</TableHead>
                        <TableHead className="w-[140px]">Durum</TableHead>
                        <TableHead className="w-[240px]">Ses Kaydı</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.recent ?? []).map((r, i) => {
                        const answered = (r.disposition || "").toUpperCase() === "ANSWERED";
                        const arananAdi = leadMap[phoneKey(r.dst)];
                        const arayanAdi = leadMap[phoneKey(r.src)];
                        return (
                          <TableRow key={i}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {formatPbxDate(r.calldate)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  r.yon === "gelen"
                                    ? "border-amber-300 text-amber-700"
                                    : r.yon === "giden"
                                    ? "border-blue-300 text-blue-700"
                                    : "border-cyan-300 text-cyan-700"
                                }
                              >
                                {r.yon === "gelen" ? "Gelen" : r.yon === "giden" ? "Giden" : "Diğer"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {arayanAdi && <p className="font-medium">{arayanAdi}</p>}
                              <span className="font-mono text-xs text-muted-foreground">{r.src}</span>
                            </TableCell>
                            <TableCell className="text-sm">
                              <p className="font-medium">{arananAdi || "İsim bulunamadı"}</p>
                              <span className="font-mono text-xs text-muted-foreground">{r.dst}</span>
                            </TableCell>
                            <TableCell className="text-right text-sm">{fmtMinutes(num(r.billsec) / 60)}</TableCell>
                            <TableCell>
                              <span
                                className={`text-xs font-medium ${
                                  answered ? "text-emerald-600" : "text-muted-foreground"
                                }`}
                              >
                                {dispositionTr(r.disposition)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
};

export default PbxCallStats;
