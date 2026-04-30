import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Loader2, RefreshCw, FileText, CheckCircle2, ArrowLeft, Search, Wand2, ExternalLink, UserCheck } from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";

interface SpecialistRow {
  id: string;
  name: string;
  specialty: string | null;
  city: string | null;
  is_active: boolean;
  user_id: string | null;
  blog_count: number;
  latest_blog_slug?: string | null;
}

const SpecialistBlogStatus = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SpecialistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genId, setGenId] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [tab, setTab] = useState<"missing" | "done">("missing");

  const loadAll = async () => {
    setLoading(true);
    try {
      // Aktif uzmanlar
      const { data: specs, error } = await supabase
        .from("specialists")
        .select("id, name, specialty, city, is_active, user_id")
        .eq("is_active", true)
        .order("name")
        .range(0, 4999);
      if (error) throw error;

      // Blog sayıları (specialist_id ile)
      const { data: blogs } = await supabase
        .from("blog_posts")
        .select("specialist_id, slug, published_at")
        .not("specialist_id", "is", null)
        .order("published_at", { ascending: false })
        .range(0, 9999);

      const map = new Map<string, { count: number; slug: string | null }>();
      (blogs || []).forEach((b: any) => {
        const cur = map.get(b.specialist_id) || { count: 0, slug: null };
        cur.count += 1;
        if (!cur.slug) cur.slug = b.slug;
        map.set(b.specialist_id, cur);
      });

      const rows: SpecialistRow[] = (specs || []).map((s: any) => {
        const m = map.get(s.id) || { count: 0, slug: null };
        return { ...s, blog_count: m.count, latest_blog_slug: m.slug };
      });
      setItems(rows);
    } catch (e: any) {
      toast.error(e?.message || "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const generateForOne = async (id: string, name: string): Promise<boolean> => {
    setGenId(id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-specialist-blog", {
        body: { specialistId: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any)?.skipped) {
        toast.info(`${name}: zaten blogu var`);
      } else {
        toast.success(`✓ ${name} (${(data as any).word_count} kelime)`);
      }
      return true;
    } catch (e: any) {
      toast.error(`${name}: ${e?.message || "hata"}`);
      return false;
    } finally {
      setGenId(null);
    }
  };

  const runBatch = async () => {
    const missing = items.filter(i => i.blog_count === 0);
    if (missing.length === 0) return toast.info("Tüm aktif uzmanların blogu var");
    if (!confirm(`${missing.length} aktif uzman için sırayla blog üretilecek. Bu uzun sürebilir. Devam edilsin mi?`)) return;
    setBatchRunning(true);
    let ok = 0, fail = 0;
    for (const it of missing) {
      const ok2 = await generateForOne(it.id, it.name);
      if (ok2) ok++; else fail++;
      await new Promise(r => setTimeout(r, 2500));
    }
    setBatchRunning(false);
    await loadAll();
    toast.success(`Tamamlandı: ${ok} başarılı, ${fail} başarısız`);
  };

  const filtered = items
    .filter(i => tab === "missing" ? i.blog_count === 0 : i.blog_count > 0)
    .filter(i => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (i.name || "").toLowerCase().includes(q) || (i.specialty || "").toLowerCase().includes(q);
    });

  const missingCount = items.filter(i => i.blog_count === 0).length;
  const doneCount = items.filter(i => i.blog_count > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40">
      <Helmet><title>Uzman Blog Durumu - Admin</title></Helmet>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <AdminBackButton />

        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-purple-600" />
              Uzman Blog Durumu
            </h1>
            <p className="text-slate-600 mt-2 max-w-3xl">
              Aktif uzmanların blog yazısı durumu. Blogu olmayan uzmanlar için AI ile uzmanın profil ve branş bilgilerine göre 600-750 kelimelik özgün blog yazısı üretilir ve otomatik yayınlanır.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/divan_paneli/seo-content")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> SEO İçerik
            </Button>
            <Button variant="outline" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Yenile
            </Button>
          </div>
        </div>

        {/* Tab */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "missing" ? "default" : "outline"}
            onClick={() => setTab("missing")}
            className={tab === "missing" ? "bg-gradient-to-r from-amber-500 to-orange-500" : ""}
          >
            Blogu Olmayanlar ({missingCount})
          </Button>
          <Button
            variant={tab === "done" ? "default" : "outline"}
            onClick={() => setTab("done")}
            className={tab === "done" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : ""}
          >
            Blogları Yapılan Uzmanlar ({doneCount})
          </Button>
        </div>

        {/* Toolbar */}
        <Card className="mb-4">
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="İsim veya branş ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {tab === "missing" && (
              <Button
                onClick={runBatch}
                disabled={batchRunning || missingCount === 0}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {batchRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Bekleyenleri Toplu Üret ({missingCount})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {tab === "missing" ? "Blogu Olmayan Aktif Uzmanlar" : "Blogu Yapılan Aktif Uzmanlar"}
            </CardTitle>
            <CardDescription>
              {tab === "missing"
                ? "Aşağıdaki uzmanlar için 'Blog Üret' butonuyla AI özgün yazı oluşturup yayınlar."
                : "Bu uzmanlar için en az 1 blog yazısı yayında."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{tab === "missing" ? "Tüm aktif uzmanların blogu var 🎉" : "Henüz blog yazısı yapılan uzman yok"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((it) => (
                  <Card key={it.id} className={`hover:shadow-md transition-all ${tab === "missing" ? "border-amber-200" : "border-emerald-200 bg-emerald-50/30"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{it.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {it.specialty || "—"}{it.city ? ` · ${it.city}` : ""}
                          </div>
                        </div>
                        {tab === "done" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />{it.blog_count}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Blog yok</Badge>
                        )}
                      </div>

                      {tab === "missing" ? (
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          disabled={genId === it.id || batchRunning}
                          onClick={async () => { await generateForOne(it.id, it.name); await loadAll(); }}
                        >
                          {genId === it.id ? (
                            <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Üretiliyor...</>
                          ) : (
                            <><Wand2 className="h-3.5 w-3.5 mr-1" /> Blog Üret</>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => it.latest_blog_slug && window.open(`/blog/${it.latest_blog_slug}`, "_blank")}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Blog'u Gör
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpecialistBlogStatus;
