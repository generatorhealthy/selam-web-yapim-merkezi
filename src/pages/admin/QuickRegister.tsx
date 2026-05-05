import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FileUpload from "@/components/FileUpload";
import { useUserRole } from "@/hooks/useUserRole";
import { ArrowLeft, Sparkles, Wand2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const PLACEHOLDER = `Ad Soyad: Dr. Ahmet Yılmaz
Telefon Numarası: 0532 111 22 33
Eposta: ahmet@example.com
Şifre: Guclu123Sifre
Kullanıcı Rolü: Uzman

Uzmanlık: Klinik Psikolog
Şehir: İstanbul
Eğitim: Psikoloji
Üniversite: İstanbul Üniversitesi
Deneyim: 8

Danışmanlık Türü: online ve yüz yüze

Adres: Kadıköy / İstanbul, Bağdat Caddesi No:123
Sertifikalar: Bilişsel Davranışçı Terapi Sertifikası, EMDR Sertifikası`;

const QuickRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading } = useUserRole();

  const [rawText, setRawText] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [result, setResult] = useState<{ userId?: string; specialistId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && userProfile) {
      if (!["admin", "staff"].includes(userProfile.role) || !userProfile.is_approved) {
        toast({
          title: "Yetki Hatası",
          description: "Bu sayfaya erişim yetkiniz yok.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [userProfile, loading, navigate, toast]);

  const handlePreview = async () => {
    if (!rawText.trim()) {
      toast({ title: "Uyarı", description: "Lütfen bilgileri yapıştırın.", variant: "destructive" });
      return;
    }
    setParsing(true);
    setError(null);
    setParsed(null);
    try {
      const { data, error } = await supabase.functions.invoke("quick-register-specialist", {
        body: { rawText, mode: "preview" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setParsed(data.parsed);
      toast({ title: "Hazır", description: "Bilgiler ayrıştırıldı, kontrol edin." });
    } catch (e: any) {
      setError(e.message || "AI ayrıştırma hatası");
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!rawText.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("quick-register-specialist", {
        body: { rawText, profile_picture: profilePicture || null, mode: "create" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ userId: data.userId, specialistId: data.specialistId });
      toast({
        title: "Başarılı",
        description: "Kullanıcı ve uzman profili oluşturuldu!",
      });
    } catch (e: any) {
      setError(e.message || "Oluşturma hatası");
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setRawText("");
    setProfilePicture("");
    setParsed(null);
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/divan_paneli/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-600" />
            Hızlı Kayıt (AI)
          </h1>
        </div>

        <Card className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              Uzmanın tüm bilgilerini aşağıdaki kutuya yapıştırın. AI bilgileri ayrıştırır, biyografi ve SEO meta verilerini otomatik üretir, ardından <strong>kullanıcı hesabını ve uzman profilini tek seferde</strong> oluşturur.
            </p>
            <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>Çalışma saatleri otomatik: <strong>10:00 - 19:00, tüm günler</strong></li>
              <li>Danışmanlık türünde "online ve yüz yüze" yazarsanız ikisi de seçilir</li>
              <li>Profil resmini aşağıdan yükleyebilirsiniz</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              1. Bilgileri Yapıştır
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rawText">Uzman Bilgileri (serbest format)</Label>
              <Textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={16}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>Profil Resmi (opsiyonel)</Label>
              <FileUpload accept="image/*" onUpload={setProfilePicture} currentImage={profilePicture} />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handlePreview}
                disabled={parsing || creating || !rawText.trim()}
                variant="outline"
              >
                {parsing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ayrıştırılıyor...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> AI ile Önizle</>
                )}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={parsing || creating || !rawText.trim() || !!result}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {creating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Oluşturuluyor...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Oluştur (Kullanıcı + Uzman)</>
                )}
              </Button>
              {(parsed || result) && (
                <Button onClick={reset} variant="ghost">Yeni Kayıt</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 whitespace-pre-wrap">{error}</div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex gap-2 items-start mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Başarılı!</h3>
                  <p className="text-sm text-green-800">Kullanıcı ve uzman profili oluşturuldu.</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/divan_paneli/specialists/edit/${result.specialistId}`}>Uzmanı Düzenle</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/divan_paneli/specialists">Uzman Listesi</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {parsed && !result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                2. AI Ayrıştırma Sonucu (Önizleme)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Field label="Ad Soyad" value={parsed.name} />
                <Field label="E-posta" value={parsed.email} />
                <Field label="Şifre" value={parsed.password ? "••••••••" : "—"} />
                <Field label="Telefon" value={parsed.phone} />
                <Field label="Rol" value={parsed.role} />
                <Field label="Uzmanlık" value={parsed.specialty} />
                <Field label="Şehir" value={parsed.city} />
                <Field label="Eğitim" value={parsed.education} />
                <Field label="Üniversite" value={parsed.university} />
                <Field label="Deneyim (yıl)" value={parsed.experience?.toString()} />
                <Field
                  label="Danışmanlık"
                  value={[
                    parsed.online_consultation && "Online",
                    parsed.face_to_face_consultation && "Yüz Yüze",
                  ].filter(Boolean).join(", ") || "—"}
                />
                <Field label="Çalışma" value="10:00 - 19:00, Her Gün (otomatik)" />
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Adres</Label>
                  <p className="text-sm">{parsed.address || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Sertifikalar</Label>
                  <p className="text-sm">{parsed.certifications || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">SEO Title ({parsed.seo_title?.length || 0}/65)</Label>
                  <p className="text-sm font-medium">{parsed.seo_title}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">SEO Description ({parsed.seo_description?.length || 0}/145)</Label>
                  <p className="text-sm">{parsed.seo_description}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">SEO Keywords</Label>
                  <p className="text-sm">{parsed.seo_keywords}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Biyografi (AI üretti)</Label>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{parsed.bio}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                ✓ Bilgileri kontrol ettin mi? Yukarıdaki <strong>"Oluştur (Kullanıcı + Uzman)"</strong> butonuna basarak kaydı tamamla.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="border rounded p-2 bg-white">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-medium truncate">{value || <span className="text-gray-400">—</span>}</div>
  </div>
);

export default QuickRegister;
