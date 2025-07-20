
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, MessageCircle, Heart, Video, Globe } from "lucide-react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const FamilyCounselorPackage = () => {
  const features = [
    "Çift ve aile terapisi modülleri",
    "Grup seansı yönetimi",
    "Online danışmanlık platformu",
    "Aile üyesi takip sistemi",
    "Özel terapi planları",
    "Güvenli iletişim kanalları",
    "Profesyonel rapor hazırlama",
    "Sürekli eğitim desteği"
  ];

  const plans = [
    {
      name: "Temel",
      price: "349",
      period: "aylık",
      description: "Bireysel aile danışmanları için",
      features: [
        "Ayda 40 seans",
        "Temel aile profili",
        "Email desteği",
        "Temel raporlama"
      ],
      popular: false
    },
    {
      name: "Aile Plus",
      price: "599",
      period: "aylık",
      description: "Deneyimli aile danışmanları için",
      features: [
        "Sınırsız seans",
        "Çift terapi modülü",
        "Video danışmanlık",
        "Aile üyesi takibi",
        "Öncelikli destek",
        "Detaylı raporlama"
      ],
      popular: true
    },
    {
      name: "Merkez",
      price: "999",
      period: "aylık",
      description: "Danışmanlık merkezleri için",
      features: [
        "Çoklu danışman hesabı",
        "Merkez yönetimi",
        "Grup terapisi desteği",
        "API entegrasyonu",
        "Özel eğitim programı",
        "Süpervizyon desteği"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-rose-100 text-rose-800 border-rose-200">
            Aile Danışmanları İçin Özel
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Aile Danışmanı <span className="text-rose-600">Paketleri</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ailelerin yaşamlarını güçlendiren profesyonel danışmanlık hizmetinizi dijital platformumuzla büyütün.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Heart className="w-5 h-5 text-rose-600" />
              <span className="text-sm font-medium">1500+ Mutlu Aile</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">4.8/5 Memnuniyet</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">30K+ Seans</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Aile Danışmanlığında Öncü Platform
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Heart,
                title: "Çift Terapisi",
                description: "Özel çift terapi modülleri ve araçları"
              },
              {
                icon: Users,
                title: "Aile Seansları",
                description: "Grup seansı yönetimi ve takip sistemi"
              },
              {
                icon: Video,
                title: "Online Danışmanlık",
                description: "Güvenli video görüşme ve terapi oturumları"
              },
              {
                icon: MessageCircle,
                title: "Sürekli İletişim",
                description: "Ailelerle güvenli mesajlaşma imkanı"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-rose-600 mx-auto mb-4" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            İhtiyacınıza Uygun Paket
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Aile danışmanlığı pratiğinizi büyütecek esnek çözümler
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-rose-500 shadow-xl' : 'shadow-lg'} hover:shadow-xl transition-shadow`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-rose-600 text-white">
                    En Popüler
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">₺{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                    size="lg"
                  >
                    Hemen Başla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Tüm Paketlerde Yer Alan Özellikler
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-rose-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ailelere Dokunmaya Başlayın
          </h2>
          <p className="text-xl mb-8 opacity-90">
            14 günlük ücretsiz deneme ile platformumuzu keşfedin
          </p>
          <Button size="lg" className="bg-white text-rose-600 hover:bg-gray-100">
            Ücretsiz Deneme Başlat
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FamilyCounselorPackage;
