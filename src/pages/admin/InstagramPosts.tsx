import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Download, Search, Sparkles, ImageIcon, AlertCircle } from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";

type Status = "pending" | "processing" | "ready" | "failed";

interface PostRow {
  id: string;
  specialist_id: string;
  cover_url: string | null;
  about_url: string | null;
  expertise_url: string | null;
  status: Status;
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
  specialist?: {
    id: string;
    name: string;
    specialty: string | null;
    profile_picture: string | null;
    is_active: boolean;
  };
}

const statusMeta: Record<Status, { label: string; className: string }> = {
  pending:    { label: "Bekliyor",     className: "bg-slate-200 text-slate-700" },
  processing: { label: "Üretiliyor",   className: "bg-amber-100 text-amber-700 animate-pulse" },
  ready:      { label: "Hazır",        className: "bg-emerald-100 text-emerald-700" },
  failed:     { label: "Hata",         className: "bg-rose-100 text-rose-700" },
};

export default function InstagramPosts() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("specialist_instagram_posts")
      .select(`
        *,
        specialist:specialists!specialist_instagram_posts_specialist_id_fkey (
          id, name, specialty, profile_picture, is_active
        )
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error("Liste alınamadı: " + error.message);
    } else {
      setRows((data as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Realtime: status changes
    const ch = supabase
      .channel("sip_changes")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "specialist_instagram_posts" },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regenerate = async (specialistId: string) => {
    setBusyId(specialistId);
    try {
      const { error } = await supabase.functions.invoke("generate-specialist-instagram-posts", {
        body: { specialistId, force: true },
      });
      if (error) throw error;
      toast.success("Üretim başlatıldı. Görseller 1-2 dk içinde hazır olacak.");
      await load();
    } catch (e: any) {
      toast.error("Üretim başarısız: " + (e?.message ?? e));
    } finally {
      setBusyId(null);
    }
  };

  const backfillAll = async () => {
    if (!confirm("Tüm aktif uzmanlar için Instagram görselleri üretilecek. Devam edilsin mi? (Bu işlem dakikalar sürebilir)")) return;
    setBackfilling(true);
    try {
      const { data: specs } = await supabase
        .from("specialists")
        .select("id")
        .eq("is_active", true);

      if (!specs?.length) { toast.error("Aktif uzman yok"); return; }

      // Skip those already ready
      const { data: ready } = await supabase
        .from("specialist_instagram_posts")
        .select("specialist_id")
        .eq("status", "ready");
      const readySet = new Set((ready ?? []).map(r => r.specialist_id));
      const queue = specs.filter(s => !readySet.has(s.id));

      toast.info(`${queue.length} uzman için üretim başlatılıyor...`);

      // 4'lü paralel batch
      const BATCH = 4;
      for (let i = 0; i < queue.length; i += BATCH) {
        const slice = queue.slice(i, i + BATCH);
        await Promise.all(slice.map(s =>
          supabase.functions.invoke("generate-specialist-instagram-posts", {
            body: { specialistId: s.id },
          }).catch(() => null),
        ));
      }
      toast.success("Toplu üretim tamamlandı");
      await load();
    } finally {
      setBackfilling(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u; a.download = filename; document.body.appendChild(a);
      a.click(); a.remove(); URL.revokeObjectURL(u);
    } catch {
      toast.error("İndirilemedi");
    }
  };

  const filtered = rows.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const n = (r.specialist?.name ?? "").toLowerCase();
      const s = (r.specialist?.specialty ?? "").toLowerCase();
      if (!n.includes(q) && !s.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 md:p-8">
      <Helmet><title>Instagram Paylaşımları | Admin</title></Helmet>
      <AdminBackButton />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-pink-500" />
              Instagram Paylaşımları
            </h1>
            <p className="text-slate-600 mt-1">
              Aktif olan her uzman için otomatik 3 Instagram görseli (Kapak / Hakkında / Uzmanlık).
            </p>
          </div>
          <Button onClick={backfillAll} disabled={backfilling} variant="default">
            {backfilling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Tüm aktif uzmanlar için üret
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Uzman ara..." className="pl-9"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all","ready","processing","pending","failed"] as const).map(s => (
                <Button key={s} size="sm"
                  variant={filter === s ? "default" : "outline"}
                  onClick={() => setFilter(s)}>
                  {s === "all" ? "Tümü" : statusMeta[s as Status].label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
            Henüz kayıt yok. Bir uzman aktifleşince otomatik üretilir.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(row => {
              const meta = statusMeta[row.status];
              const isReady = row.status === "ready";
              return (
                <Card key={row.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {row.specialist?.profile_picture
                      ? <img src={row.specialist.profile_picture} alt=""
                          className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                      : <div className="w-12 h-12 rounded-full bg-slate-200" />}
                    <div className="flex-1">
                      <CardTitle className="text-base">{row.specialist?.name ?? "—"}</CardTitle>
                      <p className="text-sm text-slate-500">{row.specialist?.specialty}</p>
                    </div>
                    <Badge className={meta.className}>{meta.label}</Badge>
                    <Button size="sm" variant="outline"
                      disabled={busyId === row.specialist_id || row.status === "processing"}
                      onClick={() => regenerate(row.specialist_id)}>
                      {busyId === row.specialist_id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <RefreshCcw className="h-4 w-4" />}
                      <span className="ml-2">Yeniden Üret</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {row.status === "failed" && row.error_message && (
                      <div className="flex items-start gap-2 text-sm text-rose-600 mb-3 p-3 bg-rose-50 rounded-md">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        {row.error_message}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(["cover","about","expertise"] as const).map(k => {
                        const url = (row as any)[`${k}_url`] as string | null;
                        const labels = { cover: "Kapak", about: "Hakkında", expertise: "Uzmanlık Alanları" };
                        return (
                          <div key={k} className="space-y-2">
                            <p className="text-xs font-medium text-slate-600">{labels[k]}</p>
                            <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden border">
                              {url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt={labels[k]}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    loading="lazy" />
                                </a>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  {row.status === "processing"
                                    ? <Loader2 className="h-6 w-6 animate-spin" />
                                    : <ImageIcon className="h-8 w-8 opacity-40" />}
                                </div>
                              )}
                            </div>
                            {isReady && url && (
                              <Button size="sm" variant="ghost" className="w-full"
                                onClick={() => downloadImage(url,
                                  `${(row.specialist?.name ?? "uzman").replace(/\s+/g,"-").toLowerCase()}-${k}.png`)}>
                                <Download className="h-3 w-3 mr-1" /> İndir
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
