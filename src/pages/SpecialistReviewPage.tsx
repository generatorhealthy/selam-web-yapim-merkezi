import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { createSpecialtySlug } from "@/utils/doctorUtils";

interface PublicSpecialist {
  id: string;
  name: string;
  specialty: string;
  city?: string;
  profile_picture?: string;
  slug?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Hiç memnun kalmadım",
  2: "Beklentimi karşılamadı",
  3: "Orta",
  4: "Memnun kaldım",
  5: "Çok memnun kaldım",
};

const SpecialistReviewPage = () => {
  const { specialtySlug, doctorName } = useParams();
  const { toast } = useToast();
  const [specialist, setSpecialist] = useState<PublicSpecialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchSpecialist = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_public_specialist_by_slug", {
        p_slug: doctorName,
      });
      if (error) console.error("Uzman bulunamadı:", error);
      const found = Array.isArray(data) ? data[0] : data;
      setSpecialist((found as PublicSpecialist) || null);
      setLoading(false);
    };
    if (doctorName) fetchSpecialist();
  }, [doctorName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialist) return;
    if (rating === 0) {
      toast({ title: "Puan gerekli", description: "Lütfen 1-5 arası bir puan verin.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      specialist_id: specialist.id,
      reviewer_name: `${firstName} ${lastName}`.trim(),
      reviewer_email: email.trim(),
      comment: comment.trim(),
      rating,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      console.error("Değerlendirme hatası:", error);
      toast({
        title: "Gönderilemedi",
        description: "Değerlendirmeniz kaydedilemedi, lütfen tekrar deneyin.",
        variant: "destructive",
      });
      return;
    }
    setDone(true);
    toast({ title: "Teşekkürler!", description: "Değerlendirmeniz alındı, onaydan sonra yayınlanacak." });
  };

  const profilePath = specialist
    ? `/${createSpecialtySlug(specialist.specialty || "")}/${specialist.slug || doctorName}`
    : `/${specialtySlug}/${doctorName}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{specialist ? `${specialist.name} Değerlendirme | Doktorum Ol` : "Uzman Değerlendirme | Doktorum Ol"}</title>
        <meta
          name="description"
          content="Görüştüğünüz uzmanı puanlayın ve deneyiminizi paylaşın. Değerlendirmeniz diğer danışanlara yardımcı olur."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <HorizontalNavigation />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/10 to-background border-b">
          <div className="container mx-auto px-4 py-10 max-w-3xl text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Uzmanınızı Değerlendirin</h1>
            <p className="mt-2 text-muted-foreground">
              Görüşme deneyiminizi paylaşarak hem uzmanınıza hem de diğer danışanlara destek olun.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 rounded-xl bg-muted animate-pulse" />
              <div className="h-72 rounded-xl bg-muted animate-pulse" />
            </div>
          ) : !specialist ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <p className="font-medium">Uzman bulunamadı.</p>
                <p className="text-sm text-muted-foreground">Lütfen size gönderilen bağlantıyı tekrar kontrol edin.</p>
                <Button asChild variant="outline">
                  <Link to="/uzmanlar">Uzmanları Keşfet</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Specialist card */}
              <Card className="overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  {specialist.profile_picture ? (
                    <img
                      src={specialist.profile_picture}
                      alt={`${specialist.name} profil fotoğrafı`}
                      loading="lazy"
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {specialist.name?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg truncate">{specialist.name}</h2>
                    <p className="text-sm text-muted-foreground truncate">
                      {specialist.specialty}
                      {specialist.city ? ` • ${specialist.city}` : ""}
                    </p>
                    <Link to={profilePath} className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                      <ArrowLeft className="h-3 w-3" /> Uzman profiline dön
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {done ? (
                <Card>
                  <CardContent className="p-8 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
                    <h3 className="text-xl font-semibold">Değerlendirmeniz için teşekkürler!</h3>
                    <p className="text-sm text-muted-foreground">
                      Yorumunuz kısa süre içinde kontrol edilip {specialist.name} profilinde yayınlanacaktır.
                    </p>
                    <Button asChild>
                      <Link to={profilePath}>Uzman Profilini Görüntüle</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="text-center space-y-3">
                        <p className="text-sm font-medium">Görüşmeniz nasıldı?</p>
                        <div className="flex items-center justify-center gap-1.5">
                          {Array.from({ length: 5 }, (_, i) => {
                            const value = i + 1;
                            const filled = value <= (hovered || rating);
                            return (
                              <button
                                key={value}
                                type="button"
                                aria-label={`${value} yıldız`}
                                onClick={() => setRating(value)}
                                onMouseEnter={() => setHovered(value)}
                                onMouseLeave={() => setHovered(0)}
                                className="p-1 transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-9 w-9 ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-sm text-muted-foreground h-5">
                          {(hovered || rating) ? RATING_LABELS[hovered || rating] : "Puan vermek için yıldızlara dokunun"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="rev-first" className="block text-sm font-medium mb-1.5">Ad *</label>
                          <Input id="rev-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Adınız" required />
                        </div>
                        <div>
                          <label htmlFor="rev-last" className="block text-sm font-medium mb-1.5">Soyad *</label>
                          <Input id="rev-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyadınız" required />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="rev-email" className="block text-sm font-medium mb-1.5">
                          E-posta <span className="text-muted-foreground font-normal">(isteğe bağlı)</span>
                        </label>
                        <Input id="rev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" />
                      </div>

                      <div>
                        <label htmlFor="rev-comment" className="block text-sm font-medium mb-1.5">Yorumunuz *</label>
                        <Textarea
                          id="rev-comment"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={5}
                          placeholder="Uzmanınızla olan deneyiminizi kısaca paylaşın..."
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                        <Send className="h-4 w-4 mr-2" />
                        {submitting ? "Gönderiliyor..." : "Değerlendirmemi Gönder"}
                      </Button>

                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Yorumunuz kontrol edildikten sonra uzmanın profilinde yayınlanır.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SpecialistReviewPage;
