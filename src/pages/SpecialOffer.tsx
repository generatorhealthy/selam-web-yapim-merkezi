import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Headphones, Globe, Clock, Shield, Award, Zap, Heart, Target, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";

const SpecialOffer = () => {
  const handleWhatsAppContact = () => {
    const phoneNumber = "905418138828";
    const message = "Merhaba! Bu Aya Özel 2999₺'lik paket hakkında bilgi almak istiyorum.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const packageFeatures = [
    "7/24 Online Randevu Sistemi",
    "Hasta Takip ve Yönetim Paneli", 
    "SMS ve E-posta Hatırlatmaları",
    "Online Ödeme Entegrasyonu",
    "Detaylı Raporlama Sistemi",
    "Mobil Uyumlu Tasarım",
    "Google Arama Optimizasyonu",
    "Hasta Yorumları ve Puanlama",
    "Çoklu Dil Desteği",
    "Güvenli Veri Saklama",
    "Teknik Destek (1 Yıl)",
    "Özelleştirilebilir Tema"
  ];

  const statistics = [
    { number: "10.000+", label: "Aktif Hekim", icon: Users },
    { number: "500.000+", label: "Mutlu Hasta", icon: Heart },
    { number: "1.000.000+", label: "Başarılı Randevu", icon: Calendar },
    { number: "99.9%", label: "Sistem Güvenilirliği", icon: Shield }
  ];

  return (
    <>
      <Helmet>
        <title>Bu Aya Özel Kampanya - 2999₺ Doktor Randevu Sistemi | DoktorumOl</title>
        <meta name="description" content="Bu aya özel 2999₺'ye profesyonel doktor randevu sistemi! 7/24 online randevu, hasta takibi, SMS hatırlatma ve daha fazlası. Hemen başlayın!" />
        <meta name="keywords" content="doktor randevu sistemi, online randevu, hasta takibi, tıbbi yazılım, kampanya, 2999 tl" />
      </Helmet>
      
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-lg px-6 py-2">
              <Zap className="w-5 h-5 mr-2" />
              BU AYA ÖZEL KAMPANYA
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Muayenehanenizi
              <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Dijitale Taşıyın
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Profesyonel doktor randevu sistemi ile hasta takibini kolaylaştırın, 
              zamandan tasarruf edin ve muayenehanenizi modern çağa uygun hale getirin.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="flex items-center text-white/90">
                <Check className="w-5 h-5 mr-2 text-white" />
                7/24 Online Randevu
              </div>
              <div className="flex items-center text-white/90">
                <Check className="w-5 h-5 mr-2 text-white" />
                Hasta Takip Sistemi
              </div>
              <div className="flex items-center text-white/90">
                <Check className="w-5 h-5 mr-2 text-white" />
                SMS Hatırlatmaları
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <stat.icon className="w-10 h-10 text-white mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/80 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Main Package Card */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
              <CardHeader className="text-center p-8 bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex justify-center items-center gap-2 mb-4">
                  <Crown className="w-8 h-8 text-primary" />
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-1">
                    PROFESYONEL PAKET
                  </Badge>
                </div>
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-primary">2999₺</span>
                    <span className="text-xl text-muted-foreground line-through">4999₺</span>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-3 py-1">
                    %40 İndirim - Bu Aya Özel!
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground">
                  Muayenehanenizi modern teknoloji ile donatın
                </p>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-6 text-center md:text-left">📋 Temel Özellikler</h3>
                    <ul className="space-y-3">
                      {packageFeatures.slice(0, 6).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-6 text-center md:text-left">⚡ Premium Özellikler</h3>
                    <ul className="space-y-3">
                      {packageFeatures.slice(6).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Award className="w-6 h-6 text-primary" />
                    <span className="font-semibold text-lg">Bu Paketi Neden Seçmelisiniz?</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <Clock className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm text-gray-600">Zamanınızı Tasarruf Edin</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Target className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm text-gray-600">Hasta Memnuniyeti Artırın</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Globe className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm text-gray-600">Online Görünürlüğünüzü Artırın</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link 
                    to="/odeme/premium" 
                    state={{
                      packageName: "Profesyonel Paket - Bu Aya Özel",
                      price: 2999,
                      originalPrice: 4999,
                      features: packageFeatures
                    }}
                    className="flex-1"
                  >
                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 text-lg">
                      <Crown className="w-5 h-5 mr-2" />
                      Hemen Satın Al - 2999₺
                    </Button>
                  </Link>
                  
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={handleWhatsAppContact}
                    className="sm:w-auto border-primary text-primary hover:bg-primary hover:text-white py-4"
                  >
                    <Headphones className="w-5 h-5 mr-2" />
                    WhatsApp Destek
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Neden <span className="text-primary">DoktorumOl</span> Platformu?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Modern teknoloji ile donatılmış sistemimiz, muayenehanenizi dijital çağa hazırlar
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">7/24 Online Randevu</h3>
              <p className="text-muted-foreground">
                Hastalarınız dilediği zaman randevu alabilir, siz de iş yükünüzü azaltabilirsiniz.
              </p>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Hasta Takip Sistemi</h3>
              <p className="text-muted-foreground">
                Hasta geçmişini, randevularını ve tedavi süreçlerini tek yerden yönetin.
              </p>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <Star className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Profesyonel İmaj</h3>
              <p className="text-muted-foreground">
                Modern web siteniz ile profesyonel imajınızı güçlendirin ve güven yaratın.
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Kampanya Sınırlı Sayıda!
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Bu aya özel %40 indirimli fiyatla profesyonel doktor randevu sisteminizi hemen kurun.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/odeme/premium" 
              state={{
                packageName: "Profesyonel Paket - Bu Aya Özel",
                price: 2999,
                originalPrice: 4999,
                features: packageFeatures
              }}
            >
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 font-semibold py-4 px-8">
                <Crown className="w-5 h-5 mr-2" />
                Hemen Başla - 2999₺
              </Button>
            </Link>
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleWhatsAppContact}
              className="border-white text-white hover:bg-white hover:text-primary py-4 px-8"
            >
              <Headphones className="w-5 h-5 mr-2" />
              Bilgi Al
            </Button>
          </div>
          
          <div className="mt-8 text-white/80">
            <p>⏰ Kampanya sadece bu ay geçerli! | 📞 7/24 Destek</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default SpecialOffer;