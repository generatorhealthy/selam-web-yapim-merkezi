import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/FileUpload";
import AdminBackButton from "@/components/AdminBackButton";
import {
  Gavel, Plus, Loader2, Trash2, Pencil, Download, FileText, Search,
  ShieldCheck, RefreshCw, Paperclip,
} from "lucide-react";

type LitigationCase = {
  id: string;
  defendant_name: string;
  defendant_email: string | null;
  defendant_phone: string | null;
  defendant_tc_no: string | null;
  defendant_address: string | null;
  defendant_city: string | null;
  specialist_id: string | null;
  legal_proceeding_id: string | null;
  claim_amount: number;
  unpaid_months: number;
  status: string;
  court_name: string | null;
  file_no: string | null;
  contract_pdf_url: string | null;
  invoice_pdf_url: string | null;
  summary: string | null;
  notes: string | null;
  created_at: string;
};

type EvidenceItem = {
  id: string;
  case_id: string;
  category: string;
  title: string;
  description: string | null;
  occurred_at: string | null;
  file_url: string | null;
  source_ref: string | null;
  importance: string;
  created_at: string;
};

const STATUSES = [
  "HAZIRLIK",
  "IHTARNAME_GONDERILDI",
  "ARABULUCULUK_SURECINDE",
  "DAVA_ACILDI",
  "DURUSMA_BEKLENIYOR",
  "KARAR_ASAMASI",
  "ICRA_TAKIBI",
  "TAHSIL_EDILDI",
  "KAPANDI",
];

const CATEGORIES = [
  "SOZLESME",
  "FATURA",
  "ODEME_KAYDI",
  "PROFIL_GORUNTUSU",
  "DANISAN_YONLENDIRME",
  "BLOG_CALISMASI",
  "IP_KAYDI",
  "SMS_KAYDI",
  "EPOSTA_KAYDI",
  "WHATSAPP_KAYDI",
  "TELEFON_GORUSMESI",
  "DIGER",
];

const label = (v: string) => v.split("_").join(" ");
const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString("tr-TR") : "-";
const fmtMoney = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0);

const emptyCase = {
  defendant_name: "",
  defendant_email: "",
  defendant_phone: "",
  defendant_tc_no: "",
  defendant_address: "",
  defendant_city: "",
  specialist_id: "",
  claim_amount: "0",
  unpaid_months: "0",
  status: "HAZIRLIK",
  court_name: "",
  file_no: "",
  summary: "",
  notes: "",
};

type CollectedEvidence = {
  orders: any[];
  blogs: any[];
  sms: any[];
  proceedings: any[];
  consents: any[];
  referrals: any[];
  appointments: any[];
  reviews: any[];
  testResults: any[];
};

const emptyCollected: CollectedEvidence = {
  orders: [], blogs: [], sms: [], proceedings: [], consents: [],
  referrals: [], appointments: [], reviews: [], testResults: [],
};

export default function LitigationCases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<LitigationCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [collected, setCollected] = useState<CollectedEvidence>(emptyCollected);
  const [collecting, setCollecting] = useState(false);
  const [search, setSearch] = useState("");

  const [caseDialog, setCaseDialog] = useState(false);
  const [editingCase, setEditingCase] = useState<LitigationCase | null>(null);
  const [caseForm, setCaseForm] = useState({ ...emptyCase });
  const [saving, setSaving] = useState(false);

  const [evidenceDialog, setEvidenceDialog] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    category: "DIGER",
    title: "",
    description: "",
    occurred_at: "",
    file_url: "",
    source_ref: "",
    importance: "NORMAL",
  });

  const selected = useMemo(
    () => cases.find((c) => c.id === selectedId) || null,
    [cases, selectedId]
  );

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/divan_paneli");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      const ok = profile?.role === "admin";
      setAuthorized(ok);
      if (ok) await loadCases();
      setLoading(false);
    })();
  }, []);

  const loadCases = async () => {
    const { data, error } = await supabase
      .from("litigation_cases")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Hata", description: "Dava dosyaları yüklenemedi.", variant: "destructive" });
      return;
    }
    setCases((data || []) as LitigationCase[]);
  };

  const loadEvidence = async (caseId: string) => {
    const { data } = await supabase
      .from("litigation_evidence_items")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    setEvidence((data || []) as EvidenceItem[]);
  };

  const openCase = async (c: LitigationCase) => {
    setSelectedId(c.id);
    setCollected(emptyCollected);
    await loadEvidence(c.id);
    collectEvidence(c);
  };

  const collectEvidence = async (c: LitigationCase) => {
    setCollecting(true);
    try {
      const name = c.defendant_name.trim();
      const email = (c.defendant_email || "").trim();
      const nameLike = `%${name.split(" ").join("%")}%`;

      const queries: any[] = [
        supabase.from("orders").select("*").or(
          email ? `customer_email.eq.${email},customer_name.ilike.${nameLike}` : `customer_name.ilike.${nameLike}`
        ).order("created_at", { ascending: true }),
        supabase.from("blog_posts").select("id,title,slug,status,published_at,created_at,word_count,author_name")
          .ilike("author_name", nameLike).order("created_at", { ascending: true }),
        supabase.from("sms_logs").select("id,created_at,phone,message,status,specialist_name,client_name,client_contact,source")
          .ilike("specialist_name", nameLike).order("created_at", { ascending: true }),
        supabase.from("legal_proceedings").select("*").ilike("customer_name", nameLike),
        email
          ? supabase.from("user_consent_logs").select("*").eq("email", email).order("accepted_at", { ascending: true })
          : Promise.resolve({ data: [] }),
        c.specialist_id
          ? supabase.from("client_referrals").select("*").eq("specialist_id", c.specialist_id).order("created_at", { ascending: true })
          : Promise.resolve({ data: [] }),
        c.specialist_id
          ? supabase.from("appointments").select("*").eq("specialist_id", c.specialist_id).order("created_at", { ascending: true })
          : Promise.resolve({ data: [] }),
        c.specialist_id
          ? supabase.from("reviews").select("*").eq("specialist_id", c.specialist_id)
          : Promise.resolve({ data: [] }),
        c.specialist_id
          ? supabase.from("test_results").select("id,patient_name,status,created_at").eq("specialist_id", c.specialist_id)
          : Promise.resolve({ data: [] }),
      ];

      const [orders, blogs, sms, proceedings, consents, referrals, appointments, reviews, testResults] =
        await Promise.all(queries);

      setCollected({
        orders: orders?.data || [],
        blogs: blogs?.data || [],
        sms: sms?.data || [],
        proceedings: proceedings?.data || [],
        consents: consents?.data || [],
        referrals: referrals?.data || [],
        appointments: appointments?.data || [],
        reviews: reviews?.data || [],
        testResults: testResults?.data || [],
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Uyarı", description: "Bazı kanıt kaynakları okunamadı.", variant: "destructive" });
    } finally {
      setCollecting(false);
    }
  };

  const submitCase = async () => {
    if (!caseForm.defendant_name.trim()) {
      toast({ title: "Eksik bilgi", description: "Davalı adı zorunludur.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      defendant_name: caseForm.defendant_name.trim(),
      defendant_email: caseForm.defendant_email || null,
      defendant_phone: caseForm.defendant_phone || null,
      defendant_tc_no: caseForm.defendant_tc_no || null,
      defendant_address: caseForm.defendant_address || null,
      defendant_city: caseForm.defendant_city || null,
      specialist_id: caseForm.specialist_id || null,
      claim_amount: Number(caseForm.claim_amount) || 0,
      unpaid_months: Number(caseForm.unpaid_months) || 0,
      status: caseForm.status,
      court_name: caseForm.court_name || null,
      file_no: caseForm.file_no || null,
      summary: caseForm.summary || null,
      notes: caseForm.notes || null,
    };
    const { error } = editingCase
      ? await supabase.from("litigation_cases").update(payload).eq("id", editingCase.id)
      : await supabase.from("litigation_cases").insert([payload]);
    setSaving(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Kaydedildi", description: "Dava dosyası güncellendi." });
    setCaseDialog(false);
    setEditingCase(null);
    setCaseForm({ ...emptyCase });
    await loadCases();
  };

  const deleteCase = async (id: string) => {
    if (!confirm("Bu dava dosyası ve tüm kanıtları silinecek. Emin misiniz?")) return;
    const { error } = await supabase.from("litigation_cases").delete().eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    if (selectedId === id) setSelectedId(null);
    await loadCases();
  };

  const submitEvidence = async () => {
    if (!selected) return;
    if (!evidenceForm.title.trim()) {
      toast({ title: "Eksik bilgi", description: "Kanıt başlığı zorunludur.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("litigation_evidence_items").insert([{
      case_id: selected.id,
      category: evidenceForm.category,
      title: evidenceForm.title.trim(),
      description: evidenceForm.description || null,
      occurred_at: evidenceForm.occurred_at ? new Date(evidenceForm.occurred_at).toISOString() : null,
      file_url: evidenceForm.file_url || null,
      source_ref: evidenceForm.source_ref || null,
      importance: evidenceForm.importance,
    }]);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    setEvidenceDialog(false);
    setEvidenceForm({ category: "DIGER", title: "", description: "", occurred_at: "", file_url: "", source_ref: "", importance: "NORMAL" });
    await loadEvidence(selected.id);
    toast({ title: "Eklendi", description: "Kanıt dosyaya eklendi." });
  };

  const deleteEvidence = async (id: string) => {
    await supabase.from("litigation_evidence_items").delete().eq("id", id);
    if (selected) await loadEvidence(selected.id);
  };

  const addCollectedAsEvidence = async (category: string, title: string, rows: any[]) => {
    if (!selected || rows.length === 0) return;
    const { error } = await supabase.from("litigation_evidence_items").insert([{
      case_id: selected.id,
      category,
      title,
      description: JSON.stringify(rows, null, 2).slice(0, 20000),
      source_ref: "Sistem kaydı (otomatik)",
      importance: "YUKSEK",
    }]);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    await loadEvidence(selected.id);
    toast({ title: "Eklendi", description: `${title} kanıt olarak kaydedildi.` });
  };

  const downloadDossier = () => {
    if (!selected) return;
    const dossier = {
      olusturma_tarihi: new Date().toISOString(),
      dava_dosyasi: selected,
      sistem_kayitlari: collected,
      manuel_kanitlar: evidence,
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dava-dosyasi-${selected.defendant_name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = cases.filter((c) =>
    !search ||
    c.defendant_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.defendant_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.defendant_phone || "").includes(search)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldCheck className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Bu sayfayı görüntüleme yetkiniz yok.</p>
        <Button variant="outline" onClick={() => navigate("/divan_paneli/dashboard")}>Panele Dön</Button>
      </div>
    );
  }

  const ipList = Array.from(new Set([
    ...collected.orders.map((o: any) => o.contract_ip_address).filter(Boolean),
    ...collected.consents.map((c: any) => c.ip_address).filter(Boolean),
  ]));

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 print:p-0 print:bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="print:hidden">
          <AdminBackButton />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gavel className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dava Süreçleri</h1>
              <p className="text-sm text-muted-foreground">Dava dosyaları ve delil arşivi (yalnızca yönetici)</p>
            </div>
          </div>
          <Button className="print:hidden" onClick={() => { setEditingCase(null); setCaseForm({ ...emptyCase }); setCaseDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Dava Dosyası
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 print:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dosyalar ({cases.length})</CardTitle>
              <div className="relative mt-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Ad, e-posta, telefon ara" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">Kayıt yok.</p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openCase(c)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedId === c.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c.defendant_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{label(c.status)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fmtMoney(Number(c.claim_amount))} · {c.unpaid_months} ay ödenmedi
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {!selected && (
              <Card className="print:hidden">
                <CardContent className="py-16 text-center text-muted-foreground">
                  Detayları görmek için bir dava dosyası seçin.
                </CardContent>
              </Card>
            )}

            {selected && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>{selected.defendant_name}</CardTitle>
                      <CardDescription>
                        {selected.defendant_email || "-"} · {selected.defendant_phone || "-"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button size="sm" variant="outline" onClick={() => collectEvidence(selected)} disabled={collecting}>
                        {collecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.print()}>
                        <FileText className="w-4 h-4 mr-1" /> Yazdır
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadDossier}>
                        <Download className="w-4 h-4 mr-1" /> İndir
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingCase(selected);
                        setCaseForm({
                          defendant_name: selected.defendant_name,
                          defendant_email: selected.defendant_email || "",
                          defendant_phone: selected.defendant_phone || "",
                          defendant_tc_no: selected.defendant_tc_no || "",
                          defendant_address: selected.defendant_address || "",
                          defendant_city: selected.defendant_city || "",
                          specialist_id: selected.specialist_id || "",
                          claim_amount: String(selected.claim_amount ?? 0),
                          unpaid_months: String(selected.unpaid_months ?? 0),
                          status: selected.status,
                          court_name: selected.court_name || "",
                          file_no: selected.file_no || "",
                          summary: selected.summary || "",
                          notes: selected.notes || "",
                        });
                        setCaseDialog(true);
                      }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCase(selected.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Talep tutarı:</span> <b>{fmtMoney(Number(selected.claim_amount))}</b></div>
                    <div><span className="text-muted-foreground">Ödenmeyen ay:</span> <b>{selected.unpaid_months}</b></div>
                    <div><span className="text-muted-foreground">Durum:</span> <b>{label(selected.status)}</b></div>
                    <div><span className="text-muted-foreground">T.C. No:</span> <b>{selected.defendant_tc_no || "-"}</b></div>
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Adres:</span> {selected.defendant_address || "-"} {selected.defendant_city ? `(${selected.defendant_city})` : ""}</div>
                    <div><span className="text-muted-foreground">Mahkeme:</span> {selected.court_name || "-"}</div>
                    <div><span className="text-muted-foreground">Dosya no:</span> {selected.file_no || "-"}</div>
                    {selected.summary && <div className="sm:col-span-2 whitespace-pre-wrap"><span className="text-muted-foreground">Özet:</span> {selected.summary}</div>}
                    {selected.notes && <div className="sm:col-span-2 whitespace-pre-wrap"><span className="text-muted-foreground">Notlar:</span> {selected.notes}</div>}
                  </CardContent>
                </Card>

                <Tabs defaultValue="sistem">
                  <TabsList className="print:hidden">
                    <TabsTrigger value="sistem">Sistem Kayıtları</TabsTrigger>
                    <TabsTrigger value="kanit">Delil Arşivi ({evidence.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sistem" className="space-y-4">
                    <EvidenceGroup
                      title="Sipariş ve Ödeme Kayıtları"
                      rows={collected.orders}
                      onAdd={() => addCollectedAsEvidence("ODEME_KAYDI", "Sipariş ve ödeme kayıtları (sistem)", collected.orders)}
                      render={(o: any) => (
                        <div>
                          <b>{fmtDate(o.created_at)}</b> — {o.package_name} — {fmtMoney(Number(o.amount))} — {o.status} / {o.payment_method}
                          {o.subscription_month ? ` — ${o.subscription_month}. ay` : ""}
                          {o.invoice_number ? ` — Fatura: ${o.invoice_number}` : ""}
                          {o.contract_ip_address ? ` — Sözleşme IP: ${o.contract_ip_address}` : ""}
                        </div>
                      )}
                    />
                    <EvidenceGroup
                      title="Sözleşme Onay IP Kayıtları"
                      rows={ipList}
                      onAdd={() => addCollectedAsEvidence("IP_KAYDI", "IP kayıtları (sistem)", ipList.map((ip) => ({ ip })))}
                      render={(ip: string) => <div>{ip}</div>}
                    />
                    <EvidenceGroup
                      title="Danışan Yönlendirmeleri"
                      rows={collected.referrals}
                      onAdd={() => addCollectedAsEvidence("DANISAN_YONLENDIRME", "Danışan yönlendirme kayıtları (sistem)", collected.referrals)}
                      render={(r: any) => (
                        <div>
                          {r.year}/{r.month} — {r.client_name || "-"} {r.client_surname || ""} — {r.client_contact || "-"} — {r.referral_count} yönlendirme — {fmtDate(r.referred_at)}
                        </div>
                      )}
                    />
                    <EvidenceGroup
                      title="Randevular"
                      rows={collected.appointments}
                      onAdd={() => addCollectedAsEvidence("DANISAN_YONLENDIRME", "Randevu kayıtları (sistem)", collected.appointments)}
                      render={(a: any) => <div>{a.appointment_date} {a.appointment_time} — {a.patient_name} — {a.status}</div>}
                    />
                    <EvidenceGroup
                      title="Blog Çalışmaları"
                      rows={collected.blogs}
                      onAdd={() => addCollectedAsEvidence("BLOG_CALISMASI", "Blog çalışmaları (sistem)", collected.blogs)}
                      render={(b: any) => <div>{fmtDate(b.published_at || b.created_at)} — {b.title} — {b.status} — {b.word_count || 0} kelime</div>}
                    />
                    <EvidenceGroup
                      title="SMS / Bildirim Kayıtları"
                      rows={collected.sms}
                      onAdd={() => addCollectedAsEvidence("SMS_KAYDI", "SMS kayıtları (sistem)", collected.sms)}
                      render={(s: any) => <div>{fmtDate(s.created_at)} — {s.phone} — {s.status} — {(s.message || "").slice(0, 120)}</div>}
                    />
                    <EvidenceGroup
                      title="İcra / Hukuki İşlem Kayıtları"
                      rows={collected.proceedings}
                      onAdd={() => addCollectedAsEvidence("DIGER", "İcra ve hukuki işlem kayıtları (sistem)", collected.proceedings)}
                      render={(p: any) => <div>{fmtDate(p.created_at)} — {fmtMoney(Number(p.proceeding_amount))} — {p.status} — {p.notes || ""}</div>}
                    />
                    <EvidenceGroup
                      title="Onay / Rıza Kayıtları"
                      rows={collected.consents}
                      onAdd={() => addCollectedAsEvidence("DIGER", "Onay ve rıza kayıtları (sistem)", collected.consents)}
                      render={(c: any) => <div>{fmtDate(c.accepted_at)} — {c.consent_type} — IP: {c.ip_address || "-"}</div>}
                    />
                    <EvidenceGroup
                      title="Değerlendirmeler ve Test Sonuçları"
                      rows={[...collected.reviews, ...collected.testResults]}
                      onAdd={() => addCollectedAsEvidence("DIGER", "Değerlendirme ve test kayıtları (sistem)", [...collected.reviews, ...collected.testResults])}
                      render={(r: any) => <div>{fmtDate(r.created_at)} — {r.reviewer_name || r.patient_name} — {r.rating ? `${r.rating}/5` : r.status}</div>}
                    />
                  </TabsContent>

                  <TabsContent value="kanit" className="space-y-4">
                    <div className="flex justify-end print:hidden">
                      <Button size="sm" onClick={() => setEvidenceDialog(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Kanıt Ekle
                      </Button>
                    </div>
                    {evidence.length === 0 && (
                      <Card><CardContent className="py-10 text-center text-muted-foreground">Henüz kanıt eklenmedi.</CardContent></Card>
                    )}
                    {evidence.map((e) => (
                      <Card key={e.id}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline">{label(e.category)}</Badge>
                              {e.importance === "YUKSEK" && <Badge className="bg-destructive text-destructive-foreground">Yüksek</Badge>}
                              <span className="font-semibold">{e.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {e.occurred_at ? `Olay: ${fmtDate(e.occurred_at)} · ` : ""}Eklendi: {fmtDate(e.created_at)}
                              {e.source_ref ? ` · Kaynak: ${e.source_ref}` : ""}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost" className="print:hidden" onClick={() => deleteEvidence(e.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {e.description && (
                            <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-md max-h-64 overflow-auto">{e.description}</pre>
                          )}
                          {e.file_url && (
                            <a href={e.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center gap-1">
                              <Paperclip className="w-3 h-3" /> Dosyayı görüntüle
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dava dosyası formu */}
      <Dialog open={caseDialog} onOpenChange={setCaseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCase ? "Dava Dosyasını Düzenle" : "Yeni Dava Dosyası"}</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Davalı Ad Soyad *</Label>
              <Input value={caseForm.defendant_name} onChange={(e) => setCaseForm({ ...caseForm, defendant_name: e.target.value })} />
            </div>
            <div><Label>E-posta</Label><Input value={caseForm.defendant_email} onChange={(e) => setCaseForm({ ...caseForm, defendant_email: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input value={caseForm.defendant_phone} onChange={(e) => setCaseForm({ ...caseForm, defendant_phone: e.target.value })} /></div>
            <div><Label>T.C. Kimlik No</Label><Input value={caseForm.defendant_tc_no} onChange={(e) => setCaseForm({ ...caseForm, defendant_tc_no: e.target.value })} /></div>
            <div><Label>Şehir</Label><Input value={caseForm.defendant_city} onChange={(e) => setCaseForm({ ...caseForm, defendant_city: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Adres</Label><Input value={caseForm.defendant_address} onChange={(e) => setCaseForm({ ...caseForm, defendant_address: e.target.value })} /></div>
            <div><Label>Talep Tutarı (TL)</Label><Input type="number" value={caseForm.claim_amount} onChange={(e) => setCaseForm({ ...caseForm, claim_amount: e.target.value })} /></div>
            <div><Label>Ödenmeyen Ay</Label><Input type="number" value={caseForm.unpaid_months} onChange={(e) => setCaseForm({ ...caseForm, unpaid_months: e.target.value })} /></div>
            <div>
              <Label>Durum</Label>
              <Select value={caseForm.status} onValueChange={(v) => setCaseForm({ ...caseForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Uzman Kayıt ID (varsa)</Label><Input value={caseForm.specialist_id} onChange={(e) => setCaseForm({ ...caseForm, specialist_id: e.target.value })} /></div>
            <div><Label>Mahkeme</Label><Input value={caseForm.court_name} onChange={(e) => setCaseForm({ ...caseForm, court_name: e.target.value })} /></div>
            <div><Label>Dosya No</Label><Input value={caseForm.file_no} onChange={(e) => setCaseForm({ ...caseForm, file_no: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Özet</Label><Textarea rows={3} value={caseForm.summary} onChange={(e) => setCaseForm({ ...caseForm, summary: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Notlar</Label><Textarea rows={3} value={caseForm.notes} onChange={(e) => setCaseForm({ ...caseForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCaseDialog(false)}>İptal</Button>
            <Button onClick={submitCase} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kanıt formu */}
      <Dialog open={evidenceDialog} onOpenChange={setEvidenceDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Kanıt Ekle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kategori</Label>
              <Select value={evidenceForm.category} onValueChange={(v) => setEvidenceForm({ ...evidenceForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{label(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Başlık *</Label><Input value={evidenceForm.title} onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })} /></div>
            <div><Label>Açıklama</Label><Textarea rows={4} value={evidenceForm.description} onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Olay Tarihi</Label><Input type="datetime-local" value={evidenceForm.occurred_at} onChange={(e) => setEvidenceForm({ ...evidenceForm, occurred_at: e.target.value })} /></div>
              <div>
                <Label>Önem</Label>
                <Select value={evidenceForm.importance} onValueChange={(v) => setEvidenceForm({ ...evidenceForm, importance: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="YUKSEK">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Kaynak / Referans</Label><Input value={evidenceForm.source_ref} onChange={(e) => setEvidenceForm({ ...evidenceForm, source_ref: e.target.value })} /></div>
            <div>
              <Label>Dosya / Ekran Görüntüsü</Label>
              <FileUpload accept="image/*,application/pdf" onUpload={(url) => setEvidenceForm({ ...evidenceForm, file_url: url })} currentImage={evidenceForm.file_url} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceDialog(false)}>İptal</Button>
            <Button onClick={submitEvidence}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EvidenceGroup({
  title, rows, render, onAdd,
}: {
  title: string;
  rows: any[];
  render: (row: any) => React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {title} <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
        {rows.length > 0 && (
          <Button size="sm" variant="outline" className="print:hidden" onClick={onAdd}>
            Kanıt olarak kaydet
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Kayıt bulunamadı.</p>
        ) : (
          <div className="space-y-1 text-xs max-h-64 overflow-y-auto">
            {rows.map((r, i) => <div key={i} className="py-1 border-b last:border-0">{render(r)}</div>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
