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
import { OfferBelowVariant, OFFER_VARIANTS } from "@/components/offer/OfferBelowVariants";
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
  const tasarim = searchParams.get("tasarim");

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Özel Fırsat - 5000₺ Doktor Randevu Sistemi | DoktorumOl</title>
        <meta name="description" content="Özel fırsat 5000₺'ye profesyonel doktor randevu sistemi! 7/24 online randevu, hasta takibi, SMS hatırlatma ve daha fazlası. Hemen başlayın!" />
        <meta name="keywords" content="doktor randevu sistemi, online randevu, hasta takibi, tıbbi yazılım, kampanya, 5000 tl" />
      </Helmet>
      
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 overflow-hidden">
        {/* Background decorations - GPU accelerated, no reflow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl will-change-transform" style={{ contain: 'strict' }}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl will-change-transform" style={{ contain: 'strict' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl will-change-transform" style={{ contain: 'strict' }}></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-lg px-6 py-2">
              <Zap className="w-5 h-5 mr-2" />
              ÖZEL FIRSAT
            </Badge>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Dijital dünyadaki profesyonel varlığınızı güçlendirin ve daha fazla danışan ulaşın
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 max-w-4xl mx-auto">
              <div className="flex items-center text-white/90">
                <Check className="w-5 h-5 mr-2 text-white" />
                7/24 Online Randevu
              </div>
              <div className="flex items-center text-white/90">
                <Check className="w-5 h-5 mr-2 text-white" />
                Danışan Yönlendirme
              </div>
              <div className="flex items-center text-white/90">
                <Check className="w-5 h-5 mr-2 text-white" />
                Yapay Zeka Destekli Testler
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <stat.icon className="w-10 h-10 text-white mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/80 text-sm md:text-base">{stat.label}</div>
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
            <Button size="lg" variant="outline" onClick={handleWhatsAppContact} className="bg-white/90 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Headphones className="w-5 h-5 mr-2" /> WhatsApp Destek
            </Button>
            <p className="text-sm text-white/90 text-center max-w-2xl">
              <span className="font-semibold">Bilgilendirme:</span> Paket satın alımınız sonrası ekibimiz, profilinizin yayına alınması için sizinle iletişime geçecektir.
            </p>
          </div>
        </div>
      </section>

      {OFFER_VARIANTS.includes(tasarim ?? "") ? <OfferBelowVariant v={tasarim!} onWhatsApp={handleWhatsAppContact} /> : <>
      {/* Features Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Öne Çıkan <span className="text-primary">Özelliklerimiz</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Profesyonel platformumuz ile dijital varlığınızı güçlendirin
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            {/* Yapay Zeka Destekli Blog Sayfası */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Yapay Zeka Destekli Blog Sayfası</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Yapay zeka teknolojisi ile branşınıza özel profesyonel blog yazıları oluşturun. SEO uyumlu içeriklerle Google'da üst sıralarda yer alın.
              </p>
              <div className="bg-primary/5 p-6 rounded-xl w-full max-w-md">
                <div className="text-3xl font-bold text-primary mb-2">Yapay Zeka</div>
                <div className="text-sm text-muted-foreground">Destekli Blog İçerik Oluşturma</div>
              </div>
            </div>

            {/* Yapay Zeka Destekli Testler */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Yapay Zeka Destekli Testler</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Modern Yapay Zeka teknolojisi ile hazırlanmış özel testler sayesinde danışanlarınızı daha iyi anlayın ve profesyonel hizmet sunun.
              </p>
              <div className="bg-primary/5 p-6 rounded-xl w-full max-w-md">
                <div className="text-3xl font-bold text-primary mb-2">Yapay Zeka</div>
                <div className="text-sm text-muted-foreground">Destekli Test Sistemi</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Standard Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Tüm Paketlerde <span className="text-primary">Standart Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Her pakette yer alan premium özellikler ile işinizi dijital dünyada güçlendirin
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Danışan Portföyünüzü Artırın</h3>
              <p className="text-muted-foreground text-sm">
                Profesyonel dijital varlığınızla daha fazla danışana ulaşın ve portföyünüzü büyütün
              </p>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Zengin Reklamlar</h3>
              <p className="text-muted-foreground text-sm">
                Google ve sosyal medya platformlarında zengin içerikli reklam yönetimi
              </p>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Randevu Sistemi</h3>
              <p className="text-muted-foreground text-sm">
                Online randevu yönetimi ve takip sistemi
              </p>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Müşteri Desteği</h3>
              <p className="text-muted-foreground text-sm">
                Anlık profesyonel teknik destek hizmeti
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Questions Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-purple-900 to-purple-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sorularınız mı var?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Size yardımcı olmaktan mutluluk duyarız. Uzman ekibimiz her zaman yanınızda ve en iyi çözümü birlikte bulalım.
          </p>
          
          <Button 
            size="lg" 
            onClick={handleWhatsAppContact}
            className="bg-white text-gray-900 hover:bg-white/90 font-semibold py-4 px-8 rounded-full"
          >
            <Headphones className="w-5 h-5 mr-2" />
            WhatsApp ile Anında İletişim
          </Button>
        </div>
      </section>
      </>}
    </>
  );
};

export default RegistrationLinkOffer;
