import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Phone, Search, Video, MapPin, UserCheck, StickyNote, Check, Clock, Copy, PhoneForwarded } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  consultation_type: string;
  therapy_type: string | null;
  source: string | null;
  lead_date: string | null;
  status: string;
  call_attempts: number;
  notes: string | null;
  welcome_sent_at: string | null;
  created_at: string;
}

// Pretty labels for the raw therapy_type values coming from the sheet.
const THERAPY_LABELS: Record<string, string> = {
  bireysel_terapi: "Bireysel Terapi",
  cift_terapisi: "Çift Terapisi",
  "çift_terapisi": "Çift Terapisi",
  aile_terapisi: "Aile Terapisi",
  cocuk_terapisi: "Çocuk Terapisi",
  "çocuk_terapisi": "Çocuk Terapisi",
  ergen_terapisi: "Ergen Terapisi",
};

const prettyTherapy = (raw: string | null): string => {
  if (!raw) return "";
  const key = raw.trim().toLowerCase();
  if (THERAPY_LABELS[key]) return THERAPY_LABELS[key];
  return raw
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
};

// Formats the application date/time in Turkish locale.
const formatAppliedAt = (lead: { lead_date: string | null; created_at: string }): string => {
  const raw = lead.lead_date || lead.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};




// Status categories mirror the Excel color coding the team uses.
const STATUS_OPTIONS = [
  {
    value: "new",
    label: "Yeni Gelenler",
    hint: "Henüz arama yapılmadı (beyaz)",
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    card: "border-slate-200",
    dot: "bg-slate-400",
  },
  {
    value: "no_answer",
    label: "Açmayanlar",
    hint: "Aranan ama açmayanlar (kırmızı)",
    badge: "bg-red-100 text-red-700 border-red-300",
    card: "border-red-200 bg-red-50/40",
    dot: "bg-red-500",
  },
  {
    value: "callback",
    label: "Daha Sonra Ara",
    hint: "Görüşüldü, şu an müsait değil (pembe)",
    badge: "bg-pink-100 text-pink-700 border-pink-300",
    card: "border-pink-200 bg-pink-50/40",
    dot: "bg-pink-500",
  },
  {
    value: "wrong",
    label: "Yanlış Ulaşanlar",
    hint: "Yanlış numara / istemeyenler (siyah)",
    badge: "bg-zinc-800 text-zinc-100 border-zinc-700",
    card: "border-zinc-300 bg-zinc-100/60",
    dot: "bg-zinc-800",
  },
  {
    value: "transferred",
    label: "Aktarıldı",
    hint: "Uzmana aktarıldı (sarı)",
    badge: "bg-yellow-200 text-yellow-900 border-yellow-400",
    card: "border-yellow-300 bg-yellow-50/60",
    dot: "bg-yellow-500",
  },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

const MetaLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const [sendingWa, setSendingWa] = useState<Record<string, boolean>>({});
  const [planLoading, setPlanLoading] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState<any[]>([]);

  const runRoutingPlan = async () => {
    setPlanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-call-router", {
        body: { dry_run: true, limit: 100 },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      setPlan(data.plan || []);
      setPlanOpen(true);
      toast({
        title: "Test planı hazır",
        description: `${data.new_lead_count} yeni danışan için yönlendirme planı oluşturuldu (arama yapılmadı).`,
      });
    } catch (e: any) {
      toast({ title: "Plan oluşturulamadı", description: e.message || "Bilinmeyen hata", variant: "destructive" });
    } finally {
      setPlanLoading(false);
    }
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("danisan_basvurulari")
      .select("id, full_name, phone, consultation_type, therapy_type, source, lead_date, status, call_attempts, notes, welcome_sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) {
      toast({ title: "Hata", description: "Danışanlar yüklenemedi.", variant: "destructive" });
    } else {
      setLeads((data || []) as Lead[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyContact = async (lead: Lead) => {
    const text = `${lead.full_name} - ${lead.phone}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId((c) => (c === lead.id ? null : c)), 1500);
      toast({ title: "Kopyalandı", description: text });
    } catch {
      toast({ title: "Kopyalanamadı", variant: "destructive" });
    }
  };


  const saveNote = async (id: string) => {
    const draft = noteDrafts[id];
    const lead = leads.find((l) => l.id === id);
    if (draft === undefined || (lead?.notes ?? "") === draft) return;
    setSavingNote((p) => ({ ...p, [id]: true }));
    const { error } = await supabase.from("danisan_basvurulari").update({ notes: draft }).eq("id", id);
    setSavingNote((p) => ({ ...p, [id]: false }));
    if (error) {
      toast({ title: "Hata", description: "Not kaydedilemedi.", variant: "destructive" });
    } else {
      setLeads((p) => p.map((l) => (l.id === id ? { ...l, notes: draft } : l)));
      toast({ title: "Not kaydedildi" });
    }
  };

  const sendWelcome = async (lead: Lead) => {
    setSendingWa((p) => ({ ...p, [lead.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("send-lead-welcome-whatsapp", {
        body: {
          leadId: lead.id,
          name: lead.full_name,
          phone: lead.phone,
          therapyType: lead.therapy_type,
        },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || "Mesaj gönderilemedi");
      const sentAt = new Date().toISOString();
      setLeads((p) => p.map((l) => (l.id === lead.id ? { ...l, welcome_sent_at: sentAt } : l)));
      toast({ title: "WhatsApp gönderildi", description: `${lead.full_name} numarasına hoş geldiniz mesajı iletildi.` });
    } catch (e: any) {
      toast({ title: "Gönderilemedi", description: e.message || "Bilinmeyen hata", variant: "destructive" });
    } finally {
      setSendingWa((p) => ({ ...p, [lead.id]: false }));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-meta-leads", {
        body: {},
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      toast({
        title: "Güncellendi",
        description: `${data.inserted} yeni danışan eklendi (toplam ${data.total} okundu).`,
      });
      await fetchLeads();
    } catch (e: any) {
      toast({ title: "Çekim hatası", description: e.message || "Bilinmeyen hata", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };


  const updateStatus = async (id: string, status: string) => {
    const prev = leads;
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, status } : l)));
    const { error } = await supabase.from("danisan_basvurulari").update({ status }).eq("id", id);
    if (error) {
      setLeads(prev);
      toast({ title: "Hata", description: "Durum güncellenemedi.", variant: "destructive" });
    }
  };

  const filtered = leads
    .filter((l) => {
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || l.full_name.toLowerCase().includes(q) || l.phone.includes(q);
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const da = new Date(a.lead_date || a.created_at).getTime();
      const db = new Date(b.lead_date || b.created_at).getTime();
      return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
    });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = leads.filter((l) => l.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HorizontalNavigation />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <AdminBackButton />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Danışan Yönlendirme Sistemi</h1>
              <p className="text-sm text-muted-foreground">Meta reklamlarından gelen danışan başvuruları</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Otomatik (15 dk)
            </span>
            <Button onClick={runRoutingPlan} disabled={planLoading} variant="secondary" size="sm" className="shrink-0">
              <PhoneForwarded className={`h-4 w-4 mr-2 ${planLoading ? "animate-pulse" : ""}`} />
              {planLoading ? "Hesaplanıyor..." : "Test Yönlendirme Planı"}
            </Button>
            <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="shrink-0">
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Güncelleniyor..." : "Şimdi Güncelle"}
            </Button>
          </div>
        </div>

        {/* Status summary chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg border p-3 text-left transition ${statusFilter === "all" ? "ring-2 ring-primary border-primary" : "hover:bg-muted/50"}`}
          >
            <div className="text-2xl font-bold">{leads.length}</div>
            <div className="text-xs text-muted-foreground">Tümü</div>
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`rounded-lg border p-3 text-left transition ${statusFilter === s.value ? "ring-2 ring-primary border-primary" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                <span className="text-2xl font-bold">{counts[s.value] || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">{s.label}</div>
            </button>
          ))}
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad veya telefon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? "Aramanızla eşleşen danışan yok." : "Henüz danışan başvurusu yok. Otomatik çekim her 15 dakikada bir çalışır."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((lead) => {
              const statusMeta = STATUS_MAP[lead.status] || STATUS_OPTIONS[0];
              const isFaceToFace = lead.consultation_type === "face_to_face";
              const draft = noteDrafts[lead.id] ?? lead.notes ?? "";
              const dirty = draft !== (lead.notes ?? "");
              return (
                <Card key={lead.id} className={`group relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${statusMeta.card}`}>
                  <span className={`absolute left-0 top-0 h-full w-1.5 ${statusMeta.dot}`} />
                  <CardContent className="p-5 pl-6 flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-primary text-base font-bold text-primary-foreground shadow-sm">
                          {lead.full_name?.trim()?.charAt(0)?.toLocaleUpperCase("tr-TR") || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-lg truncate leading-tight">{lead.full_name}</div>
                          {lead.therapy_type && (
                            <div className="mt-1 inline-block text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                              {prettyTherapy(lead.therapy_type)}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs px-2 py-1 rounded-full ${isFaceToFace ? "border-amber-300 text-amber-700 bg-amber-50" : "border-emerald-300 text-emerald-700 bg-emerald-50"}`}
                      >
                        {isFaceToFace ? <MapPin className="h-3.5 w-3.5 mr-1" /> : <Video className="h-3.5 w-3.5 mr-1" />}
                        {isFaceToFace ? "Yüz Yüze" : "Online"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-2 text-base font-semibold text-primary hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {lead.phone}
                      </a>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatAppliedAt(lead)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs rounded-full ml-auto"
                        onClick={() => copyContact(lead)}
                      >
                        {copiedId === lead.id ? (
                          <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Kopyalandı</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5 mr-1" /> Ad & Telefon Kopyala</>
                        )}
                      </Button>
                    </div>




                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <StickyNote className="h-3.5 w-3.5" />
                          Not
                        </span>
                        {dirty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-primary"
                            disabled={savingNote[lead.id]}
                            onClick={() => saveNote(lead.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Kaydet
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={draft}
                        placeholder="Bu danışan için not ekleyin..."
                        rows={2}
                        className="text-sm resize-none bg-background/70"
                        onChange={(e) => setNoteDrafts((p) => ({ ...p, [lead.id]: e.target.value }))}
                        onBlur={() => saveNote(lead.id)}
                      />
                    </div>

                    <div className="mt-auto">
                      <Badge variant="outline" className={`mb-2 text-xs ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </Badge>
                      <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-sm">
                              <span className="inline-flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                                {s.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MetaLeads;
