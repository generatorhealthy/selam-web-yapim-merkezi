import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Star, 
  Users, 
  Calendar, 
  Headphones, 
  Sparkles, 
  Crown, 
  Gift, 
  Target, 
  Megaphone,
  UserCheck,
  MapPin,
  Video,
  MessageSquare,
  Search,
  Phone,
  Share2,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";

const Paket = () => {
  const packageFeatures = [
    {
      icon: UserCheck,
      title: "Her Ay Danışan Yönlendirme Garantisi",
      description: "Aylık garantili danışan akışı ile sürekli gelir kaynağı",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: "Detaylı Profil",
      description: "Profesyonel ve kapsamlı uzman profili oluşturma",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Crown,
      title: "Branş (Doktorum Ol Üyeliği 1)",
      description: "Premium üyelik ile öncelikli görünürlük",
      color: "from-amber-500 to-amber-600"
    },
    {
      icon: Phone,
      title: "İletişim",
      description: "Direkt iletişim kanalları ve müşteri erişimi",
      color: "from-green-500 to-green-600"
    },
    {
      icon: MapPin,
      title: "Adres ve Konum",
      description: "Detaylı adres bilgisi ve harita entegrasyonu",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Video,
      title: "Video Yayınlama",
      description: "Tanıtım videoları ve canlı yayın imkânı",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      icon: MessageSquare,
      title: "Danışan Görüşleri",
      description: "Müşteri yorumları ve değerlendirme sistemi",
      color: "from-teal-500 to-teal-600"
    },
    {
      icon: Search,
      title: "Uzman Sayfasına Özgün SEO Çalışması",
      description: "Google'da üst sıralarda yer alma garantisi",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Calendar,
      title: "Online Randevu Takimi",
      description: "Otomatik randevu yönetimi ve takip sistemi",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Target,
      title: "Google Reklamları",
      description: "Hedefli Google Ads kampanyaları ve yönetimi",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      icon: Share2,
      title: "Sosyal Medya Paylaşımları",
      description: "Profesyonel sosyal medya yönetimi ve içerik",
      color: "from-violet-500 to-violet-600"
    },
    {
      icon: BarChart3,
      title: "Danışan Takibi",
      description: "Detaylı analitik raporlar ve takip sistemi",
      color: "from-emerald-500 to-emerald-600"
    }
  ];

  const packageData = {
    name: "Premium Uzman Paketi",
    price: 2998,
    originalPrice: 4500,
    features: packageFeatures.map(f => f.title)
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = "905335822275";
    const message = "Merhaba, Premium Uzman Paketi ile ilgili bilgi almak istiyorum";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <Helmet>
        <title>Premium Uzman Paketi - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol Premium Uzman Paketi ile dijital dünyadaki yerinizi alın. SEO çalışması, Google reklamları ve garantili danışan yönlendirme." />
        <meta name="keywords" content="uzman paketi, doktor tanıtım, seo çalışması, google reklamları, randevu sistemi" />
      </Helmet>
      
      <HorizontalNavigation />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Premium Paket</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Premium Uzman
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Paketi
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Dijital dünyadaki profesyonel varlığınızı güçlendirin ve daha fazla hastaya ulaşın
            </p>

            {/* Pricing Card */}
            <Card className="max-w-lg mx-auto bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm border-0 shadow-2xl mb-12">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 p-5 shadow-lg mb-4">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                  {packageData.name}
                </CardTitle>
                
                <div className="space-y-2">
                  <div className="text-lg text-gray-500 line-through">
                    {packageData.originalPrice.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {packageData.price.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    /aylık KDV Dahil
                  </div>
                  <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-1">
                    %{Math.round(((packageData.originalPrice - packageData.price) / packageData.originalPrice) * 100)} İndirim
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-8">
                <Button 
                  asChild
                  className="w-full py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white border-0"
                >
                  <Link 
                    to="/odeme-sayfasi" 
                    state={{ 
                      packageData: {
                        id: 'premium-uzman',
                        name: packageData.name,
                        price: packageData.price,
                        originalPrice: packageData.originalPrice,
                        features: packageData.features,
                        type: 'premium-uzman'
                      }
                    }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Hemen Başla
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              Paket İçeriği
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packageFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card 
                    key={index}
                    className="group hover:scale-105 transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl"
                  >
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.color} p-3 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-3 text-lg leading-tight">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-0 mb-12">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Neden Bizi Seçmelisiniz?
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Garantili Sonuç</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Aylık danışan yönlendirme garantisi ile güvenli gelir</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">SEO Uzmanlığı</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Google'da üst sıralarda görünüm garantisi</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Megaphone className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Profesyonel Reklam</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Hedefli Google ve sosyal medya reklamları</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">7/24 Destek</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Kesintisiz teknik destek ve müşteri hizmetleri</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 text-white shadow-xl">
            <h3 className="text-3xl font-bold mb-4">
              Hemen Başlayın
            </h3>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              Dijital dünyadaki yerinizi alın ve daha fazla hastaya ulaşın. 
              Uzman ekibimiz size her adımda yardımcı olacak.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 border-0 shadow-lg text-base px-8 py-6"
              >
                <Link 
                  to="/odeme-sayfasi" 
                  state={{ 
                    packageData: {
                      id: 'premium-uzman',
                      name: packageData.name,
                      price: packageData.price,
                      originalPrice: packageData.originalPrice,
                      features: packageData.features,
                      type: 'premium-uzman'
                    }
                  }}
                >
                  <Star className="w-5 h-5 mr-2" />
                  Satın Al
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppContact}
                className="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-lg text-base px-8 py-6"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp ile İletişim
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Paket;