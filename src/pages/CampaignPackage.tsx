import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Gift, Sparkles, Shield, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";

const campaignPackage = {
  name: "Kampanyalı Premium Paket",
  price: 2398,
  originalPrice: 4999,
  features: [
    "Santral Sistemden Danışan Yönlendirme Garantisi",
    "Detaylı Profil",
    "Branş (Doktorum Ol Üyeliği 1)",
    "İletişim",
    "Adres ve Konum",
    "Video Yayınlama",
    "Danışan Görüşleri",
    "Uzman Sayfasına Özgün Seo Çalışması",
    "Online Randevu Takimi",
    "Google Reklamları",
    "Sosyal Medya Paylaşımlarım",
    "Danışan Takibi"
  ]
};

const CampaignPackage = () => {
  const handleWhatsAppContact = () => {
    const phoneNumber = "905335822275";
    const message = "Merhaba, Kampanyalı Paket ile ilgili bilgi almak istiyorum";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <Helmet>
        <title>Kampanyalı Premium Paket - Doktorum Ol</title>
        <meta name="description" content="Kampanyalı Premium Paket ile %52 indirim. Aylık 2398₺ ile profesyonel doktor üyeliği avantajları." />
        <meta name="keywords" content="kampanyalı paket, premium paket, doktor üyelik, indirimli paket" />
      </Helmet>
      
      <HorizontalNavigation />
      
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '6s' }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-float" />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-purple-400 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          {/* Header */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-100">
              <Gift className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                12 Ay Taahhütlü Paket
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight">
              Kampanyalı Premium Paket
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Dijital dünyadaki profesyonel varlığınızı güçlendirin ve daha fazla danışan ulaşın
            </p>
          </div>

          {/* Package Card */}
          <div className="max-w-5xl mx-auto mb-20">
            <Card className="relative group overflow-hidden bg-white/90 backdrop-blur-sm border-2 border-blue-100 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none" />

              <CardHeader className="relative text-center pt-8 pb-8 space-y-6">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                  <Crown className="w-10 h-10 text-white" />
                </div>

                {/* Package Name */}
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {campaignPackage.name}
                </CardTitle>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="text-xl text-gray-500 line-through">
                    {campaignPackage.originalPrice.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {campaignPackage.price.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-lg text-gray-600">
                    /aylık <span className="text-sm">(KDV Dahil)</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 px-6 py-2 text-base font-bold shadow-lg">
                    %{Math.round(((campaignPackage.originalPrice - campaignPackage.price) / campaignPackage.originalPrice) * 100)} İndirim
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative px-8 pb-10 space-y-8">
                {/* Features List */}
                <div className="grid gap-4">
                  {campaignPackage.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 hover:border-blue-200 transition-all group/item">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium leading-relaxed group-hover/item:text-gray-900 transition-colors">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button 
                  asChild
                  className="w-full py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <Link 
                    to="/odeme-sayfasi" 
                    state={{ 
                      packageData: {
                        id: "campaign",
                        name: campaignPackage.name,
                        price: campaignPackage.price,
                        originalPrice: campaignPackage.originalPrice,
                        features: campaignPackage.features,
                        type: "campaign"
                      }
                    }}
                  >
                    <Sparkles className="w-6 h-6 mr-3" />
                    Hemen Satın Al
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Standard Features Section */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Tüm Paketlerde Standart Özellikler
              </h2>
              <p className="text-xl text-gray-600">
                Paket seçiminiz ne olursa olsun, bu özelliklerin hepsini elde ediyorsunuz
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center space-y-4 bg-white/90 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Güvenli Altyapı</h3>
                <p className="text-gray-600">SSL sertifikası ve güvenli veri yönetimi ile hizmetinizdeyiz</p>
              </Card>
              
              <Card className="p-8 text-center space-y-4 bg-white/90 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Hızlı Performans</h3>
                <p className="text-gray-600">Optimize edilmiş sistem ile kesintisiz hizmet</p>
              </Card>
              
              <Card className="p-8 text-center space-y-4 bg-white/90 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-200">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Sürekli Gelişim</h3>
                <p className="text-gray-600">Düzenli güncellemeler ve yeni özellikler</p>
              </Card>
            </div>
          </div>

          {/* Contact Section */}
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 p-12 shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
              
              <div className="relative text-center text-white space-y-6">
                <h3 className="text-4xl font-bold">
                  Sorularınız mı var?
                </h3>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Size yardımcı olmaktan mutluluk duyarız. Uzman ekibimiz her zaman yanınızda.
                </p>
                <Button 
                  size="lg"
                  onClick={handleWhatsAppContact}
                  className="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-xl text-lg px-8 py-6 font-bold"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp ile İletişime Geçin
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CampaignPackage;
