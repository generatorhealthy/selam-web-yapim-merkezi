import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Mail, Phone, FileText, Upload, CheckCircle2, Building2, Users, TrendingUp, Heart } from "lucide-react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const POSITIONS = ["Müşteri Temsilcisi"];

const Career = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    position: POSITIONS[0],
    cover_letter: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Lütfen sadece PDF formatında CV yükleyin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("CV dosyası 5MB'dan küçük olmalıdır.");
      return;
    }
    setCvFile(file);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // strip "data:application/pdf;base64,"
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      toast.error("Lütfen CV dosyanızı (PDF) yükleyin.");
      return;
    }
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Lütfen ad soyad, e-posta ve telefon alanlarını doldurun.");
      return;
    }

    setSubmitting(true);
    try {
      const cv_base64 = await fileToBase64(cvFile);
      const { data, error } = await supabase.functions.invoke("send-career-application", {
        body: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          position: form.position,
          cover_letter: form.cover_letter.trim() || undefined,
          cv_base64,
          cv_filename: cvFile.name,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setSubmitted(true);
      toast.success("Başvurunuz başarıyla iletildi!");
    } catch (err: any) {
      console.error("Career submit error:", err);
      toast.error(err.message || "Başvuru gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Kariyer - Doktorum Ol</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <HorizontalNavigation />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <div className="relative container mx-auto px-4 py-20 md:py-28 text-center text-white">
            <Badge className="bg-white/20 text-white border-white/30 mb-4 backdrop-blur-sm">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Kariyer Fırsatları
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
              Birlikte <span className="text-blue-200">Büyüyelim</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Türkiye'nin önde gelen sağlık platformunda kariyer fırsatları sizi bekliyor.
              Tutkulu, gelişime açık ve fark yaratmak isteyen ekip arkadaşları arıyoruz.
            </p>
          </div>
        </section>

        {/* Open position */}
        <section className="container mx-auto px-4 pb-12">
          <Card className="max-w-4xl mx-auto border-0 shadow-xl bg-white">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Badge className="bg-emerald-100 text-emerald-700 mb-2">Açık Pozisyon</Badge>
                  <h3 className="text-2xl font-bold text-slate-800">Müşteri Temsilcisi</h3>
                  <p className="text-slate-600 mt-1">Tam zamanlı · Ofis · İstanbul</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Aradığımız Özellikler
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• İletişim becerileri güçlü</li>
                    <li>• Müşteri odaklı yaklaşım</li>
                    <li>• Takım çalışmasına yatkın</li>
                    <li>• Diksiyonu düzgün</li>
                    <li>• Bilgisayar kullanımı iyi düzeyde</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> İş Tanımı
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Müşteri taleplerini karşılamak</li>
                    <li>• Telefonla danışan/uzman görüşmeleri</li>
                    <li>• Randevu ve takip işlemleri</li>
                    <li>• CRM sistemine veri girişi</li>
                    <li>• Raporlama ve günlük takip</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Application Form */}
        <section className="container mx-auto px-4 pb-20">
          <Card className="max-w-3xl mx-auto border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Başvuru Formu
              </CardTitle>
              <p className="text-blue-100 text-sm mt-1">Bilgilerinizi eksiksiz doldurun. CV'nizi PDF formatında yükleyin.</p>
            </CardHeader>
            <CardContent className="p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Başvurunuz Alındı!</h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    Başvurunuz İK ekibimize iletildi. Uygun bulunması halinde en kısa sürede sizinle iletişime geçeceğiz.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="full_name">Ad Soyad *</Label>
                      <Input
                        id="full_name"
                        required
                        maxLength={100}
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Pozisyon *</Label>
                      <select
                        id="position"
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="email"><Mail className="w-3.5 h-3.5 inline mr-1" /> E-posta *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        maxLength={255}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="ornek@mail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone"><Phone className="w-3.5 h-3.5 inline mr-1" /> Telefon *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        maxLength={20}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cover_letter">Ön Yazı (Opsiyonel)</Label>
                    <Textarea
                      id="cover_letter"
                      rows={5}
                      maxLength={2000}
                      value={form.cover_letter}
                      onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
                      placeholder="Kendinizi ve neden bu pozisyona uygun olduğunuzu kısaca anlatın..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="cv">CV (PDF) *</Label>
                    <div className="mt-1.5 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                      <input
                        id="cv"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="cv" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-blue-500" />
                        {cvFile ? (
                          <>
                            <span className="font-medium text-slate-800">{cvFile.name}</span>
                            <span className="text-xs text-slate-500">{(cvFile.size / 1024).toFixed(0)} KB</span>
                            <span className="text-xs text-blue-600 underline">Farklı bir dosya seç</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-slate-700">CV dosyanızı buraya yükleyin</span>
                            <span className="text-xs text-slate-500">Sadece PDF · Maksimum 5 MB</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg"
                    >
                      {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                    </Button>
                    <p className="text-xs text-slate-500 text-center mt-3">
                      Başvurunuz info@doktorumol.com.tr adresine iletilecektir.
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Career;
