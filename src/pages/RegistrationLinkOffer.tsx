import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Headphones, Globe, Clock, Shield, Award, Zap, Heart, Target, Crown, BookOpen, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { FeatureBox } from "@/components/FeatureBox";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OfferBelowVariant, OfferDraftSwitcher, OFFER_VARIANTS } from "@/components/offer/OfferBelowVariants";
import { registrationLinkPricing, registrationLinkDiscountPercent } from "@/lib/registrationLinkPricing";

const VISIBLE = 6;
const expertOsFeatures = [
  "Dijital Uzman Profil Yönetim Sistemi",
  "Kişiselleştirilmiş Uzman Web Arayüzü",
  "Online Randevu Otomasyon Sistemi",
  "Danışan İlişkileri Yönetim Sistemi (CRM)",
  "Yapay Zekâ Destekli İçerik Üretim Modülü",
  "Yapay Zekâ Destekli Değerlendirme Modülü",
  "SMS Bildirim ve Hatırlatma Otomasyonu",
  "Dijital İletişim Entegrasyonu",
  "Coğrafi Konum ve Harita Entegrasyonu",
  "Video İçerik Yönetim Modülü",
  "Dijital Geri Bildirim Yönetim Sistemi",
  "Entegre IP Telefon ve Dahili Hat Hizmeti",
  "Arama Motoru Optimizasyonu (SEO)",
  "Dijital İçerik ve Sosyal Medya Paylaşım Hizmeti",
  "Aylık Danışan Yönlendirme Garantisi",
];
const expertOsPlusExtras = [
  "Kişiselleştirilmiş Profesyonel Web Sitesi",
  "Alan Adı (Domain) Yönetim Hizmeti",
  "Web Yazılım Altyapısı ve Yönetim Sistemi",
  "Yönetilen Bulut Sunucu ve Hosting Altyapısı",
  "SSL Sertifikası ve Şifreli İletişim Altyapısı",
  "Kurumsal E-Posta Altyapısı ve Entegrasyonu",
];

type PlanCardProps = {
  id: string; title: string; subtitle?: string; icon: React.ElementType; tagline: string;
  price: number; originalPrice: number; features: string[]; baseFeatures?: string[];
  intro?: string; featured?: boolean;
};

const PlanCard = ({ id, title, subtitle, icon: Icon, tagline, price, originalPrice, features, baseFeatures, intro, featured }: PlanCardProps) => {
  const [open, setOpen] = useState(false);
  const shown = open ? features : features.slice(0, VISIBLE);
  const hidden = features.length - VISIBLE;
  return (
    <div className={`relative rounded-[2rem] overflow-hidden bg-card/90 backdrop-blur-xl shadow-2xl ring-1 ${featured ? 'ring-primary/60' : 'ring-primary-foreground/60'}`}>
      <svg className="absolute inset-x-0 top-0 w-full h-48 pointer-events-none" viewBox="0 0 400 190" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H400V120C330 160 260 90 190 125C120 160 60 135 0 150Z" className="fill-primary/10" />
        <path d="M120 0H400V70C340 105 290 40 230 70C180 95 140 50 120 0Z" className="fill-primary/10" />
      </svg>
      <div className="relative px-6 pt-7 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-foreground">
            <Icon className="w-7 h-7 text-primary" /> {title}
          </h3>
          {featured && <Badge className="rounded-full">En Kapsamlı</Badge>}
        </div>
        {subtitle && <p className="mt-1 text-sm md:text-base text-muted-foreground">{subtitle}</p>}
        <p className="mt-2 text-muted-foreground">{tagline}</p>
      </div>
      <div className="relative p-6 space-y-5">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-bold text-foreground">₺{price.toLocaleString('tr-TR')}<span className="text-lg font-semibold"> /ay</span></span>
            <span className="text-lg text-muted-foreground line-through">₺{originalPrice.toLocaleString('tr-TR')}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">KDV dahil</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">12 Aylık Abonelik</span>
          </div>
        </div>
        <Link to={`/odeme/${id}`} state={{ packageData: { id } }} className="block">
          <Button size="lg" variant={featured ? 'default' : 'outline'} className="w-full rounded-full py-6 text-lg font-semibold border-2 border-primary">{title} Planını Seçin →</Button>
        </Link>
        <div className="flex gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Akıllı Profil Yönetim Modülü</p>
            <p className="text-sm text-muted-foreground">Dijital profilinizi akıllı yazılım teknolojileriyle kolayca oluşturun ve yönetin.</p>
          </div>
        </div>
        <div className="border-t border-border pt-4">
          {intro && <p className="font-semibold text-foreground mb-3">{intro}</p>}
          <ul className="space-y-3">
            {shown.map((f) => (
              <li key={f} className={`flex items-center gap-3 text-foreground ${baseFeatures && !baseFeatures.includes(f) ? 'font-semibold text-primary' : ''}`}>
                <span className="w-6 h-6 rounded-full bg-primary/80 shadow-sm flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <button type="button" onClick={() => setOpen(!open)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {open ? 'Özellikleri Daralt' : `Tüm Özellikleri İncele (+${hidden})`}
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const RegistrationLinkOffer = () => {
  const handleWhatsAppContact = () => {
    const phoneNumber = "905308232275";
    const message = "Merhaba, Özel Fırsat Paket üzerinden Kayıt Olmak İstiyorum.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  const statistics = [
    { number: "Her Ay", label: "Danışan Yönlendirme Garantisi", icon: Target },
    { number: "500.000+", label: "Mutlu Danışan", icon: Heart },
    { number: "500.000+", label: "Başarılı Randevu", icon: Calendar }
  ];

  const [searchParams] = useSearchParams();
  const draft = searchParams.get("tasarim");
  const activeVariant = draft && OFFER_VARIANTS.includes(draft) ? draft : "3";
  const lightOffer = activeVariant === "3";

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Expert OS &amp; Expert OS Plus | Doktorum Ol</title>
        <meta name="description" content="Özel fırsat 5000₺'ye profesyonel doktor randevu sistemi! 7/24 online randevu, hasta takibi, SMS hatırlatma ve daha fazlası. Hemen başlayın!" />
        <meta name="keywords" content="doktor randevu sistemi, online randevu, hasta takibi, tıbbi yazılım, kampanya, 5000 tl" />
      </Helmet>
      
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <section className={`relative min-h-screen overflow-hidden ${lightOffer ? "bg-muted/70 text-foreground" : "bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600"}`}>
        {/* Background decorations - GPU accelerated, no reflow */}
        {!lightOffer && <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl will-change-transform" style={{ contain: 'strict' }}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl will-change-transform" style={{ contain: 'strict' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl will-change-transform" style={{ contain: 'strict' }}></div>
        </div>}
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <Badge className={`mb-6 text-lg px-6 py-2 ${lightOffer ? "bg-primary/10 text-primary border-primary/20" : "bg-white/20 text-white border-white/30"}`}>
              <Zap className="w-5 h-5 mr-2" />
              ÖZEL FIRSAT
            </Badge>
            
            <p className={`text-xl md:text-2xl max-w-3xl mx-auto mb-8 leading-relaxed ${lightOffer ? "text-foreground" : "text-white/90"}`}>
              Dijital dünyadaki profesyonel varlığınızı güçlendirin ve daha fazla danışana ulaşın
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 max-w-4xl mx-auto">
              <div className={`flex items-center ${lightOffer ? "text-muted-foreground" : "text-white/90"}`}>
                <Check className={`w-5 h-5 mr-2 ${lightOffer ? "text-primary" : "text-white"}`} />
                7/24 Online Randevu
              </div>
              <div className={`flex items-center ${lightOffer ? "text-muted-foreground" : "text-white/90"}`}>
                <Check className={`w-5 h-5 mr-2 ${lightOffer ? "text-primary" : "text-white"}`} />
                Danışan Yönlendirme
              </div>
              <div className={`flex items-center ${lightOffer ? "text-muted-foreground" : "text-white/90"}`}>
                <Check className={`w-5 h-5 mr-2 ${lightOffer ? "text-primary" : "text-white"}`} />
                Yapay Zeka Destekli Testler
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            {statistics.map((stat, index) => (
              <div key={index} className={`text-center p-6 rounded-2xl ${lightOffer ? "bg-card border border-border/70 shadow-sm" : "bg-white/10 backdrop-blur-sm"}`}>
                <stat.icon className={`w-10 h-10 mx-auto mb-3 ${lightOffer ? "text-primary" : "text-white"}`} />
                <div className={`text-3xl md:text-4xl font-bold mb-1 ${lightOffer ? "text-foreground" : "text-white"}`}>{stat.number}</div>
                <div className={`text-sm md:text-base ${lightOffer ? "text-muted-foreground" : "text-white/80"}`}>{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Package Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
            <PlanCard
              id="kayit-linki" title="Expert OS" subtitle="Profesyonel Uzman Yönetim Yazılımı" icon={BarChart3}
              tagline="Yapay zekâ destekli yazılım, akıllı otomasyon ve dijital yönetim teknolojileriyle mesleki süreçlerinizi tek platform üzerinden yönetin."
              price={registrationLinkPricing.price} originalPrice={registrationLinkPricing.originalPrice}
              features={expertOsFeatures}
            />
            <PlanCard
              id="premium-plus" title="Expert OS Plus" subtitle="Entegre Uzman Yönetim Yazılımı" icon={Crown} featured
              tagline="Yapay zekâ, dijital otomasyon, kişiselleştirilmiş web yazılımı ve bulut teknolojilerini bütünleşik bir dijital altyapı üzerinden yönetin."
              price={7500} originalPrice={12500}
              features={[...expertOsFeatures, ...expertOsPlusExtras]} baseFeatures={expertOsFeatures}
            />
          </div>
          <div className="max-w-5xl mx-auto mt-6 flex flex-col items-center gap-4">
            <Button size="lg" variant="outline" onClick={handleWhatsAppContact} className="bg-card/90 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Headphones className="w-5 h-5 mr-2" /> WhatsApp Destek
            </Button>
            <p className={`text-sm text-center max-w-2xl ${lightOffer ? "text-muted-foreground" : "text-white/90"}`}>
              <span className="font-semibold">Bilgilendirme:</span> Paket satın alımınız sonrası ekibimiz, profilinizin yayına alınması için sizinle iletişime geçecektir.
            </p>
          </div>
        </div>
      </section>

      {draft && OFFER_VARIANTS.includes(draft) && <OfferDraftSwitcher v={draft} />}
      <OfferBelowVariant v={activeVariant} onWhatsApp={handleWhatsAppContact} />
    </>
  );
};

export default RegistrationLinkOffer;
