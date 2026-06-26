import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Phone, Search, BriefcaseBusiness, Check, Copy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UzmanLead {
  id: string;
  full_name: string;
  phone: string;
  branch: string | null;
  source: string | null;
  lead_date: string | null;
  status: string;
  call_attempts: number;
  notes: string | null;
  created_at: string;
}

const prettyBranch = (raw: string | null): string => {
  if (!raw) return "";
  return raw
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
};

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

// Status categories mirror the Excel colour coding the team uses on the DANIŞMAN sheet.
const STATUS_OPTIONS = [
  {
    value: "new",
    label: "Görüşülmemiş",
    hint: "Henüz aranmadı (beyaz)",
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    card: "border-slate-200",
    dot: "bg-slate-400",
  },
  {
    value: "contacted",
    label: "Bilgi Verilmiş Olanlar",
    hint: "Görüşülüp bilgi verilenler (sarı)",
    badge: "bg-yellow-200 text-yellow-900 border-yellow-400",
    card: "border-yellow-300 bg-yellow-50/60",
    dot: "bg-yellow-500",
  },
  {
    value: "registered",
    label: "Kayıt Olanlar",
    hint: "Kaydı tamamlayan uzmanlar (yeşil)",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    card: "border-emerald-200 bg-emerald-50/40",
    dot: "bg-emerald-600",
  },
  {
    value: "follow_up",
    label: "Sonra Görüşülecekler",
    hint: "Sonraya ertelenen görüşmeler (mor)",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    card: "border-purple-200 bg-purple-50/40",
    dot: "bg-purple-600",
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
    value: "not_interested",
    label: "İstemeyenler",
    hint: "İlgilenmeyenler (koyu gri)",
    badge: "bg-zinc-200 text-zinc-700 border-zinc-400",
    card: "border-zinc-300 bg-zinc-100/50",
    dot: "bg-zinc-500",
  },
  {
    value: "wrong",
    label: "Yanlış Numara",
    hint: "Yanlış / geçersiz numara (siyah)",
    badge: "bg-zinc-800 text-zinc-100 border-zinc-700",
    card: "border-zinc-400 bg-zinc-200/60",
    dot: "bg-zinc-900",
  },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

const UzmanApplications = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<UzmanLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const pageSize = 1000;
    let from = 0;
    const all: UzmanLead[] = [];
    let fetchError: any = null;
    while (true) {
      const { data, error } = await supabase
        .from("uzman_basvurulari")
        .select("id, full_name, phone, branch, source, lead_date, status, call_attempts, notes, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) {
        fetchError = error;
        break;
      }
      const batch = (data || []) as UzmanLead[];
      all.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }
    if (fetchError) {
      toast({ title: "Hata", description: "Başvurular yüklenemedi.", variant: "destructive" });
    } else {
      setLeads(all);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const copyContact = async (lead: UzmanLead) => {
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
    const { error } = await supabase.from("uzman_basvurulari").update({ notes: draft }).eq("id", id);
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
      const { data, error } = await supabase.functions.invoke("sync-uzman-leads", { body: {} });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      toast({
        title: "Güncellendi",
        description: `${data.inserted} yeni başvuru eklendi (toplam ${data.total} okundu).`,
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
    const { error } = await supabase.from("uzman_basvurulari").update({ status }).eq("id", id);
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Uzman Başvuru Sistemi</h1>
              <p className="text-sm text-muted-foreground">Meta reklamlarından gelen uzman başvuruları</p>
            </div>
          </div>
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Güncelleniyor..." : "Şimdi Güncelle"}
          </Button>
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
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Kayıt bulunamadı. "Şimdi Güncelle" ile başvuruları çekebilirsiniz.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((lead) => {
              const st = STATUS_MAP[lead.status] || STATUS_MAP.new;
              return (
                <Card key={lead.id} className={`border ${st.card}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{lead.full_name}</h3>
                        <p className="text-xs text-muted-foreground">{formatAppliedAt(lead)}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${st.badge}`}>
                        {st.label}
                      </span>
                    </div>

                    {lead.branch && (
                      <div className="text-sm text-muted-foreground">
                        Branş: <span className="text-foreground">{prettyBranch(lead.branch)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </a>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyContact(lead)}>
                        {copiedId === lead.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>

                    <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="space-y-1.5">
                      <Textarea
                        placeholder="Not ekle..."
                        rows={2}
                        value={noteDrafts[lead.id] ?? lead.notes ?? ""}
                        onChange={(e) => setNoteDrafts((p) => ({ ...p, [lead.id]: e.target.value }))}
                        className="text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        disabled={savingNote[lead.id] || (noteDrafts[lead.id] ?? lead.notes ?? "") === (lead.notes ?? "")}
                        onClick={() => saveNote(lead.id)}
                      >
                        {savingNote[lead.id] ? "Kaydediliyor..." : "Notu Kaydet"}
                      </Button>
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

export default UzmanApplications;
