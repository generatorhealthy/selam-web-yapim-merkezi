import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Megaphone,
  Play,
  Pause,
  TrendingUp,
  Eye,
  MousePointerClick,
  Wallet,
  Sparkles,
  Plus,
  Search,
  AlertCircle,
  Target,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Campaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  spend_cap?: string;
  created_time: string;
  start_time?: string;
  stop_time?: string;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_amount?: string;
  optimization_goal?: string;
  start_time?: string;
  end_time?: string;
  targeting?: any;
}

interface Ad {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  creative?: {
    id: string;
    name?: string;
    title?: string;
    body?: string;
    thumbnail_url?: string;
    object_story_spec?: any;
  };
}

interface Insight {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  cpc?: string;
  ctr?: string;
  cpm?: string;
  actions?: { action_type: string; value: string }[];
  cost_per_action_type?: { action_type: string; value: string }[];
}

interface AISuggestion {
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: string[];
    interests: { name: string; audienceSizeHint?: string }[];
  };
  primaryText: string;
  headline: string;
  description: string;
  ctaButton: string;
  budgetRecommendation: { dailyBudgetTL: number; reason: string };
  platformRecommendations: string[];
}

const statusMeta: Record<string, { label: string; className: string; icon: any }> = {
  ACTIVE: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Play },
  PAUSED: { label: "Duraklatıldı", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Pause },
  DELETED: { label: "Silindi", className: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
  ARCHIVED: { label: "Arşivlendi", className: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
};

const objectiveLabels: Record<string, string> = {
  LEAD_GENERATION: "Potansiyel Müşteri",
  MESSAGES: "Mesajlaşma",
  LINK_CLICKS: "Tıklama",
  CONVERSIONS: "Dönüşüm",
  REACH: "Erişim",
  BRAND_AWARENESS: "Marka Bilinirliği",
  VIDEO_VIEWS: "Video Görüntüleme",
};

export default function AdsManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiForm, setAiForm] = useState({ specialty: "Psikolog", goal: "Yeni uzman kaydı", audienceNotes: "", tone: "profesyonel, güven veren" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISuggestion | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", objective: "LEAD_GENERATION" });
  const [createLoading, setCreateLoading] = useState(false);
  const [targetSearch, setTargetSearch] = useState("");
  const [targetResults, setTargetResults] = useState<any[]>([]);
  const [targetLoading, setTargetLoading] = useState(false);

  const invoke = async (body: object) => {
    const { data, error } = await supabase.functions.invoke("meta-ads-manager", { body });
    if (error) throw error;
    if (data && (data as any).error) throw new Error((data as any).error);
    return data;
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data: any = await invoke({ action: "list" });
      setCampaigns(data?.data || []);
    } catch (err: any) {
      toast.error("Kampanyalar alınamadı: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const data: any = await invoke({ action: "insights", level: "campaign" });
      setInsights(data?.data || []);
    } catch (err: any) {
      toast.error("Metrikler alınamadı: " + err.message);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadInsights();
  }, []);

  const toggleCampaign = async (c: Campaign) => {
    const next = c.effective_status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setBusyId(c.id);
    try {
      await invoke({ action: "toggleStatus", campaignId: c.id, status: next });
      toast.success(`Kampanya ${next === "ACTIVE" ? "aktif" : "duraklatıldı"}`);
      setCampaigns((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, effective_status: next, status: next } : x))
      );
    } catch (err: any) {
      toast.error("İşlem başarısız: " + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const data: any = await invoke({ action: "aiSuggestions", suggestions: aiForm });
      setAiResult(data);
      toast.success("AI önerileri hazır");
    } catch (err: any) {
      toast.error("AI öneri hatası: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!createForm.name) return;
    setCreateLoading(true);
    try {
      await invoke({ action: "createCampaign", name: createForm.name, objective: createForm.objective });
      toast.success("Kampanya oluşturuldu (duraklatılmış)");
      setCreateOpen(false);
      setCreateForm({ name: "", objective: "LEAD_GENERATION" });
      loadCampaigns();
    } catch (err: any) {
      toast.error("Kampanya oluşturulamadı: " + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const searchTargeting = async () => {
    if (!targetSearch) return;
    setTargetLoading(true);
    try {
      const data: any = await invoke({ action: "targetingSearch", q: targetSearch });
      setTargetResults(data?.data || []);
    } catch (err: any) {
      toast.error("Arama hatası: " + err.message);
    } finally {
      setTargetLoading(false);
    }
  };

  const totals = insights.reduce(
    (acc, i) => {
      acc.spend += parseFloat(i.spend || "0");
      acc.impressions += parseInt(i.impressions || "0", 10);
      acc.reach += parseInt(i.reach || "0", 10);
      acc.clicks += parseInt(i.clicks || "0", 10);
      return acc;
    },
    { spend: 0, impressions: 0, reach: 0, clicks: 0 }
  );

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const insightMap = new Map<string, Insight>();
  insights.forEach((i) => {
    if (i.campaign_id) insightMap.set(i.campaign_id, i);
  });

  return (
    <>
      <Helmet>
        <title>Reklam Birimi | Divan Panel</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AdminBackButton />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Reklam Birimi</h1>
                <p className="text-xs text-slate-500">Meta Ads Manager entegrasyonu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { loadCampaigns(); loadInsights(); }}>
                <RefreshCw className="w-4 h-4 mr-2" /> Yenile
              </Button>
              <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Sparkles className="w-4 h-4 mr-2" /> AI Öneri
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" /> AI Reklam Önerisi
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Branş / Hizmet</Label>
                        <Input value={aiForm.specialty} onChange={(e) => setAiForm({ ...aiForm, specialty: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Hedef</Label>
                        <Input value={aiForm.goal} onChange={(e) => setAiForm({ ...aiForm, goal: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Ek Hedef Kitle Notları</Label>
                      <Input value={aiForm.audienceNotes} onChange={(e) => setAiForm({ ...aiForm, audienceNotes: e.target.value })} placeholder="örn: İstanbul, 25-45 yaş, anksiyete sorunu" />
                    </div>
                    <div className="space-y-2">
                      <Label>Ton</Label>
                      <Input value={aiForm.tone} onChange={(e) => setAiForm({ ...aiForm, tone: e.target.value })} />
                    </div>
                    <Button onClick={generateAI} disabled={aiLoading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                      {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      AI İle Öneri Üret
                    </Button>
                    {aiResult && (
                      <div className="space-y-4 border rounded-xl p-4 bg-slate-50">
                        <div>
                          <div className="text-sm font-semibold text-slate-700 mb-1">Hedef Kitle</div>
                          <div className="text-sm text-slate-600">
                            Yaş: {aiResult.targeting.ageMin}-{aiResult.targeting.ageMax} · Cinsiyet: {aiResult.targeting.genders.join(", ")}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {aiResult.targeting.interests.map((i, idx) => (
                              <Badge key={idx} variant="outline" className="bg-white">{i.name}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700 mb-1">Reklam Metni</div>
                          <div className="bg-white border rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap">{aiResult.primaryText}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-700 mb-1">Başlık</div>
                            <div className="text-sm text-slate-600">{aiResult.headline}</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700 mb-1">Açıklama</div>
                            <div className="text-sm text-slate-600">{aiResult.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-700">Günlük Bütçe Önerisi</div>
                            <div className="text-sm text-slate-600">{aiResult.budgetRecommendation.dailyBudgetTL} TL</div>
                            <div className="text-xs text-slate-500">{aiResult.budgetRecommendation.reason}</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">CTA</div>
                            <div className="text-sm text-slate-600">{aiResult.ctaButton}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700 mb-1">Platform Önerileri</div>
                          <div className="flex flex-wrap gap-2">
                            {aiResult.platformRecommendations.map((p, idx) => (
                              <Badge key={idx} variant="secondary">{p}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Kampanya Oluştur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Yeni Kampanya Oluştur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Kampanya Adı</Label>
                      <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="örn: Eylül Uzman Kayıt Kampanyası" />
                    </div>
                    <div className="space-y-2">
                      <Label>Hedef</Label>
                      <Select value={createForm.objective} onValueChange={(v) => setCreateForm({ ...createForm, objective: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEAD_GENERATION">Potansiyel Müşteri</SelectItem>
                          <SelectItem value="MESSAGES">Mesajlaşma</SelectItem>
                          <SelectItem value="LINK_CLICKS">Trafik</SelectItem>
                          <SelectItem value="CONVERSIONS">Dönüşüm</SelectItem>
                          <SelectItem value="REACH">Erişim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>İptal</Button>
                    <Button onClick={createCampaign} disabled={createLoading || !createForm.name}>
                      {createLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Oluştur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Toplam Harcama" value={`${totals.spend.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`} />
            <StatCard icon={Eye} label="Gösterim" value={totals.impressions.toLocaleString("tr-TR")} />
            <StatCard icon={MousePointerClick} label="Tıklama" value={totals.clicks.toLocaleString("tr-TR")} />
            <StatCard icon={TrendingUp} label="Erişim" value={totals.reach.toLocaleString("tr-TR")} />
          </div>

          <Tabs defaultValue="campaigns">
            <TabsList>
              <TabsTrigger value="campaigns">Kampanyalar</TabsTrigger>
              <TabsTrigger value="insights">Performans Metrikleri</TabsTrigger>
              <TabsTrigger value="targeting">Hedef Kitle Arama</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">Kampanyalar</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input className="pl-9" placeholder="Kampanya ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kampanya</TableHead>
                            <TableHead>Hedef</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">Günlük Bütçe</TableHead>
                            <TableHead>Harcama</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCampaigns.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                Kampanya bulunamadı.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredCampaigns.map((c) => {
                              const meta = statusMeta[c.effective_status || c.status] || statusMeta.PAUSED;
                              const StatusIcon = meta.icon;
                              const insight = insightMap.get(c.id);
                              return (
                                <TableRow key={c.id}>
                                  <TableCell>
                                    <div className="font-medium text-sm">{c.name}</div>
                                    <div className="text-xs text-slate-500">ID: {c.id}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {objectiveLabels[c.objective] || c.objective}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`${meta.className} flex items-center gap-1 w-fit`}>
                                      <StatusIcon className="w-3 h-3" /> {meta.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {c.daily_budget ? `${(parseInt(c.daily_budget, 10) / 100).toLocaleString("tr-TR")} ₺` : "—"}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {insight ? `${parseFloat(insight.spend).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺` : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleCampaign(c)}
                                      disabled={busyId === c.id}
                                    >
                                      {busyId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                                        {c.effective_status === "ACTIVE" ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                                        {c.effective_status === "ACTIVE" ? "Duraklat" : "Aktif Et"}
                                      </>}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Son 30 Gün Performans</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {insightsLoading ? (
                    <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kampanya</TableHead>
                            <TableHead className="text-right">Harcama</TableHead>
                            <TableHead className="text-right">Gösterim</TableHead>
                            <TableHead className="text-right">Tıklama</TableHead>
                            <TableHead className="text-right">CTR</TableHead>
                            <TableHead className="text-right">CPC</TableHead>
                            <TableHead>Sonuç</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {insights.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                Henüz metrik verisi yok.
                              </TableCell>
                            </TableRow>
                          ) : (
                            insights.map((i) => (
                              <TableRow key={i.campaign_id || i.adset_id}>
                                <TableCell>
                                  <div className="font-medium text-sm">{i.campaign_name || i.adset_name}</div>
                                </TableCell>
                                <TableCell className="text-right">{parseFloat(i.spend).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺</TableCell>
                                <TableCell className="text-right">{parseInt(i.impressions, 10).toLocaleString("tr-TR")}</TableCell>
                                <TableCell className="text-right">{parseInt(i.clicks, 10).toLocaleString("tr-TR")}</TableCell>
                                <TableCell className="text-right">{i.ctr ? `%${(parseFloat(i.ctr) * 100).toFixed(2)}` : "—"}</TableCell>
                                <TableCell className="text-right">{i.cpc ? `${parseFloat(i.cpc).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺` : "—"}</TableCell>
                                <TableCell>
                                  {i.actions && i.actions.length > 0 ? (
                                    <div className="text-xs text-slate-600">
                                      {i.actions.slice(0, 2).map((a) => `${a.action_type}: ${a.value}`).join(", ")}
                                    </div>
                                  ) : "—"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="targeting" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" /> Hedef Kitle İlgi Arama
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="örn: psikoloji, anksiyete, terapi" value={targetSearch} onChange={(e) => setTargetSearch(e.target.value)} />
                    <Button onClick={searchTargeting} disabled={targetLoading}>
                      {targetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {targetResults.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>İlgi Adı</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Kitle Boyutu</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {targetResults.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium text-sm">{r.name}</TableCell>
                              <TableCell className="text-sm text-slate-600">{r.topic || "—"}</TableCell>
                              <TableCell className="text-right text-sm">{r.audience_size ? r.audience_size.toLocaleString("tr-TR") : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Bütçe güncelleme ve reklam seti detayları için Ads Manager kullanılabilir; bu panel temel yönetim ve AI önerileri sunar.
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-bold mt-1">{value}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
