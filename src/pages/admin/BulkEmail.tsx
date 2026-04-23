import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Send, Users, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface Recipient { email: string; name?: string; }

const parseRecipients = (raw: string): Recipient[] => {
  const lines = raw.split(/\r?\n|;|,/).map(l => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const line of lines) {
    // formats: "email", "Name <email>", "Name - email", "email Name"
    let name: string | undefined;
    let email: string | undefined;
    const angle = line.match(/^(.+?)\s*<\s*([^>]+)\s*>$/);
    const dash = line.match(/^(.+?)\s*[-|]\s*(.+)$/);
    const tab = line.match(/^(.+?)\s+([^\s]+@[^\s]+)$/);
    if (angle) { name = angle[1].trim(); email = angle[2].trim(); }
    else if (dash && /@/.test(dash[2])) { name = dash[1].trim(); email = dash[2].trim(); }
    else if (dash && /@/.test(dash[1])) { email = dash[1].trim(); name = dash[2].trim(); }
    else if (tab) { name = tab[1].trim(); email = tab[2].trim(); }
    else { email = line.trim(); }
    email = email?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: name || undefined });
  }
  return out;
};

const BulkEmail = () => {
  const { userProfile, loading } = useUserRole();
  const [rawList, setRawList] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [results, setResults] = useState<Array<{ email: string; status: string; error?: string }>>([]);

  const recipients = useMemo(() => parseRecipients(rawList), [rawList]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Yükleniyor...</div>;
  if (!userProfile || userProfile.role !== 'admin') return <Navigate to="/divan_paneli/dashboard" replace />;

  const handleSend = async () => {
    if (recipients.length === 0) { toast.error("Geçerli alıcı bulunamadı"); return; }
    if (!subject.trim()) { toast.error("Konu zorunlu"); return; }
    if (!body.trim()) { toast.error("Mesaj zorunlu"); return; }
    if (!confirm(`${recipients.length} kişiye ayrı ayrı mail gönderilecek. Onaylıyor musunuz?`)) return;

    setSending(true);
    setProgress(null);
    setResults([]);
    try {
      // Convert plain text body to HTML (preserve paragraphs and line breaks)
      const htmlContent = body
        .split(/\n{2,}/)
        .map(p => `<p style="margin:0 0 14px;">${p.replace(/\n/g, '<br/>').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
        .join('');

      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: { recipients, subject, htmlContent, plainText: body },
      });
      if (error) throw error;
      setProgress({ sent: data.sent, failed: data.failed, total: data.total });
      setResults(data.results || []);
      toast.success(`${data.sent}/${data.total} e-posta gönderildi`);
    } catch (e: any) {
      toast.error(`Hata: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Toplu E-posta Gönder | Divan Paneli</title></Helmet>
      <HorizontalNavigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10"><Mail className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">Toplu E-posta Gönder</h1>
            <p className="text-sm text-muted-foreground">info@doktorumol.com.tr adresinden her alıcıya ayrı ayrı gönderim yapılır.</p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Spam koruması için kurallar</AlertTitle>
          <AlertDescription className="text-sm">
            • Her alıcıya <strong>ayrı ayrı</strong> gönderilir (BCC kullanılmaz).<br/>
            • Saniyede 1-2 mail (throttling) — büyük listelerde bekleyin.<br/>
            • <strong>List-Unsubscribe</strong> header eklenir, HTML + düz metin birlikte gönderilir.<br/>
            • SPF/DKIM ayarlı <strong>info@doktorumol.com.tr</strong> kullanılır.<br/>
            • Promosyon dilinden kaçının (BÜYÜK HARF, çok ünlem, "BEDAVA", "HEMEN TIKLA" vb. spam tetikler).
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Alıcılar</CardTitle>
              <CardDescription>Her satıra bir kişi. Format: <code>email</code> veya <code>Ad Soyad - email</code> veya <code>Ad &lt;email&gt;</code></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={rawList}
                onChange={(e) => setRawList(e.target.value)}
                placeholder={"ornek1@mail.com\nDr. Ahmet Yılmaz - ahmet@mail.com\nDr. Ayşe <ayse@mail.com>"}
                rows={14}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between text-sm">
                <Badge variant="secondary">{recipients.length} geçerli alıcı</Badge>
                {recipients.length > 0 && (
                  <span className="text-muted-foreground">~{Math.ceil(recipients.length * 0.6)} sn sürer</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mesaj</CardTitle>
              <CardDescription>"Sayın [Ad]" hitabı otomatik eklenir. Düz metin yazın, satır araları korunur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="subject">Konu</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder="Örn: Doktorum Ol Ücretsiz Üyelik Hakkında" />
              </div>
              <div>
                <Label htmlFor="body">Mesaj İçeriği</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={5000} placeholder="Mesajınızı buraya yazın..." />
                <p className="text-xs text-muted-foreground mt-1">{body.length}/5000 karakter</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setRawList(""); setSubject(""); setBody(""); setResults([]); setProgress(null); }} disabled={sending}>Temizle</Button>
          <Button onClick={handleSend} disabled={sending || recipients.length === 0} size="lg">
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Gönderiliyor..." : `${recipients.length} Kişiye Gönder`}
          </Button>
        </div>

        {progress && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Gönderim Sonucu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 rounded-lg bg-muted"><div className="text-2xl font-bold">{progress.total}</div><div className="text-sm text-muted-foreground">Toplam</div></div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950"><div className="text-2xl font-bold text-green-600">{progress.sent}</div><div className="text-sm text-muted-foreground">Gönderildi</div></div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950"><div className="text-2xl font-bold text-red-600">{progress.failed}</div><div className="text-sm text-muted-foreground">Başarısız</div></div>
              </div>
              {results.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="font-mono">{r.email}</span>
                      {r.status === 'sent'
                        ? <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Gönderildi</Badge>
                        : <span className="flex items-center gap-2"><Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Hata</Badge><span className="text-xs text-muted-foreground truncate max-w-xs">{r.error}</span></span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BulkEmail;
