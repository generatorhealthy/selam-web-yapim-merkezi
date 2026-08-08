import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  MessageCircle,
  Mail,
  Video,
  MapPin,
  Clock,
  Send,
  ArrowUpRight,
  CheckCircle,
  Headphones,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import officeImage from "@/assets/contact-office.jpg";

const CALL_CENTER_NUMBER = "0530 823 22 75";
const CALL_CENTER_TEL = "+905308232275";
const WHATSAPP_NUMBER = "905308232275";
const EMAIL = "info@doktorumol.com.tr";
const ADDRESS = "İstanbul, Türkiye";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: dbError } = await supabase.from("specialist_applications").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject || null,
          message: formData.message,
          source: "contact_form",
        },
      ]);
      if (dbError) console.error("DB kayıt hatası:", dbError);

      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject || "İletişim Formu Mesajı",
          message: formData.message,
        },
      });

      if (error) {
        console.error("Supabase Function Error:", error);
        throw new Error(error.message || "E-posta gönderim hatası");
      }

      console.log("Email sent successfully:", data);

      toast({
        title: "Mesaj Gönderildi",
        description: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Hata",
        description: `Mesaj gönderilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contactCards = [
    {
      icon: Phone,
      title: "Bizi Arayın",
      value: CALL_CENTER_NUMBER,
      href: `tel:${CALL_CENTER_TEL}`,
      description: "Doğrudan arayarak destek alabilirsiniz.",
    },
    {
      icon: MessageCircle,
      title: "Mesaj Gönderin",
      value: "WhatsApp",
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      description: "WhatsApp üzerinden hızlıca iletişime geçin.",
    },
    {
      icon: Mail,
      title: "E-posta Gönderin",
      value: EMAIL,
      href: `mailto:${EMAIL}`,
      description: "Her türlü sorunuz için bize e-posta gönderin.",
    },
    {
      icon: Video,
      title: "Görüşme Planlayın",
      value: "Online / Yüz Yüze",
      href: "/danismanlik-randevusu-al",
      description: "Size uygun bir saatte görüşme planlayın.",
    },
  ];

  const benefits = [
    { icon: Headphones, text: "7/24 uzman destek hattı" },
    { icon: Clock, text: "Hafta içi ve cumartesi 09:00 - 18:00" },
    { icon: Shield, text: "Güvenli ve hızlı geri dönüş" },
  ];

  return (
    <>
      <Helmet>
        <title>İletişim | Doktorum Ol Randevu Sitesi</title>
        <meta
          name="description"
          content="Doktorum Ol ile iletişime geçin. Uzmanlara danışan yönlendirme, üyelik ve randevu sistemleri hakkında bilgi alın."
        />
        <meta property="og:title" content="İletişim | Doktorum Ol Randevu Sitesi" />
        <meta
          property="og:description"
          content="Doktorum Ol ile iletişime geçin. Uzmanlara danışan yönlendirme, üyelik ve randevu sistemleri hakkında bilgi alın."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <HorizontalNavigation />

        <main className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-14 md:mb-20">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
                İletişim
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Uzmanlara danışan yönlendirme, üyelik ve randevu sistemlerimiz hakkında
                bilgi almak için bizimle iletişime geçin. En kısa sürede size dönüş yapacağız.
              </p>
            </div>

            {/* Location / Office Card */}
            <Card className="overflow-hidden border border-border/60 shadow-sm rounded-3xl mb-8 md:mb-12">
              <div className="grid md:grid-cols-2">
                <div className="relative h-64 md:h-auto min-h-[360px]">
                  <img
                    src={officeImage}
                    alt="Doktorum Ol ofisi"
                    className="absolute inset-0 w-full h-full object-cover"
                    width={1200}
                    height={800}
                    loading="lazy"
                  />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md rounded-full text-sm font-medium text-foreground shadow-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      {ADDRESS}
                    </div>
                  </div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center bg-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      Ofis
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Sizin için buradayız
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    Danışan ve uzman memnuniyeti odaklı ekibimiz, tüm soru ve önerileriniz
                    için destek sağlamaktadır. Ofisimizi ziyaret edebilir veya çevrimiçi
                    kanallardan bize ulaşabilirsiniz.
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-fit h-12 px-7 rounded-full bg-foreground text-primary-foreground hover:bg-foreground/90 font-semibold gap-2">
                      Yol tarifi al
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </Card>

            {/* Contact Method Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
              {contactCards.map((card) => (
                <Link
                  key={card.title}
                  to={card.href}
                  target={card.href.startsWith("http") || card.href.startsWith("mailto") || card.href.startsWith("tel") ? "_blank" : undefined}
                  rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group"
                >
                  <Card className="h-full border border-border/60 shadow-sm rounded-3xl hover:shadow-md hover:border-primary/20 transition-all duration-200 bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <card.icon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">{card.title}</h3>
                      <p className="text-foreground font-medium mb-2">{card.value}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Form + Info Section */}
            <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
              {/* Left: Info */}
              <Card className="border border-border/60 shadow-sm rounded-3xl bg-card h-fit">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Send className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Bize Yazın</h2>
                      <p className="text-sm text-muted-foreground">En kısa sürede dönüş yapacağız</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-8">
                    Üyelik, danışan yönlendirme, ödeme, profil yönetimi veya teknik konularda
                    destek almak için formu doldurun. Ekibimiz talebinizi en hızlı şekilde
                    değerlendirecektir.
                  </p>

                  <div className="space-y-4">
                    {benefits.map((benefit) => (
                      <div
                        key={benefit.text}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shrink-0">
                          <benefit.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{benefit.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Çalışma Saatleri</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Pazartesi - Cuma: 09:00 - 18:00</p>
                          <p>Cumartesi: 09:00 - 18:00</p>
                          <p>Pazar: Kapalı</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Form */}
              <Card className="border border-border/60 shadow-sm rounded-3xl bg-card">
                <CardContent className="p-8 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground font-medium">
                          Ad Soyad <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Adınız Soyadınız"
                          required
                          className="h-12 rounded-xl border-input bg-background focus-visible:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">
                          E-posta <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="ornek@email.com"
                          required
                          className="h-12 rounded-xl border-input bg-background focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground font-medium">
                          Telefon <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="05XX XXX XX XX"
                          required
                          className="h-12 rounded-xl border-input bg-background focus-visible:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-foreground font-medium">
                          Konu
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Mesaj konusu"
                          className="h-12 rounded-xl border-input bg-background focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-foreground font-medium">
                        Mesaj <span className="text-primary">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Mesajınızı yazın..."
                        rows={6}
                        required
                        className="rounded-xl border-input bg-background focus-visible:ring-primary resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-13 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Mesaj Gönder
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Bilgileriniz KVKK kapsamında gizli tutulacak ve yalnızca size dönüş
                      sağlamak için kullanılacaktır.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Contact;
