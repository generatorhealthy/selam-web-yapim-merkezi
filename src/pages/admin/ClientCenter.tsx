import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  UserCheck, Users, Calendar, Phone, AlertTriangle, Plus, ArrowRight, ArrowLeft,
  RefreshCw, Clock, StickyNote, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import ClientReferrals from "./ClientReferrals";
import MetaLeads from "./MetaLeads";
import ClientCalendar from "./ClientCalendar";

type TabKey = "yonlendirme" | "sistem" | "takvim";
const TAB_KEYS: TabKey[] = ["yonlendirme", "sistem", "takvim"];

// Statuses that still need staff work in the referral system.
const ACTIVE_STATUSES = ["new", "no_answer", "callback", "reapplied"];
const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  no_answer: "Açmadı",
  callback: "Daha sonra ara",
  reapplied: "Tekrar başvurdu",
};
// Same rule as Danışan Takvimi: no referral in the last 20 days = waiting.
const CYCLE_DAYS = 20;
// Same hidden test/opt-out specialists as Danışan Takvimi.
const HIDDEN_INTERNAL = ["0000", "111111111111", "1155"];

interface ActiveLead {
  id: string;
  full_name: string;
  phone: string;
  consultation_type: string | null;
  therapy_type: string | null;
  status: string;
  created_at: string;
  callback_at: string | null;
}
interface WaitingSpecialist {
  id: string;
  name: string;
  city: string | null;
  specialty: string | null;
  daysUntilPayment: number;
  daysSinceLast: number | null;
  note: string;
}
interface UrgentNote {
  id: string;
  note: string;
  created_by_name: string | null;
  created_at: string;
}

const daysUntilPayment = (paymentDay: number) => {
  const now = new Date();
  const today = now.getDate();
  const inMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return paymentDay >= today ? paymentDay - today : inMonth - today + paymentDay;
};
const shortDate = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const ClientCenter = () => {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("sekme") as TabKey | null;
  const [active, setActive] = useState<TabKey | null>(fromUrl && TAB_KEYS.includes(fromUrl) ? fromUrl : null);
  // Opened sections stay mounted so switching back keeps filters, scroll and loaded data.
  const [opened, setOpened] = useState<TabKey[]>(active ? [active] : []);
  const [presetSearch, setPresetSearch] = useState<{ text: string; nonce: number } | null>(null);

  const { userProfile, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const canAccess = !roleLoading && !!userProfile?.is_approved && ["admin", "staff"].includes(userProfile.role);

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<ActiveLead[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [waiting, setWaiting] = useState<WaitingSpecialist[]>([]);
  const [urgent, setUrgent] = useState<UrgentNote[]>([]);
  const [monthReferrals, setMonthReferrals] = useState(0);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const open = (key: TabKey | null) => {
    setActive(key);
    if (key) setOpened((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setParams(key ? { sekme: key } : {}, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const referTo = (specialistName: string) => {
    setPresetSearch({ text: specialistName, nonce: Date.now() });
    open("yonlendirme");
  };

  const loadOverview = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [leadRes, specRes, refRes, notesRes, urgentRes, monthRes] = await Promise.all([
      supabase
        .from("danisan_basvurulari")
        .select("id, full_name, phone, consultation_type, therapy_type, status, created_at, callback_at", { count: "exact" })
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("specialists")
        .select("id, name, city, specialty, payment_day, internal_number")
        .eq("is_active", true)
        .not("payment_day", "is", null),
      supabase
        .from("client_referrals")
        .select("specialist_id, referred_at")
        .eq("is_referred", true)
        .gte("referred_at", new Date(now.getTime() - 90 * 86400000).toISOString()),
      supabase.from("calendar_notes").select("specialist_id, note"),
      supabase
        .from("urgent_referral_notes")
        .select("id, note, created_by_name, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("client_referrals")
        .select("id", { count: "exact", head: true })
        .eq("is_referred", true)
        .eq("year", now.getFullYear())
        .eq("month", now.getMonth() + 1),
    ]);

    if (leadRes.error || specRes.error) {
      toast({ title: "Hata", description: "Danışan Merkezi bilgileri yüklenemedi.", variant: "destructive" });
    }
    setLeads((leadRes.data || []) as ActiveLead[]);
    setLeadCount(leadRes.count ?? (leadRes.data || []).length);

    const lastBySpec = new Map<string, number>();
    (refRes.data || []).forEach((r: { specialist_id: string; referred_at: string | null }) => {
      if (!r.referred_at) return;
      const t = new Date(r.referred_at).getTime();
      if (!lastBySpec.has(r.specialist_id) || t > lastBySpec.get(r.specialist_id)!) lastBySpec.set(r.specialist_id, t);
    });
    const notes = new Map<string, string>();
    (notesRes.data || []).forEach((n: { specialist_id: string; note: string }) => {
      if (n.note?.trim()) notes.set(n.specialist_id, n.note);
    });
    const list: WaitingSpecialist[] = (specRes.data || [])
      .filter((s: any) => s.name?.trim() !== "Faydalı Bilgiler" && !HIDDEN_INTERNAL.includes(String(s.internal_number || "").trim()))
      .map((s: any) => {
        const last = lastBySpec.get(s.id);
        return {
          id: s.id,
          name: s.name,
          city: s.city,
          specialty: s.specialty,
          daysUntilPayment: daysUntilPayment(s.payment_day || 1),
          daysSinceLast: last ? Math.floor((now.getTime() - last) / 86400000) : null,
          note: notes.get(s.id) || "",
        };
      })
      .filter((s) => s.daysSinceLast === null || s.daysSinceLast >= CYCLE_DAYS)
      .sort((a, b) => a.daysUntilPayment - b.daysUntilPayment);
    setWaiting(list);
    setUrgent((urgentRes.data || []) as UrgentNote[]);
    setMonthReferrals(monthRes.count ?? 0);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (canAccess && active === null) loadOverview();
  }, [canAccess, active, loadOverview]);

  const addUrgentNote = async () => {
    const text = newNote.trim();
    if (!text || savingNote) return;
    setSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("urgent_referral_notes")
        .insert({ note: text, created_by: user?.id || null, created_by_name: userProfile?.name || user?.email || null })
        .select("id, note, created_by_name, created_at")
        .maybeSingle();
      if (error) throw error;
      if (data) setUrgent((prev) => [data as UrgentNote, ...prev]);
      setNewNote("");
      toast({ title: "Acil not eklendi" });
    } catch {
      toast({ title: "Hata", description: "Not eklenemedi", variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  const sections: { key: TabKey; label: string; hint: string; icon: typeof Users; count: string }[] = [
    { key: "yonlendirme", label: "Danışan Yönlendirme", hint: "+1 ile uzmana danışan yönlendir", icon: UserCheck, count: `Bu ay ${monthReferrals} yönlendirme` },
    { key: "sistem", label: "Danışan Yönlendirme Sistemi", hint: "Gelen başvuruları ara ve takip et", icon: Users, count: `${leadCount} aktif başvuru` },
    { key: "takvim", label: "Danışan Takvimi", hint: "20 günlük döngü, aciller ve notlar", icon: Calendar, count: `${waiting.length} uzman bekliyor · ${urgent.length} acil` },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Helmet>
        <title>Danışan Merkezi - Divan Paneli</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <HorizontalNavigation />

      <div className="container mx-auto px-4 pt-6">
        <AdminBackButton />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Danışan Merkezi</h1>
            <p className="text-sm text-muted-foreground">Yönlendirme, başvurular ve takvim tek sayfada.</p>
          </div>
          {active ? (
            <Button variant="outline" size="sm" onClick={() => open(null)} className="gap-1">
              <LayoutGrid className="h-4 w-4" /> Genel Bakış
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={loadOverview} disabled={loading} className="gap-1">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Yenile
            </Button>
          )}
        </div>

        {/* Üç ana düğme */}
        <div className="sticky top-0 z-30 -mx-4 mb-4 bg-muted/80 px-4 py-2 backdrop-blur">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {sections.map(({ key, label, hint, icon: Icon, count }) => {
              const isActive = active === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => open(isActive ? null : key)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition-colors ${
                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary/50"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-primary-foreground/15" : "bg-primary/10 text-primary"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{label}</span>
                    <span className={`block truncate text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {active === null && !loading ? count : hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Genel bakış: üç sayfanın günlük işleri */}
        {active === null && (
          <div className="grid grid-cols-1 gap-4 pb-10 lg:grid-cols-3">
            {/* Aktif başvurular */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Aktif Başvurular</span>
                  <Badge variant="secondary">{leadCount}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">Yeni, açmayan, sonra aranacak ve tekrar başvuranlar.</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                {loading ? (
                  [0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)
                ) : leads.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Bekleyen başvuru yok.</p>
                ) : (
                  <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                    {leads.map((l) => (
                      <div key={l.id} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{l.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[l.therapy_type?.replace(/_/g, " "), l.consultation_type === "face_to_face" ? "Yüz yüze" : l.consultation_type ? "Online" : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <Badge variant={l.status === "new" ? "default" : "outline"} className="shrink-0 text-[10px]">
                            {STATUS_LABELS[l.status] || l.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {l.status === "callback" && l.callback_at ? `Ara: ${shortDate(l.callback_at)}` : shortDate(l.created_at)}
                          </span>
                          <div className="flex gap-1">
                            <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                              <a href={`tel:${l.phone}`}><Phone className="mr-1 h-3 w-3" />Ara</a>
                            </Button>
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => open("yonlendirme")}>
                              Yönlendir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-auto justify-between" onClick={() => open("sistem")}>
                  Tüm başvuruları aç <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Yönlendirme bekleyen uzmanlar */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" /> Yönlendirme Bekleyenler</span>
                  <Badge variant="secondary">{waiting.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">Son {CYCLE_DAYS} günde danışan gitmeyen uzmanlar, ödeme günü yakın olan üstte.</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                {loading ? (
                  [0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)
                ) : waiting.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Tüm uzmanlara bu döngüde yönlendirme yapılmış.</p>
                ) : (
                  <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                    {waiting.map((s) => (
                      <div key={s.id} className={`rounded-lg border bg-background p-3 ${s.daysUntilPayment <= 3 ? "border-destructive/50" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{[s.specialty, s.city].filter(Boolean).join(" · ")}</p>
                          </div>
                          <Button size="sm" className="h-7 shrink-0 gap-1 px-2 text-xs" onClick={() => referTo(s.name)}>
                            <Plus className="h-3 w-3" />1 Yönlendir
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant={s.daysUntilPayment <= 3 ? "destructive" : "outline"} className="text-[10px]">
                            {s.daysUntilPayment === 0 ? "Ödeme günü bugün" : `Ödemeye ${s.daysUntilPayment} gün`}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {s.daysSinceLast === null ? "Son 3 ayda yönlendirme yok" : `Son yönlendirme ${s.daysSinceLast} gün önce`}
                          </Badge>
                        </div>
                        {s.note && (
                          <p className="mt-2 flex gap-1 text-xs text-muted-foreground">
                            <StickyNote className="mt-0.5 h-3 w-3 shrink-0" /> <span className="line-clamp-2">{s.note}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-auto justify-between" onClick={() => open("takvim")}>
                  Danışan takvimini aç <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Acil notlar */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Acil Danışanlar & Notlar</span>
                  <Badge variant="secondary">{urgent.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">Danışan takvimindeki acil notlar.</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Acil not yaz..."
                    className="min-h-[44px] text-sm"
                    rows={2}
                  />
                  <Button size="sm" onClick={addUrgentNote} disabled={!newNote.trim() || savingNote} className="self-end">
                    Ekle
                  </Button>
                </div>
                {loading ? (
                  [0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)
                ) : urgent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Acil not yok.</p>
                ) : (
                  <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                    {urgent.map((n) => (
                      <div key={n.id} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <p className="whitespace-pre-wrap text-sm text-foreground">{n.note}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {n.created_by_name ? `${n.created_by_name} · ` : ""}{shortDate(n.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-auto justify-between" onClick={() => open("takvim")}>
                  Notları düzenle <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {active !== null && (
          <Button variant="link" size="sm" className="mb-1 h-auto gap-1 px-0" onClick={() => open(null)}>
            <ArrowLeft className="h-3 w-3" /> Genel bakışa dön
          </Button>
        )}
      </div>

      {opened.includes("yonlendirme") && (
        <div hidden={active !== "yonlendirme"}>
          <ClientReferrals embedded presetSearch={presetSearch} />
        </div>
      )}
      {opened.includes("sistem") && (
        <div hidden={active !== "sistem"}>
          <MetaLeads embedded />
        </div>
      )}
      {opened.includes("takvim") && (
        <div hidden={active !== "takvim"}>
          <ClientCalendar embedded />
        </div>
      )}
    </div>
  );
};

export default ClientCenter;
