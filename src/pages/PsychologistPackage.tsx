
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, MessageCircle, Phone, Video, Globe } from "lucide-react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const PsychologistPackage = () => {
  const features = [
    "Profesyonel profil oluşturma",
    "Online randevu sistemi",
    "Video görüşme desteği",
    "Hasta takip sistemi",
    "Otomatik hatırlatmalar",
    "Gelir raporlama",
    "7/24 teknik destek",
    "Mobil uygulama erişimi"
  ];

  const plans = [
    {
      name: "Başlangıç",
      price: "299",
      period: "aylık",
      description: "Yeni başlayan psikologlar için ideal",
      features: [
        "Ayda 50 randevu",
        "Temel profil özellikleri",
        "Email desteği",
        "Temel raporlama"
      ],
      popular: false
    },
    {
      name: "Profesyonel",
      price: "499",
      period: "aylık",
      description: "Deneyimli psikologlar için",
      features: [
        "Sınırsız randevu",
        "Gelişmiş profil özellikleri",
        "Öncelikli destek",
        "Detaylı raporlama",
        "Video görüşme",
        "Hasta takip sistemi"
      ],
      popular: true
    },
    {
      name: "Klinik",
      price: "899",
      period: "aylık",
      description: "Klinikler ve grup uygulamaları için",
      features: [
        "Çoklu uzman hesabı",
        "Klinik yönetimi",
        "Gelişmiş raporlama",
        "API erişimi",
        "Özel entegrasyonlar",
        "Eğitim ve danışmanlık"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-purple-100 text-purple-800 border-purple-200">
            Psikolog Uzmanları İçin Özel
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Psikolog <span className="text-purple-600">Paketleri</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Modern dijital platformumuzla psikoloji pratiğinizi büyütün. Hastalarınızla daha etkili iletişim kurun ve iş süreçlerinizi optimize edin.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">2000+ Aktif Uzman</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">4.9/5 Memnuniyet</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">50K+ Randevu</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Neden Doktorum Ol'u Seçmelisiniz?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Video,
                title: "Online Terapi",
                description: "HD kalitede güvenli video görüşme imkanı"
              },
              {
                icon: Calendar,
                title: "Akıllı Randevu",
                description: "Otomatik randevu yönetimi ve hatırlatmalar"
              },
              {
                icon: MessageCircle,
                title: "Güvenli İletişim",
                description: "HIPAA uyumlu hasta iletişim sistemi"
              },
              {
                icon: Globe,
                title: "Geniş Erişim",
                description: "Türkiye genelinde hasta kitlenize ulaşın"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
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
            Size Uygun Paketi Seçin
          </h2>
          <p className="text-center text-gray-600 mb-12">
            İhtiyaçlarınıza göre tasarlanmış esnek paket seçenekleri
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-purple-500 shadow-xl' : 'shadow-lg'} hover:shadow-xl transition-shadow`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
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
                    className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-900 hover:bg-gray-800'}`}
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
      <section className="py-16 px-4 bg-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Hemen Başlayın ve Fark Yaratın
          </h2>
          <p className="text-xl mb-8 opacity-90">
            14 günlük ücretsiz deneme ile tüm özellikleri keşfedin
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
            Ücretsiz Deneme Başlat
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PsychologistPackage;
