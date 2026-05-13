import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

const DEFAULT_MESSAGE = `Merhaba Dr. {{ad_soyad}} 👋

Doktorum Ol mobil uygulaması artık Google Play ve App Store'da! 🎉

Uygulama ile:
✅ Randevularınızı tek dokunuşla yönetin
✅ Danışan takibinizi cebinizden yapın
✅ Danışanlarınızla anlık iletişim kurun
✅ Profilinizi binlerce danışana ulaştırın
🤝 Platformumuz üzerinden size düzenli *danışan yönlendirmesi* yapıyoruz

Henüz uzman kaydınızı tamamlamadığınızı fark ettik. Türkiye'nin en hızlı büyüyen *danışan yönlendirme platformunda* yerinizi alın — biz size danışan getirelim, siz işinize odaklanın.

📱 Android için indir:
https://play.google.com/store/apps/details?id=app.lovable.doktorumol

🍎 iPhone için indir:
https://apps.apple.com/tr/app/doktorum-ol/id6762599027

🔗 Uzman kaydınızı tamamlayın:
https://doktorumol.com.tr/kayit-ol

Sorularınız için bu numaradan bize yazabilirsiniz.

Doktorum Ol Ekibi`;

type Recipient = { phone: string; name: string };
type Status = "pending" | "sending" | "success" | "failed";
type ResultRow = Recipient & { status: Status; error?: string };

const normalizePhoneToWa = (raw: string): string | null => {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "9" + digits;
  if (digits.length === 10) return "90" + digits;
  return null;
};

const parseRecipients = (raw: string): Recipient[] => {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const phone = parts[0] || "";
      const name = parts.slice(1).join(" ").trim();
      return { phone, name };
    })
    .filter((r) => r.phone);
};

const WhatsappBulkSend = () => {
  const [rawInput, setRawInput] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [delayMs, setDelayMs] = useState(7000);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const recipients = useMemo(() => parseRecipients(rawInput), [rawInput]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("waha-proxy", {
          body: { action: "sessions.list" },
        });
        if (error) throw error;
        const list = Array.isArray((data as any)?.data) ? (data as any).data : [];
        setSessions(list);
        const working = list.find((s: any) => String(s?.status || "").toUpperCase() === "WORKING");
        if (working) setSessionName(working.name);
      } catch (e: any) {
        toast.error("WhatsApp oturumları yüklenemedi: " + (e?.message || e));
      }
    })();
  }, []);

  const handleSend = async () => {
    if (!sessionName) {
      toast.error("Aktif bir WhatsApp oturumu seçin");
      return;
    }
    if (!recipients.length) {
      toast.error("En az bir alıcı girin");
      return;
    }
    if (!message.trim()) {
      toast.error("Mesaj boş olamaz");
      return;
    }
    if (!confirm(`${recipients.length} kişiye WhatsApp mesajı gönderilecek. Devam edilsin mi?`)) {
      return;
    }

    setSending(true);
    const initial: ResultRow[] = recipients.map((r) => ({ ...r, status: "pending" }));
    setResults(initial);
    setProgress({ done: 0, total: recipients.length });

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      setResults((prev) => prev.map((x, idx) => (idx === i ? { ...x, status: "sending" } : x)));

      const wa = normalizePhoneToWa(r.phone);
      if (!wa) {
        setResults((prev) =>
          prev.map((x, idx) => (idx === i ? { ...x, status: "failed", error: "Geçersiz telefon" } : x))
        );
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      const text = message.replace(/\{\{\s*ad_soyad\s*\}\}/gi, r.name || "");
      const chatId = `${wa}@c.us`;

      try {
        const { data, error } = await supabase.functions.invoke("waha-proxy", {
          body: {
            action: "sendText",
            sessionName,
            payload: { chatId, text },
          },
        });
        const ok = !error && (data as any)?.success !== false;
        if (!ok) {
          const err =
            error?.message ||
            (data as any)?.error ||
            (data as any)?.data?.message ||
            "Gönderim hatası";
          throw new Error(String(err));
        }
        setResults((prev) =>
          prev.map((x, idx) => (idx === i ? { ...x, status: "success" } : x))
        );
      } catch (e: any) {
        setResults((prev) =>
          prev.map((x, idx) =>
            idx === i ? { ...x, status: "failed", error: e?.message || String(e) } : x
          )
        );
      }

      setProgress((p) => ({ ...p, done: p.done + 1 }));

      if (i < recipients.length - 1) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    setSending(false);
    toast.success("Toplu gönderim tamamlandı");
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <Helmet>
        <title>Toplu WhatsApp Gönderimi - Admin</title>
      </Helmet>
      <AdminBackButton />

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Toplu WhatsApp Gönderimi</h1>
        <p className="text-muted-foreground mt-1">
          Numara ve isim listesi yapıştırın, mesaj şablonunu düzenleyin ve gönderin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Alıcı Listesi</CardTitle>
            <CardDescription>
              Her satıra bir kayıt: <code>telefon, ad soyad</code>
              <br />
              Örn: <code>05551234567, Dr. Ahmet Yılmaz</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={"05551234567, Dr. Ahmet Yılmaz\n05332220011, Dr. Ayşe Kaya"}
              className="min-h-[220px] font-mono text-sm"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{recipients.length} alıcı</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Mesaj & Ayarlar</CardTitle>
            <CardDescription>
              <code>{`{{ad_soyad}}`}</code> yer tutucusu otomatik doldurulur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>WhatsApp Oturumu</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              >
                <option value="">— Seçin —</option>
                {sessions.map((s: any) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({String(s.status || "").toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Mesajlar Arası Bekleme (ms)</Label>
              <Input
                type="number"
                min={2000}
                step={500}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value) || 7000)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Spam/ban riskini azaltmak için 5-10 saniye önerilir.
              </p>
            </div>
            <div>
              <Label>Mesaj Şablonu</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[260px] text-sm"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !recipients.length || !sessionName}
              className="w-full"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor... ({progress.done}/{progress.total})
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {recipients.length} Kişiye Gönder
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Gönderim Raporu</CardTitle>
            <CardDescription>
              <span className="text-green-600 font-medium">{successCount} başarılı</span>
              {" • "}
              <span className="text-red-600 font-medium">{failedCount} başarısız</span>
              {" • "}
              <span>{results.length - successCount - failedCount} bekliyor</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md divide-y max-h-[420px] overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <div className="w-5">
                    {r.status === "success" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {r.status === "failed" && <XCircle className="w-5 h-5 text-red-600" />}
                    {r.status === "sending" && <Loader2 className="w-5 h-5 animate-spin" />}
                    {r.status === "pending" && <Clock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.name || "(isimsiz)"}</div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
                  </div>
                  {r.error && (
                    <div className="text-xs text-red-600 max-w-[40%] truncate" title={r.error}>
                      {r.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsappBulkSend;
