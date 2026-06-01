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
import { RefreshCw, Phone, Search, Video, MapPin, UserCheck, StickyNote, Check } from "lucide-react";

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

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("danisan_basvurulari")
      .select("id, full_name, phone, consultation_type, therapy_type, source, lead_date, status, call_attempts, notes, created_at")
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

  const filtered = leads.filter((l) => {
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || l.full_name.toLowerCase().includes(q) || l.phone.includes(q);
    return matchesStatus && matchesSearch;
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((lead) => {
              const statusMeta = STATUS_MAP[lead.status] || STATUS_OPTIONS[0];
              const isFaceToFace = lead.consultation_type === "face_to_face";
              return (
                <Card key={lead.id} className={`transition hover:shadow-md ${statusMeta.card}`}>
                  <CardContent className="p-4 flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate leading-tight">{lead.full_name}</div>
                        {lead.therapy_type && (
                          <div className="text-[11px] text-muted-foreground truncate">{lead.therapy_type}</div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] px-1.5 ${isFaceToFace ? "border-amber-300 text-amber-700 bg-amber-50" : "border-emerald-300 text-emerald-700 bg-emerald-50"}`}
                      >
                        {isFaceToFace ? <MapPin className="h-3 w-3 mr-0.5" /> : <Video className="h-3 w-3 mr-0.5" />}
                        {isFaceToFace ? "Yüz Yüze" : "Online"}
                      </Badge>
                    </div>

                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </a>

                    <div className="mt-auto">
                      <Badge variant="outline" className={`mb-2 text-[10px] ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </Badge>
                      <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-xs">
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
