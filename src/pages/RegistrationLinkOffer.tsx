import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Headphones, Globe, Clock, Shield, Award, Zap, Heart, Target, Crown, BookOpen, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { FeatureBox } from "@/components/FeatureBox";
import { premiumFeatures, premiumPlusExtras } from "@/lib/newSaleCatalog";
import { useState } from "react";
import { registrationLinkPricing, registrationLinkDiscountPercent } from "@/lib/registrationLinkPricing";

const VISIBLE = 6;

type PlanCardProps = {
  id: string; title: string; icon: React.ElementType; tagline: string;
  price: number; originalPrice: number; features: string[]; baseFeatures?: string[];
  intro?: string; featured?: boolean;
};

const PlanCard = ({ id, title, icon: Icon, tagline, price, originalPrice, features, baseFeatures, intro, featured }: PlanCardProps) => {
  const [open, setOpen] = useState(false);
  const shown = open ? features : features.slice(0, VISIBLE);
  const hidden = features.length - VISIBLE;
  return (
    <div className={`rounded-3xl overflow-hidden bg-card shadow-2xl border-2 ${featured ? 'border-primary' : 'border-primary/30'}`}>
      <div className="px-6 py-5 bg-gradient-to-r from-primary to-primary/70 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-primary-foreground">
          <Icon className="w-7 h-7" /> {title}
        </h3>
        {featured && <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">En Kapsamlı</Badge>}
      </div>
      <div className="p-6 space-y-5">
        <p className="text-muted-foreground">{tagline}</p>
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">₺{price.toLocaleString('tr-TR')}</span>
            <span className="text-lg text-muted-foreground line-through">₺{originalPrice.toLocaleString('tr-TR')}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">KDV dahil / Ay · 12 aylık abonelik</p>
        </div>
        <Link to={`/odeme/${id}`} state={{ packageData: { id } }} className="block">
          <Button size="lg" className="w-full rounded-full py-6 text-lg font-semibold">{title} planı seçin</Button>
        </Link>
        <div className="flex gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Akıllı Profil Yönetimi</p>
            <p className="text-sm text-muted-foreground">Profilinizi saniyeler içinde profesyonelleştirin</p>
          </div>
        </div>
        <div className="border-t border-border pt-4">
          {intro && <p className="font-semibold text-foreground mb-3">{intro}</p>}
          <ul className="space-y-3">
            {shown.map((f) => (
              <li key={f} className="flex items-center gap-3 text-foreground">
                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <button type="button" onClick={() => setOpen(!open)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {open ? 'Daha az göster' : `Devamını gör (+${hidden})`}
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
          {baseFeatures && open && (
            <p className="mt-3 text-xs text-muted-foreground">Premium paketteki {baseFeatures.length} özelliğin tamamı dahildir.</p>
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
              id="kayit-linki" title="Premium" icon={BarChart3}
              tagline="Online görünürlüğünüzü güçlendirin ve daha fazla danışan kazanın."
              price={registrationLinkPricing.price} originalPrice={registrationLinkPricing.originalPrice}
              features={premiumFeatures}
            />
            <PlanCard
              id="premium-plus" title="Premium Plus" icon={Crown} featured
              tagline="Size özel web sitesi, alan adı ve kurumsal e-posta ile tam dijital kimlik."
              price={7500} originalPrice={12500}
              features={[...premiumFeatures, ...premiumPlusExtras]}
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
    </>
  );
};

export default RegistrationLinkOffer;
