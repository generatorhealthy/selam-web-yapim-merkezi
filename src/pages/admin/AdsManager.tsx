import { Fragment, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
  Trash2,
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

  // --- editing state ---
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [adSets, setAdSets] = useState<Record<string, AdSet[]>>({});
  const [adSetsLoading, setAdSetsLoading] = useState<Record<string, boolean>>({});
  const [expandedAdSet, setExpandedAdSet] = useState<Record<string, boolean>>({});
  const [ads, setAds] = useState<Record<string, Ad[]>>({});
  const [adsLoading, setAdsLoading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({ name: "", status: "ACTIVE", dailyBudget: "", lifetimeBudget: "", spendCap: "" });

  const [editAdSet, setEditAdSet] = useState<{ adSet: AdSet; campaignId: string } | null>(null);
  const [adSetForm, setAdSetForm] = useState({ name: "", status: "ACTIVE", dailyBudget: "", lifetimeBudget: "", ageMin: "", ageMax: "", genders: "all", startTime: "", endTime: "" });

  const [editAd, setEditAd] = useState<{ ad: Ad; adSetId: string } | null>(null);
  const [adForm, setAdForm] = useState({ name: "", status: "ACTIVE", message: "", headline: "", description: "", link: "" });
  const [adCreativeLoading, setAdCreativeLoading] = useState(false);

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

  // ---------- ad set / ad loading ----------
  const loadAdSets = async (campaignId: string) => {
    setAdSetsLoading((p) => ({ ...p, [campaignId]: true }));
    try {
      const data: any = await invoke({ action: "listAdSets", campaignId });
      setAdSets((p) => ({ ...p, [campaignId]: data?.data || [] }));
    } catch (err: any) {
      toast.error("Reklam setleri alınamadı: " + err.message);
    } finally {
      setAdSetsLoading((p) => ({ ...p, [campaignId]: false }));
    }
  };

  const toggleExpand = (campaignId: string) => {
    const next = !expanded[campaignId];
    setExpanded((p) => ({ ...p, [campaignId]: next }));
    if (next && !adSets[campaignId]) loadAdSets(campaignId);
  };

  const loadAds = async (adSetId: string) => {
    setAdsLoading((p) => ({ ...p, [adSetId]: true }));
    try {
      const data: any = await invoke({ action: "listAds", adSetId });
      setAds((p) => ({ ...p, [adSetId]: data?.data || [] }));
    } catch (err: any) {
      toast.error("Reklamlar alınamadı: " + err.message);
    } finally {
      setAdsLoading((p) => ({ ...p, [adSetId]: false }));
    }
  };

  const toggleExpandAdSet = (adSetId: string) => {
    const next = !expandedAdSet[adSetId];
    setExpandedAdSet((p) => ({ ...p, [adSetId]: next }));
    if (next && !ads[adSetId]) loadAds(adSetId);
  };

  const toggleEntity = async (id: string, current: string, kind: "adset" | "ad", parentId: string) => {
    const next = current === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setBusyId(id);
    try {
      await invoke({ action: "toggleStatus", entityId: id, status: next });
      toast.success(next === "ACTIVE" ? "Aktif edildi" : "Duraklatıldı");
      if (kind === "adset") {
        setAdSets((p) => ({
          ...p,
          [parentId]: (p[parentId] || []).map((a) => (a.id === id ? { ...a, status: next, effective_status: next } : a)),
        }));
      } else {
        setAds((p) => ({
          ...p,
          [parentId]: (p[parentId] || []).map((a) => (a.id === id ? { ...a, status: next, effective_status: next } : a)),
        }));
      }
    } catch (err: any) {
      toast.error("İşlem başarısız: " + err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- editing ----------
  const openCampaignEdit = (c: Campaign) => {
    setEditCampaign(c);
    setCampaignForm({
      name: c.name,
      status: c.effective_status === "ACTIVE" ? "ACTIVE" : "PAUSED",
      dailyBudget: c.daily_budget ? String(parseInt(c.daily_budget, 10) / 100) : "",
      lifetimeBudget: c.lifetime_budget ? String(parseInt(c.lifetime_budget, 10) / 100) : "",
      spendCap: c.spend_cap ? String(parseInt(c.spend_cap, 10) / 100) : "",
    });
  };

  const saveCampaign = async () => {
    if (!editCampaign) return;
    setSaving(true);
    try {
      await invoke({
        action: "updateCampaign",
        campaignId: editCampaign.id,
        name: campaignForm.name || undefined,
        status: campaignForm.status as "ACTIVE" | "PAUSED",
        budget: campaignForm.dailyBudget ? Number(campaignForm.dailyBudget) : undefined,
        lifetimeBudget: campaignForm.lifetimeBudget ? Number(campaignForm.lifetimeBudget) : undefined,
        spendCap: campaignForm.spendCap ? Number(campaignForm.spendCap) : undefined,
      });
      toast.success("Kampanya güncellendi");
      setEditCampaign(null);
      loadCampaigns();
    } catch (err: any) {
      toast.error("Güncellenemedi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAdSetEdit = (adSet: AdSet, campaignId: string) => {
    setEditAdSet({ adSet, campaignId });
    const g = adSet.targeting?.genders;
    setAdSetForm({
      name: adSet.name,
      status: adSet.effective_status === "ACTIVE" ? "ACTIVE" : "PAUSED",
      dailyBudget: adSet.daily_budget ? String(parseInt(adSet.daily_budget, 10) / 100) : "",
      lifetimeBudget: adSet.lifetime_budget ? String(parseInt(adSet.lifetime_budget, 10) / 100) : "",
      ageMin: adSet.targeting?.age_min ? String(adSet.targeting.age_min) : "",
      ageMax: adSet.targeting?.age_max ? String(adSet.targeting.age_max) : "",
      genders: !g || g.length === 0 ? "all" : g.includes(1) && !g.includes(2) ? "male" : "female",
      startTime: adSet.start_time ? adSet.start_time.slice(0, 16) : "",
      endTime: adSet.end_time ? adSet.end_time.slice(0, 16) : "",
    });
  };

  const saveAdSet = async () => {
    if (!editAdSet) return;
    setSaving(true);
    try {
      await invoke({
        action: "updateAdSet",
        adSetId: editAdSet.adSet.id,
        name: adSetForm.name || undefined,
        status: adSetForm.status as "ACTIVE" | "PAUSED",
        budget: adSetForm.dailyBudget ? Number(adSetForm.dailyBudget) : undefined,
        lifetimeBudget: adSetForm.lifetimeBudget ? Number(adSetForm.lifetimeBudget) : undefined,
        ageMin: adSetForm.ageMin ? Number(adSetForm.ageMin) : undefined,
        ageMax: adSetForm.ageMax ? Number(adSetForm.ageMax) : undefined,
        genders: adSetForm.genders === "all" ? [] : adSetForm.genders === "male" ? [1] : [2],
        startTime: adSetForm.startTime || undefined,
        endTime: adSetForm.endTime || undefined,
      });
      toast.success("Reklam seti güncellendi");
      const cid = editAdSet.campaignId;
      setEditAdSet(null);
      loadAdSets(cid);
    } catch (err: any) {
      toast.error("Güncellenemedi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAdEdit = async (ad: Ad, adSetId: string) => {
    setEditAd({ ad, adSetId });
    setAdForm({ name: ad.name, status: ad.effective_status === "ACTIVE" ? "ACTIVE" : "PAUSED", message: "", headline: "", description: "", link: "" });
    setAdCreativeLoading(true);
    try {
      const data: any = await invoke({ action: "getAdCreative", adId: ad.id });
      const spec = data?.creative?.object_story_spec;
      const d = spec?.link_data || spec?.video_data || {};
      setAdForm({
        name: data?.name || ad.name,
        status: (data?.status || ad.status) === "ACTIVE" ? "ACTIVE" : "PAUSED",
        message: d.message || spec?.photo_data?.caption || data?.creative?.body || "",
        headline: d.name || data?.creative?.title || "",
        description: d.description || "",
        link: d.link || d.call_to_action?.value?.link || "",
      });
    } catch (err: any) {
      toast.error("Reklam öğesi alınamadı: " + err.message);
    } finally {
      setAdCreativeLoading(false);
    }
  };

  const saveAd = async () => {
    if (!editAd) return;
    setSaving(true);
    try {
      await invoke({
        action: "updateAd",
        adId: editAd.ad.id,
        name: adForm.name || undefined,
        status: adForm.status as "ACTIVE" | "PAUSED",
      });
      if (adForm.message || adForm.headline || adForm.description) {
        await invoke({
          action: "updateAdCreative",
          adId: editAd.ad.id,
          creative: {
            message: adForm.message || undefined,
            headline: adForm.headline || undefined,
            description: adForm.description || undefined,
            link: adForm.link || undefined,
          },
        });
      }
      toast.success("Reklam güncellendi");
      const sid = editAd.adSetId;
      setEditAd(null);
      loadAds(sid);
    } catch (err: any) {
      toast.error("Güncellenemedi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const archiveEntity = async (id: string, refresh: () => void) => {
    if (!confirm("Bu öğe arşivlenecek (silinmiş gibi durur, veriler korunur). Devam?")) return;
    setBusyId(id);
    try {
      await invoke({ action: "deleteEntity", entityId: id });
      toast.success("Arşivlendi");
      refresh();
    } catch (err: any) {
      toast.error("Arşivlenemedi: " + err.message);
    } finally {
      setBusyId(null);
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
                            <TableHead className="w-8" />
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
                              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                Kampanya bulunamadı.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredCampaigns.map((c) => {
                              const meta = statusMeta[c.effective_status || c.status] || statusMeta.PAUSED;
                              const StatusIcon = meta.icon;
                              const insight = insightMap.get(c.id);
                              const isOpen = !!expanded[c.id];
                              return (
                                <Fragment key={c.id}>
                                <TableRow>
                                  <TableCell className="pr-0">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(c.id)} aria-label="Reklam setlerini göster">
                                      <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                    </Button>
                                  </TableCell>
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
                                    <div className="flex items-center justify-end gap-2">
                                      <Button variant="outline" size="sm" onClick={() => openCampaignEdit(c)}>
                                        <Pencil className="w-4 h-4 mr-1" /> Düzenle
                                      </Button>
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
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => archiveEntity(c.id, loadCampaigns)} aria-label="Kampanyayı arşivle">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {isOpen && (
                                  <TableRow key={`${c.id}-sets`} className="bg-slate-50/60 hover:bg-slate-50/60">
                                    <TableCell colSpan={7} className="py-3">
                                      {adSetsLoading[c.id] ? (
                                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                                      ) : (adSets[c.id] || []).length === 0 ? (
                                        <div className="text-sm text-slate-500 py-2 pl-2">Bu kampanyada reklam seti yok.</div>
                                      ) : (
                                        <div className="space-y-2">
                                          {(adSets[c.id] || []).map((s) => {
                                            const sMeta = statusMeta[s.effective_status || s.status] || statusMeta.PAUSED;
                                            const setOpen = !!expandedAdSet[s.id];
                                            return (
                                              <div key={s.id} className="rounded-lg border bg-white">
                                                <div className="flex flex-wrap items-center gap-3 px-3 py-2">
                                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpandAdSet(s.id)} aria-label="Reklamları göster">
                                                    <ChevronRight className={`w-4 h-4 transition-transform ${setOpen ? "rotate-90" : ""}`} />
                                                  </Button>
                                                  <div className="min-w-[180px] flex-1">
                                                    <div className="text-sm font-medium">{s.name}</div>
                                                    <div className="text-xs text-slate-500">
                                                      Yaş {s.targeting?.age_min ?? "?"}-{s.targeting?.age_max ?? "?"} · {s.optimization_goal || "—"}
                                                    </div>
                                                  </div>
                                                  <Badge variant="outline" className={`${sMeta.className} text-xs`}>{sMeta.label}</Badge>
                                                  <div className="text-sm w-28 text-right">
                                                    {s.daily_budget ? `${(parseInt(s.daily_budget, 10) / 100).toLocaleString("tr-TR")} ₺/gün` : s.lifetime_budget ? `${(parseInt(s.lifetime_budget, 10) / 100).toLocaleString("tr-TR")} ₺ toplam` : "—"}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => openAdSetEdit(s, c.id)}>
                                                      <Pencil className="w-4 h-4 mr-1" /> Düzenle
                                                    </Button>
                                                    <Button variant="outline" size="sm" disabled={busyId === s.id} onClick={() => toggleEntity(s.id, s.effective_status, "adset", c.id)}>
                                                      {busyId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : s.effective_status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </Button>
                                                  </div>
                                                </div>

                                                {setOpen && (
                                                  <div className="border-t bg-slate-50/70 px-3 py-2 space-y-2">
                                                    {adsLoading[s.id] ? (
                                                      <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                                                    ) : (ads[s.id] || []).length === 0 ? (
                                                      <div className="text-sm text-slate-500">Bu sette reklam yok.</div>
                                                    ) : (
                                                      (ads[s.id] || []).map((a) => {
                                                        const aMeta = statusMeta[a.effective_status || a.status] || statusMeta.PAUSED;
                                                        return (
                                                          <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-3 py-2">
                                                            {a.creative?.thumbnail_url && (
                                                              <img src={a.creative.thumbnail_url} alt={a.name} className="w-10 h-10 rounded object-cover" loading="lazy" />
                                                            )}
                                                            <div className="min-w-[180px] flex-1">
                                                              <div className="text-sm font-medium">{a.name}</div>
                                                              <div className="text-xs text-slate-500 line-clamp-1">{a.creative?.body || a.creative?.title || "—"}</div>
                                                            </div>
                                                            <Badge variant="outline" className={`${aMeta.className} text-xs`}>{aMeta.label}</Badge>
                                                            <div className="flex items-center gap-2">
                                                              <Button variant="outline" size="sm" onClick={() => openAdEdit(a, s.id)}>
                                                                <Pencil className="w-4 h-4 mr-1" /> Metni Düzenle
                                                              </Button>
                                                              <Button variant="outline" size="sm" disabled={busyId === a.id} onClick={() => toggleEntity(a.id, a.effective_status, "ad", s.id)}>
                                                                {busyId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : a.effective_status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                              </Button>
                                                            </div>
                                                          </div>
                                                        );
                                                      })
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )}
                                </Fragment>
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
            Kampanya, reklam seti ve reklam metinlerini buradan düzenleyebilirsiniz. Değişiklikler doğrudan Meta hesabına yazılır.
          </div>
        </div>

        {/* Kampanya düzenle */}
        <Dialog open={!!editCampaign} onOpenChange={(o) => !o && setEditCampaign(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Kampanyayı Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Kampanya Adı</Label>
                <Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={campaignForm.status} onValueChange={(v) => setCampaignForm({ ...campaignForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="PAUSED">Duraklatıldı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Günlük Bütçe (₺)</Label>
                  <Input type="number" min="1" value={campaignForm.dailyBudget} onChange={(e) => setCampaignForm({ ...campaignForm, dailyBudget: e.target.value })} placeholder="örn: 350" />
                </div>
                <div className="space-y-2">
                  <Label>Toplam Bütçe (₺)</Label>
                  <Input type="number" min="1" value={campaignForm.lifetimeBudget} onChange={(e) => setCampaignForm({ ...campaignForm, lifetimeBudget: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Harcama Limiti (₺)</Label>
                <Input type="number" min="1" value={campaignForm.spendCap} onChange={(e) => setCampaignForm({ ...campaignForm, spendCap: e.target.value })} />
              </div>
              <p className="text-xs text-slate-500">
                Bütçe kampanya seviyesinde tanımlı değilse (CBO kapalı), bütçeyi reklam setinden düzenlemelisiniz.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCampaign(null)}>İptal</Button>
              <Button onClick={saveCampaign} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reklam seti düzenle */}
        <Dialog open={!!editAdSet} onOpenChange={(o) => !o && setEditAdSet(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reklam Setini Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Set Adı</Label>
                <Input value={adSetForm.name} onChange={(e) => setAdSetForm({ ...adSetForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={adSetForm.status} onValueChange={(v) => setAdSetForm({ ...adSetForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="PAUSED">Duraklatıldı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cinsiyet</Label>
                  <Select value={adSetForm.genders} onValueChange={(v) => setAdSetForm({ ...adSetForm, genders: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Günlük Bütçe (₺)</Label>
                  <Input type="number" min="1" value={adSetForm.dailyBudget} onChange={(e) => setAdSetForm({ ...adSetForm, dailyBudget: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Toplam Bütçe (₺)</Label>
                  <Input type="number" min="1" value={adSetForm.lifetimeBudget} onChange={(e) => setAdSetForm({ ...adSetForm, lifetimeBudget: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Yaş</Label>
                  <Input type="number" min="13" max="65" value={adSetForm.ageMin} onChange={(e) => setAdSetForm({ ...adSetForm, ageMin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Maks Yaş</Label>
                  <Input type="number" min="13" max="65" value={adSetForm.ageMax} onChange={(e) => setAdSetForm({ ...adSetForm, ageMax: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlangıç</Label>
                  <Input type="datetime-local" value={adSetForm.startTime} onChange={(e) => setAdSetForm({ ...adSetForm, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş</Label>
                  <Input type="datetime-local" value={adSetForm.endTime} onChange={(e) => setAdSetForm({ ...adSetForm, endTime: e.target.value })} />
                </div>
              </div>
              {editAdSet?.adSet.targeting?.geo_locations && (
                <div className="text-xs text-slate-500">
                  Konum hedeflemesi korunur: {JSON.stringify(editAdSet.adSet.targeting.geo_locations).slice(0, 160)}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAdSet(null)}>İptal</Button>
              <Button onClick={saveAdSet} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reklam / metin düzenle */}
        <Dialog open={!!editAd} onOpenChange={(o) => !o && setEditAd(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reklamı Düzenle</DialogTitle>
            </DialogHeader>
            {adCreativeLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Reklam Adı</Label>
                  <Input value={adForm.name} onChange={(e) => setAdForm({ ...adForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={adForm.status} onValueChange={(v) => setAdForm({ ...adForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="PAUSED">Duraklatıldı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ana Metin</Label>
                  <Textarea rows={5} value={adForm.message} onChange={(e) => setAdForm({ ...adForm, message: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Başlık</Label>
                    <Input value={adForm.headline} onChange={(e) => setAdForm({ ...adForm, headline: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Input value={adForm.description} onChange={(e) => setAdForm({ ...adForm, description: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hedef Bağlantı</Label>
                  <Input value={adForm.link} onChange={(e) => setAdForm({ ...adForm, link: e.target.value })} placeholder="https://doktorumol.com.tr/kayit-ol" />
                </div>
                <p className="text-xs text-slate-500">
                  Metin değişiklikleri Meta'da yeni bir reklam öğesi oluşturur ve reklama otomatik atanır; görsel/video aynı kalır.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAd(null)}>İptal</Button>
              <Button onClick={saveAd} disabled={saving || adCreativeLoading}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
