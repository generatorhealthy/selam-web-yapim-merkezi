import { isBlockedPhone } from "@/utils/blockedNumbers";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, User, Phone, Heart } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const CONSULTATION_TYPES = [
  { value: "Bireysel Terapi", label: "Bireysel Terapi", emoji: "🧠" },
  { value: "İlişki Danışmanlığı", label: "İlişki Danışmanlığı", emoji: "💞" },
  { value: "Çift Terapisi", label: "Çift Terapisi", emoji: "👫" },
  { value: "Çocuk Terapisi", label: "Çocuk Terapisi", emoji: "🧒" },
  { value: "Aile Danışmanlığı", label: "Aile Danışmanlığı", emoji: "👨‍👩‍👧" },
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Ad Soyad en az 2 karakter olmalı").max(100),
  phone: z.string().trim().min(10, "Geçerli bir telefon numarası girin").max(20),
  therapy_type: z.string().min(1, "Danışmanlık türü seçin"),
});

const DanismanlikRandevusuAl = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [therapyType, setTherapyType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ full_name: fullName, phone, therapy_type: therapyType });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (isBlockedPhone(parsed.data.phone)) {
      toast.error("Bu telefon numarası ile başvuru oluşturulamıyor.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("danisan_basvurulari").insert({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        therapy_type: parsed.data.therapy_type,
        consultation_type: "online",
        source: "reapply-form",
        status: "reapplied",
        lead_date: new Date().toISOString(),
      });
      if (error) throw error;
      setDone(true);
      toast.success("Başvurunuz alındı. En kısa sürede sizi arayacağız.");
    } catch (err: any) {
      console.error(err);
      toast.error("Başvuru gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <Helmet>
          <title>Başvurunuz Alındı - Doktorumol.com.tr</title>
          <meta name="description" content="Danışmanlık başvurunuz başarıyla alındı." />
        </Helmet>
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Başvurunuz Alındı</h1>
            <p className="text-gray-600">
              Uzman ekibimiz en kısa sürede sizi arayarak size en uygun danışmanı yönlendirecektir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4">
      <Helmet>
        <title>Danışmanlık Randevusu Al - Doktorumol.com.tr</title>
        <meta name="description" content="Size en uygun uzmanla eşleştirmemiz için başvurunuzu bırakın. Uzman ekibimiz sizi arayacaktır." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-xl mx-auto">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Danışmanlık Randevusu Al
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Bilgilerinizi bırakın, uzman ekibimiz sizi en kısa sürede arayarak size en uygun danışmanla eşleştirsin.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4" /> Ad Soyad *
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız ve soyadınız"
                  className="h-12 rounded-xl"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="w-4 h-4" /> Telefon *
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                  className="h-12 rounded-xl"
                  maxLength={20}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Almak istediğiniz danışmanlık tipi? *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONSULTATION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTherapyType(t.value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left",
                        therapyType === t.value
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      )}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-13 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-base"
              >
                {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Formu göndererek sizinle iletişime geçmemize izin vermiş olursunuz.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DanismanlikRandevusuAl;
