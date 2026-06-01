import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { RefreshCw, Phone, Search, Video, MapPin, UserCheck } from "lucide-react";

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
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni", className: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "unreachable", label: "Ulaşılamadı", className: "bg-red-100 text-red-700 border-red-200" },
  { value: "contacted", label: "İletişim Kuruldu", className: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "transferred", label: "Aktarıldı", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];



const MetaLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("danisan_basvurulari")
      .select("id, full_name, phone, consultation_type, therapy_type, source, lead_date, status, call_attempts, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
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
    const { error } = await supabase.from("danisan_basvurulari").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Hata", description: "Durum güncellenemedi.", variant: "destructive" });
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
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
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <AdminBackButton />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Danışan Yönlendirme Sistemi</h1>
            <p className="text-sm text-muted-foreground">Meta reklamlarından gelen danışan başvuruları</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Excel'den Otomatik Çekim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="sheet-url">Google Sheets Bağlantısı</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
              <Button onClick={handleSync} disabled={syncing} className="shrink-0">
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Çekiliyor..." : "Danışanları Çek"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Excel sayfanızın bağlantısını yapıştırın. Yeni başvurular otomatik eklenir, mevcutların durumu korunur.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ad veya telefon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Tümü ({leads.length})</TabsTrigger>
            {STATUS_OPTIONS.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
                {s.label} ({counts[s.value] || 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Henüz danışan başvurusu yok. Yukarıdan Excel'den çekim yapabilirsiniz.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => {
              const statusMeta = STATUS_OPTIONS.find((s) => s.value === lead.status);
              const isFaceToFace = lead.consultation_type === "face_to_face";
              return (
                <Card key={lead.id} className={lead.status === "unreachable" ? "border-red-200 bg-red-50/40" : ""}>
                  <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{lead.full_name}</div>
                      <a href={`tel:${lead.phone}`} className="text-sm text-primary flex items-center gap-1 mt-0.5">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={isFaceToFace ? "border-amber-300 text-amber-700 bg-amber-50" : "border-emerald-300 text-emerald-700 bg-emerald-50"}
                      >
                        {isFaceToFace ? <MapPin className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                        {isFaceToFace ? "Yüz Yüze" : "Online"}
                      </Badge>
                      {statusMeta && (
                        <Badge variant="outline" className={statusMeta.className}>
                          {statusMeta.label}
                        </Badge>
                      )}
                      <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                        <SelectTrigger className="w-[150px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
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
