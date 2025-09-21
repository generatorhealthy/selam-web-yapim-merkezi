import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Headphones, Globe, Clock, Shield, Award, Zap, Heart, Target, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { FeatureBox } from "@/components/FeatureBox";

const SpecialOffer = () => {
  const handleWhatsAppContact = () => {
    const phoneNumber = "905308232275";
    const message = "Merhaba, Kampanyalı Paket üzerinden Kayıt Olmak İstiyorum.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const packageFeatures = [
    "Her Ay Danışan Yönlendirme Garantisi",
    "Detaylı Profil",
    "Uzman Profili",
    "İletişim",
    "Adres ve Konum",
    "Video Yayınlama",
    "Danışan Görüşleri",
    "Uzman Sayfasına Özgün Seo Çalışması",
    "Online Randevu Takimi",
    "Profesyonel Makale Yazıları",
    "Sosyal Medya Paylaşımları",
    "Danışan Takibi",
    "Yapay Zeka Destekli Testler"
  ];

  const statistics = [
    { number: "Her Ay", label: "Danışan Yönlendirme Garantisi", icon: Target },
    { number: "500.000+", label: "Mutlu Danışan", icon: Heart },
    { number: "500.000+", label: "Başarılı Randevu", icon: Calendar }
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
      <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 overflow-hidden">
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
              <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Özel Fırsatlar
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Dijital dünyadaki profesyonel varlığınızı güçlendirin ve daha fazla danışan ulaşın
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
                Yapay Zeka Destekli Testler
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
                    PREMIUM PAKET
                  </Badge>
                </div>
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-primary">2998₺</span>
                    <span className="text-xl text-muted-foreground line-through">4999₺</span>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-3 py-1">
                    %40 İndirim - Bu Aya Özel!
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground">
                  12 Aylık Abonelik
                </p>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {packageFeatures.map((feature, index) => (
                      <FeatureBox 
                        key={index} 
                        title={feature}
                        variant={index === 0 ? "highlight" : "default"}
                      />
                    ))}
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
                      <span className="text-sm text-gray-600">Danışan Portföy Artışı</span>
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
                     packageName: "Premium Paket - Bu Aya Özel",
                     price: 2998,
                     originalPrice: 4999,
                     features: packageFeatures
                   }}
                    className="flex-1"
                  >
                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 text-lg">
                      <Crown className="w-5 h-5 mr-2" />
                      Satın Al - 2998₺
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
            {/* Her Ay Danışan Yönlendirme Garantisi */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Her Ay Danışan Yönlendirme Garantisi</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Platformumuz üzerinden her ay garantili danışan yönlendirmesi alın. Dijital varlığınızı güçlendirerek daha fazla hastaya ulaşın.
              </p>
              <div className="bg-primary/5 p-6 rounded-xl w-full max-w-md">
                <div className="text-3xl font-bold text-primary mb-2">Her Ay</div>
                <div className="text-sm text-muted-foreground">Garantili Danışan Yönlendirme</div>
              </div>
            </div>

            {/* Yapay Zeka Destekli Testler */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Yapay Zeka Destekli Testler</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Modern AI teknolojisi ile hazırlanmış özel testler sayesinde danışanlarınızı daha iyi anlayın ve profesyonel hizmet sunun.
              </p>
              <div className="bg-primary/5 p-6 rounded-xl w-full max-w-md">
                <div className="text-3xl font-bold text-primary mb-2">AI</div>
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
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Aylık Garantili Danışan Yönlendirme</h3>
              <p className="text-muted-foreground text-sm">
                Aylık Danışan Yönlendirme Garantisi ile sürekli danışan akışı
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
                7/24 profesyonel teknik destek hizmeti
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

export default SpecialOffer;