import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Sparkles, Loader2, ExternalLink, Wand2, Plus, RefreshCw, FileText, CheckCircle2, AlertCircle, Clock, CalendarDays } from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";

interface Branch {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  category: string | null;
}

interface Keyword {
  id: string;
  branch_id: string;
  main_keyword: string;
  related_keywords: string[];
  search_intent: string | null;
  difficulty: string | null;
  content_status: "pending" | "generating" | "published" | "failed";
  blog_post_id: string | null;
  generated_at: string | null;
  error_message: string | null;
  priority: number;
}

const STATUS_LABELS: Record<string, { label: string; variant: any; icon: any }> = {
  pending: { label: "Beklemede", variant: "secondary", icon: Clock },
  generating: { label: "Üretiliyor...", variant: "default", icon: Loader2 },
  published: { label: "Yayınlandı", variant: "default", icon: CheckCircle2 },
  failed: { label: "Başarısız", variant: "destructive", icon: AlertCircle },
};

const SEOContentManagement = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [keywords, setKeywords] = useState<Record<string, Keyword[]>>({});
  const [activeBranch, setActiveBranch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState<string | null>(null);

  // Add keywords dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addBranchId, setAddBranchId] = useState<string>("");
  const [mainKeywordsText, setMainKeywordsText] = useState("");
  const [expanding, setExpanding] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const { data: br, error: brErr } = await supabase
      .from("seo_branches")
      .select("*")
      .order("sort_order")
      .range(0, 4999);
    if (brErr) console.error("seo_branches load error:", brErr);
    const list = (br || []) as Branch[];
    setBranches(list);
    if (list.length && !activeBranch) setActiveBranch(list[0].id);

    const { data: kw, error: kwErr } = await supabase
      .from("seo_keywords")
      .select("*")
      .order("priority")
      .order("created_at")
      .range(0, 9999);
    if (kwErr) console.error("seo_keywords load error:", kwErr);
    const grouped: Record<string, Keyword[]> = {};
    (kw || []).forEach((k: any) => {
      grouped[k.branch_id] = grouped[k.branch_id] || [];
      grouped[k.branch_id].push(k as Keyword);
    });
    setKeywords(grouped);
    console.log(`Loaded ${list.length} branches and ${(kw || []).length} keywords`);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleExpand = async () => {
    if (!addBranchId) return toast.error("Branş seçin");
    const lines = mainKeywordsText.split("\n").map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) return toast.error("En az 1 anahtar kelime girin");
    if (lines.length > 25) return toast.error("Maksimum 25 kelime");

    setExpanding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-expand-keywords", {
        body: { branchId: addBranchId, mainKeywords: lines },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`${(data as any).count} anahtar kelime eklendi (her biri için 7-8 alt kelime ile)`);
      setMainKeywordsText("");
      setAddOpen(false);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Hata");
    } finally {
      setExpanding(false);
    }
  };

  // AI ile otomatik 20 ana kelime + alt kelime üret
  const handleAutoGenerate = async (branchId: string, branchName: string) => {
    if (!confirm(`"${branchName}" branşı için AI 20 ana anahtar kelime + her birine 7-8 alt kelime üretecek (toplam ~150 kelime). Bu kelimeler en yüksek trafik potansiyeli olanlardan seçilecek. Devam edilsin mi?`)) return;
    setAutoGenLoading(branchId);
    try {
      const { data, error } = await supabase.functions.invoke("seo-expand-keywords", {
        body: { branchId, autoGenerate: true, count: 20 },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`✨ ${(data as any).count} anahtar kelime AI tarafından üretildi`);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message || "AI üretim hatası");
    } finally {
      setAutoGenLoading(null);
    }
  };

  const generateOne = async (keywordId: string): Promise<boolean> => {
    setGenLoading(keywordId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("seo-generate-content", {
        body: { keywordId, authorId: user?.id, authorName: "Editör" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("İçerik oluşturuldu ve yayınlandı");
      return true;
    } catch (e: any) {
      toast.error(e?.message || "İçerik üretilemedi");
      return false;
    } finally {
      setGenLoading(null);
      await loadAll();
    }
  };

  const runBatch = async (branchId: string) => {
    const pending = (keywords[branchId] || []).filter(k => k.content_status === "pending");
    if (pending.length === 0) return toast.info("Bu branşta üretilecek bekleyen kelime yok");
    if (!confirm(`${pending.length} adet içerik sırayla üretilecek. Bu işlem uzun sürebilir. Devam edilsin mi?`)) return;

    setBatchRunning(true);
    let ok = 0, fail = 0;
    for (const k of pending) {
      const success = await generateOne(k.id);
      if (success) ok++; else fail++;
      // Cool-down to avoid rate limits
      await new Promise(r => setTimeout(r, 2500));
    }
    setBatchRunning(false);
    toast.success(`Tamamlandı: ${ok} başarılı, ${fail} başarısız`);
  };

  const stats = (branchId: string) => {
    const list = keywords[branchId] || [];
    return {
      total: list.length,
      published: list.filter(k => k.content_status === "published").length,
      pending: list.filter(k => k.content_status === "pending").length,
      failed: list.filter(k => k.content_status === "failed").length,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40">
      <Helmet><title>SEO İçerik Yönetimi - Admin</title></Helmet>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <AdminBackButton />

        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              SEO İçerik Üretim Merkezi
            </h1>
            <p className="text-slate-600 mt-2 max-w-3xl">
              Her branş kartındaki <strong>"AI ile 20 Kelime Üret"</strong> butonuna tıklayın → AI Türkiye'de en yüksek trafikli anahtar kelimeleri analiz edip ekler. Sonra branşa girip <strong>"Bekleyenleri Toplu Üret"</strong> ile 700+ kelimelik SEO içeriklerini otomatik blog'a yayınlayın.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/divan_paneli/seo-content/yayinlananlar")}>
              <CalendarDays className="h-4 w-4 mr-2" /> Yayınlananlar (Tarih Tarih)
            </Button>
            <Button variant="outline" onClick={() => navigate("/divan_paneli/seo-content/uzman-bloglari")}>
              <FileText className="h-4 w-4 mr-2" /> Uzman Blog Durumu
            </Button>
            <Button variant="outline" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Yenile
            </Button>
            <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" /> Yeni Anahtar Kelimeler
            </Button>
          </div>
        </div>

        {/* Otomatik yayın bilgi kartı */}
        <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-5 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2"><Clock className="h-5 w-5 text-emerald-700" /></div>
              <div>
                <h3 className="font-semibold text-emerald-900">Otomatik Yayın Aktif – Günde 10 Blog</h3>
                <p className="text-sm text-emerald-800 mt-1 max-w-2xl">
                  Sistem her gün <strong>08:00, 10:00, 12:00, 14:00, 15:00, 16:00, 18:00, 20:00, 22:00, 23:00</strong> saatlerinde otomatik olarak sıradaki bekleyen anahtar kelimeyi blog yazısına dönüştürüp yayınlar. Branş sırasına göre ilerler — bir branş bittiğinde diğerine geçer.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  toast.loading("Sıradaki blog üretiliyor...", { id: "auto-1" });
                  const { data, error } = await supabase.functions.invoke("seo-auto-publish-batch", { body: { count: 1 } });
                  if (error) throw error;
                  const r = data?.results?.[0];
                  if (r?.success) {
                    toast.success(`✓ ${r.branch}: ${r.keyword} (${r.word_count} kelime)`, { id: "auto-1" });
                    loadAll();
                  } else if (r?.skipped) {
                    toast.info("Bekleyen kelime kalmadı 🎉", { id: "auto-1" });
                  } else {
                    toast.error(r?.error || "Üretim başarısız", { id: "auto-1" });
                  }
                } catch (e: any) {
                  toast.error(e.message || "Hata", { id: "auto-1" });
                }
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" /> Şimdi 1 Tane Üret
            </Button>
          </CardContent>
        </Card>

        {/* Branch summary cards - grouped by category */}
        {(() => {
          const groups: Record<string, Branch[]> = {};
          branches.forEach(b => {
            const cat = b.category || "Diğer";
            (groups[cat] = groups[cat] || []).push(b);
          });
          const categoryOrder = Object.keys(groups).sort((a, b) => {
            const order = ["Psikoloji & Danışmanlık", "Danışmanlık", "Beslenme", "Fizik Tedavi", "Tıp Doktoru", "Çocuk Sağlığı", "Kadın Sağlığı", "Cilt & Estetik", "Kalp & Damar", "Beyin & Sinir", "Ortopedi", "Göz & KBB", "Sindirim & İç Organ", "Solunum", "Onkoloji", "Diş Hekimliği", "Diğer"];
            const ai = order.indexOf(a); const bi = order.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });
          return categoryOrder.map(cat => (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                <h2 className="font-bold text-slate-800">{cat}</h2>
                <span className="text-xs text-slate-500">({groups[cat].length} branş)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {groups[cat].map(b => {
                  const s = stats(b.id);
                  const pct = s.total > 0 ? Math.round((s.published / s.total) * 100) : 0;
                  const isAutoGen = autoGenLoading === b.id;
                  return (
                    <Card key={b.id} className={`transition-all hover:shadow-lg ${activeBranch === b.id ? "ring-2 ring-purple-500" : ""}`}>
                      <CardContent className="p-4">
                        <div onClick={() => { setActiveBranch(b.id); setTimeout(() => document.getElementById("active-branch-table")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }} className="cursor-pointer">
                          <div className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{b.name}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="font-mono">{s.published}/{s.total}</span>
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span>{pct}%</span>
                          </div>
                          {s.pending > 0 && <div className="text-xs text-amber-600 mt-1">{s.pending} bekliyor</div>}
                          {s.failed > 0 && <div className="text-xs text-red-600 mt-1">{s.failed} hata</div>}
                        </div>
                        {s.total === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3 text-xs h-8 border-purple-300 text-purple-700 hover:bg-purple-50"
                            disabled={isAutoGen}
                            onClick={(e) => { e.stopPropagation(); handleAutoGenerate(b.id, b.name); }}
                          >
                            {isAutoGen ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                            AI ile 20 Kelime Üret
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ));
        })()}

        {/* Active branch keywords */}
        {activeBranch && (
          <Card id="active-branch-table">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>{branches.find(b => b.id === activeBranch)?.name} - Anahtar Kelimeler ({(keywords[activeBranch] || []).length})</CardTitle>
                <CardDescription>Her satır bir ana kelime + 7-8 alt kelime grubudur. "İçerik Üret" butonu blog'a yayınlar.</CardDescription>
              </div>
              <Button
                onClick={() => runBatch(activeBranch)}
                disabled={batchRunning}
                variant="default"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                {batchRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Bekleyenleri Toplu Üret
              </Button>
            </CardHeader>
            <CardContent>
              {(keywords[activeBranch] || []).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Bu branş için henüz anahtar kelime eklenmemiş.</p>
                  <Button className="mt-4" onClick={() => { setAddBranchId(activeBranch); setAddOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> İlk Kelimeleri Ekle
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Ana Anahtar Kelime</TableHead>
                        <TableHead>Alt Kelimeler</TableHead>
                        <TableHead className="w-[120px]">Durum</TableHead>
                        <TableHead className="w-[200px] text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(keywords[activeBranch] || []).map(k => {
                        const sInfo = STATUS_LABELS[k.content_status];
                        const Icon = sInfo.icon;
                        const isLoading = genLoading === k.id;
                        return (
                          <TableRow key={k.id}>
                            <TableCell className="font-medium align-top">
                              <div>{k.main_keyword}</div>
                              <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                {k.search_intent && <span>{k.search_intent}</span>}
                                {k.difficulty && <span>· {k.difficulty}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-wrap gap-1">
                                {(k.related_keywords || []).map((r, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs font-normal">{r}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge variant={sInfo.variant} className="gap-1">
                                <Icon className={`h-3 w-3 ${k.content_status === "generating" ? "animate-spin" : ""}`} />
                                {sInfo.label}
                              </Badge>
                              {k.error_message && <div className="text-xs text-red-600 mt-1 max-w-[200px] line-clamp-2">{k.error_message}</div>}
                            </TableCell>
                            <TableCell className="text-right align-top">
                              {k.content_status === "published" && k.blog_post_id ? (
                                <Button size="sm" variant="outline" onClick={() => navigate(`/divan_paneli/blog`)}>
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Blog'da Gör
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => generateOne(k.id)}
                                  disabled={isLoading || batchRunning || k.content_status === "generating"}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                  {isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1" />}
                                  {k.content_status === "failed" ? "Tekrar Dene" : "İçerik Üret"}
                                </Button>
                              )}
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
        )}

        {/* Add keywords dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Anahtar Kelime Ekle (AI Genişletmeli)</DialogTitle>
              <DialogDescription>
                Her satıra 1 ana kelime yazın. AI her biri için Google'da aranan 7-8 long-tail alt kelime üretecek.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Branş</label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={addBranchId || activeBranch}
                  onChange={(e) => setAddBranchId(e.target.value)}>
                  <option value="">Seçin...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ana anahtar kelimeler (her satıra 1 tane, max 25)</label>
                <Textarea
                  rows={10}
                  placeholder={"depresyon belirtileri\nanksiyete ile başa çıkma\nonline psikolog\npanik atak nedir\n..."}
                  value={mainKeywordsText}
                  onChange={(e) => setMainKeywordsText(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Önerilen: Her branş için 20 ana kelime girin → AI 140-160 alt kelime üretir → her birinden 1 makale = 20 makale.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={expanding}>İptal</Button>
              <Button
                variant="outline"
                disabled={expanding || !addBranchId}
                onClick={async () => {
                  setAddOpen(false);
                  const br = branches.find(b => b.id === addBranchId);
                  if (br) await handleAutoGenerate(br.id, br.name);
                }}
                className="border-purple-400 text-purple-700 hover:bg-purple-50"
              >
                <Wand2 className="h-4 w-4 mr-2" /> AI Otomatik 20 Kelime Üret
              </Button>
              <Button onClick={handleExpand} disabled={expanding} className="bg-gradient-to-r from-purple-600 to-pink-600">
                {expanding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Manuel Listeyi Genişlet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SEOContentManagement;
