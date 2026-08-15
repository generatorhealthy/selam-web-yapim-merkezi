import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Bot,
  FlaskConical,
  AlertTriangle,
  Sparkles,
  Users,
  ShieldCheck,
  Loader2,
  MessageSquare,
  Reply,
} from "lucide-react";

const THERAPY_OPTIONS = [
  { value: "bireysel_terapi", label: "Bireysel Terapi", group: "Psikoloji" },
  { value: "cocuk_terapisi", label: "Çocuk Terapisi", group: "Psikoloji" },
  { value: "ergen_terapisi", label: "Ergen Terapisi", group: "Psikoloji" },
  { value: "iliski_danismanligi", label: "İlişki Danışmanlığı", group: "Psikoloji" },
  { value: "aile_danismanligi", label: "Aile Danışmanlığı", group: "Aile Danışmanı" },
  { value: "aile_terapisi", label: "Aile Terapisi", group: "Aile Danışmanı" },
  { value: "cift_terapisi", label: "Çift Terapisi", group: "Aile Danışmanı" },
];

interface BotSettings {
  id: string;
  enabled: boolean;
  test_mode: boolean;
  urgent_days: number;
  auto_reply_enabled: boolean;
  auto_reply_test_mode: boolean;
  auto_reply_price_text: string;
  auto_reply_general_text: string;
  auto_reply_cooldown_minutes: number;
}

interface AutoReply {
  id: string;
  session_name: string;
  chat_id: string;
  phone: string | null;
  incoming_body: string | null;
  intent: string;
  reply_text: string;
  is_test: boolean;
  error: string | null;
  created_at: string;
}

interface Candidate {
  id: string;
  name: string;
  specialty: string | null;
  city: string | null;
  monthlyReferrals: number;
  daysSinceLastReferral: number | null;
  urgent: boolean;
}

interface Step {
  from: "bot" | "client";
  text: string;
  buttons?: string[];
}

interface SimResult {
  state: string;
  usedOnlineFallback: boolean;
  steps: Step[];
  match: {
    groupLabel: string;
    therapyLabel: string;
    mode: string;
    city: string | null;
    totalInGroup: number;
    eligibleCount: number;
    urgentCount: number;
    selected: Candidate | null;
    selectionReason: string | null;
    reasonCode: string | null;
    eligible: Candidate[];
  } | null;
}

interface SessionRow {
  id: string;
  client_name: string | null;
  phone: string;
  therapy_type: string | null;
  consultation_type: string | null;
  city: string | null;
  state: string;
  selection_reason: string | null;
  is_test: boolean;
  created_at: string;
}

const STATE_LABELS: Record<string, string> = {
  completed: "Yönlendirme tamamlandı",
  declined: "Danışan istemedi",
  no_specialist: "Uygun uzman bulunamadı",
  awaiting_consent: "Onay bekleniyor",
  awaiting_online_fallback: "Online alternatif bekleniyor",
  awaiting_final_approval: "Son onay bekleniyor",
};

const stateVariant = (state: string) =>
  state === "completed" ? "default" : state === "no_specialist" ? "destructive" : "secondary";

const WhatsappBotManagement = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const [form, setForm] = useState({
    clientName: "Test Danışanı",
    phone: "",
    therapyType: "bireysel_terapi",
    consultationType: "online",
    city: "",
    consent: true,
    onlineFallback: true,
    finalApproval: true,
  });

  const [autoReplyTest, setAutoReplyTest] = useState("Fiyat nedir?");
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [autoRepliesLoading, setAutoRepliesLoading] = useState(false);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("whatsapp_bot_settings")
      .select("id, enabled, test_mode, urgent_days")
      .limit(1)
      .maybeSingle();
    if (data) setSettings(data as BotSettings);
  };

  const loadSessions = async () => {
    const { data } = await supabase
      .from("whatsapp_bot_sessions")
      .select("id, client_name, phone, therapy_type, consultation_type, city, state, selection_reason, is_test, created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    setSessions((data as SessionRow[]) || []);
  };

  useEffect(() => {
    loadSettings();
    loadSessions();
  }, []);

  const updateSettings = async (patch: Partial<BotSettings>) => {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("whatsapp_bot_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", settings.id);
    setSavingSettings(false);
    if (error) {
      toast({ title: "Ayar kaydedilemedi", description: error.message, variant: "destructive" });
      return;
    }
    setSettings({ ...settings, ...patch } as BotSettings);
    toast({ title: "Ayarlar güncellendi" });
  };

  const runSimulation = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("wa-bot-engine", {
        body: {
          action: "simulate",
          clientName: form.clientName,
          phone: form.phone || "SIMULASYON",
          therapyType: form.therapyType,
          consultationType: form.consultationType,
          city: form.consultationType === "online" ? null : form.city,
          answers: {
            consent: form.consent,
            onlineFallback: form.onlineFallback,
            finalApproval: form.finalApproval,
          },
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Simülasyon başarısız");
      setResult(data as SimResult);
      loadSessions();
    } catch (e) {
      toast({
        title: "Simülasyon hatası",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const liveActive = settings?.enabled && !settings?.test_mode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <Helmet>
        <title>WhatsApp Bot Yönetimi | Doktorumol Panel</title>
        <meta name="description" content="WhatsApp danışan yönlendirme botu ayarları, uzman eşleştirme kuralları ve test simülasyonu." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <HorizontalNavigation />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <AdminBackButton />

        <header className="flex flex-wrap items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">WhatsApp Bot Yönetimi</h1>
            <p className="text-sm text-muted-foreground">
              Danışan yönlendirme botu — uzman eşleştirme kuralları ve test simülasyonu
            </p>
          </div>
          <Badge variant={liveActive ? "default" : "secondary"} className="ml-auto">
            {liveActive ? "Canlı yayında" : "Test modu (mesaj gönderilmiyor)"}
          </Badge>
        </header>

        {!liveActive && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Güvenli mod aktif</AlertTitle>
            <AlertDescription>
              Bot şu anda gerçek danışanlara WhatsApp mesajı göndermiyor. Aşağıdaki simülasyonla akışı ve uzman
              seçim mantığını test edebilirsiniz. Canlıya almak için botu açıp test modunu kapatmanız gerekir.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ayarlar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-emerald-600" /> Bot Ayarları
              </CardTitle>
              <CardDescription>Otomatik yönlendirme botunun çalışma kuralları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <Label className="font-semibold">Bot aktif</Label>
                  <p className="text-xs text-muted-foreground">Yeni danışan başvurularında bot devreye girer</p>
                </div>
                <Switch
                  checked={!!settings?.enabled}
                  disabled={!settings || savingSettings}
                  onCheckedChange={(v) => updateSettings({ enabled: v })}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <Label className="font-semibold">Test modu</Label>
                  <p className="text-xs text-muted-foreground">
                    Açıkken hiçbir gerçek WhatsApp mesajı gönderilmez
                  </p>
                </div>
                <Switch
                  checked={!!settings?.test_mode}
                  disabled={!settings || savingSettings}
                  onCheckedChange={(v) => updateSettings({ test_mode: v })}
                />
              </div>

              <div className="space-y-2">
                <Label>Acil yönlendirme eşiği (gün)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings?.urgent_days ?? 20}
                  onChange={(e) =>
                    setSettings(settings ? { ...settings, urgent_days: Number(e.target.value) } : settings)
                  }
                  onBlur={() => settings && updateSettings({ urgent_days: settings.urgent_days })}
                  className="max-w-[140px]"
                />
                <p className="text-xs text-muted-foreground">
                  Bu süredir yönlendirme almayan uzmanlar "acil yönlendirme gerekli" listesine girer ve önce onlar seçilir.
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Uzman seçim sırası</p>
                <p>1. Başvuru türüne uygun branş (Psikoloji grubu / Aile Danışmanı)</p>
                <p>2. Görüşme şekli (online / yüz yüze) ve yüz yüzede şehir eşleşmesi</p>
                <p>3. Acil yönlendirme gerekli uzmanlar (önce hiç yönlendirme almayanlar)</p>
                <p>4. Acil yoksa bu ay en az yönlendirme alan uygun uzman</p>
              </div>
            </CardContent>
          </Card>

          {/* Simülasyon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="w-5 h-5 text-indigo-600" /> Test / Simülasyon
              </CardTitle>
              <CardDescription>Mesaj göndermeden akışı ve uzman seçimini deneyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Danışan adı</Label>
                  <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefon (opsiyonel)</Label>
                  <Input
                    value={form.phone}
                    placeholder="905xxxxxxxxx"
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Başvuru türü</Label>
                  <Select value={form.therapyType} onValueChange={(v) => setForm({ ...form, therapyType: v })}>
                    <SelectTrigger aria-label="Başvuru türü seçin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THERAPY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label} · {o.group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Görüşme şekli</Label>
                  <Select
                    value={form.consultationType}
                    onValueChange={(v) => setForm({ ...form, consultationType: v })}
                  >
                    <SelectTrigger aria-label="Görüşme şekli seçin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="yuz_yuze">Yüz yüze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.consultationType !== "online" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Şehir</Label>
                    <Input
                      value={form.city}
                      placeholder="Örn. İzmir"
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Danışan cevapları</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Yönlendirme onayı veriyor</span>
                  <Switch checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Şehrinde uzman yoksa online kabul ediyor</span>
                  <Switch
                    checked={form.onlineFallback}
                    onCheckedChange={(v) => setForm({ ...form, onlineFallback: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uzmanı son onayla kabul ediyor</span>
                  <Switch
                    checked={form.finalApproval}
                    onCheckedChange={(v) => setForm({ ...form, finalApproval: v })}
                  />
                </div>
              </div>

              <Button onClick={runSimulation} disabled={running} className="w-full">
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Simülasyon çalışıyor
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Simülasyonu Başlat
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {result && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="w-5 h-5 text-emerald-600" /> WhatsApp Konuşması (önizleme)
                </CardTitle>
                <CardDescription>
                  Sonuç:{" "}
                  <Badge variant={stateVariant(result.state)}>{STATE_LABELS[result.state] || result.state}</Badge>
                  {result.usedOnlineFallback && (
                    <Badge variant="outline" className="ml-2">Online alternatif kullanıldı</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.steps.map((s, i) => (
                  <div key={i} className={s.from === "bot" ? "flex justify-start" : "flex justify-end"}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                        s.from === "bot"
                          ? "bg-muted text-foreground rounded-tl-sm"
                          : "bg-emerald-600 text-primary-foreground rounded-tr-sm"
                      }`}
                    >
                      {s.text}
                      {s.buttons && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {s.buttons.map((b) => (
                            <span
                              key={b}
                              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-indigo-600" /> Uzman Seçim Gerekçesi
                </CardTitle>
                <CardDescription>Karar yalnızca platformdaki kayıtlı uzmanlar üzerinden verilir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.match ? (
                  <>
                    <div className="grid gap-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Başvuru türü:</span> {result.match.therapyLabel}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Hedef branş:</span> {result.match.groupLabel}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Görüşme:</span>{" "}
                        {result.match.mode === "online" ? "Online" : `Yüz yüze${result.match.city ? ` · ${result.match.city}` : ""}`}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Branşta uzman:</span> {result.match.totalInGroup} ·{" "}
                        <span className="text-muted-foreground">uygun:</span> {result.match.eligibleCount} ·{" "}
                        <span className="text-muted-foreground">acil:</span> {result.match.urgentCount}
                      </p>
                    </div>

                    {result.match.selected ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <p className="font-semibold text-foreground">{result.match.selected.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.match.selected.specialty} {result.match.selected.city ? `· ${result.match.selected.city}` : ""}
                        </p>
                        <p className="mt-2 text-sm">{result.match.selectionReason}</p>
                      </div>
                    ) : (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Uzman bulunamadı</AlertTitle>
                        <AlertDescription>{result.match.selectionReason}</AlertDescription>
                      </Alert>
                    )}

                    {result.match.eligible.length > 0 && (
                      <div className="overflow-x-auto">
                        <p className="mb-2 text-sm font-semibold">Sıralanmış uygun uzmanlar</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Uzman</TableHead>
                              <TableHead>Bu ay</TableHead>
                              <TableHead>Son yönl.</TableHead>
                              <TableHead>Durum</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.match.eligible.map((c, i) => (
                              <TableRow key={c.id}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell className="whitespace-nowrap">{c.name}</TableCell>
                                <TableCell>{c.monthlyReferrals}</TableCell>
                                <TableCell>
                                  {c.daysSinceLastReferral === null ? "Hiç" : `${c.daysSinceLastReferral} gün önce`}
                                </TableCell>
                                <TableCell>
                                  {c.urgent ? (
                                    <Badge variant="destructive">Acil</Badge>
                                  ) : (
                                    <Badge variant="secondary">Normal</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Danışan yönlendirme istemediği için uzman eşleştirmesi yapılmadı.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Son Bot Kayıtları</CardTitle>
            <CardDescription>Test ve canlı oturumların son 25 kaydı</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz kayıt yok.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Danışan</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Gerekçe</TableHead>
                    <TableHead>Kayıt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(s.created_at).toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{s.client_name || s.phone}</TableCell>
                      <TableCell className="text-xs">
                        {s.therapy_type} {s.consultation_type ? `· ${s.consultation_type}` : ""}
                        {s.city ? ` · ${s.city}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stateVariant(s.state)}>{STATE_LABELS[s.state] || s.state}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                        {s.selection_reason || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.is_test ? "outline" : "default"}>{s.is_test ? "Test" : "Canlı"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default WhatsappBotManagement;
