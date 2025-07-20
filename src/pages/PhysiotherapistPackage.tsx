
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Activity, Zap, Video, Globe } from "lucide-react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const PhysiotherapistPackage = () => {
  const features = [
    "Kişiselleştirilmiş egzersiz programları",
    "Video destekli rehabilitasyon",
    "Hasta gelişim takip sistemi",
    "Online fizyoterapi seansları",
    "Egzersiz video kütüphanesi",
    "Ağrı skala izleme araçları",
    "Terapi planı yönetimi",
    "Hasta eğitim materyalleri"
  ];

  const plans = [
    {
      name: "Başlangıç",
      price: "449",
      period: "aylık",
      description: "Bireysel fizyoterapistler için",
      features: [
        "Ayda 40 seans",
        "Temel egzersiz planları",
        "Email desteği",
        "Basit takip sistemi"
      ],
      popular: false
    },
    {
      name: "Profesyonel",
      price: "749",
      period: "aylık",
      description: "Deneyimli fizyoterapistler için",
      features: [
        "Sınırsız hasta takibi",
        "Gelişmiş egzersiz modülleri",
        "Video rehabilitasyon",
        "Ağrı takip sistemi",
        "Öncelikli destek",
        "Detaylı raporlama"
      ],
      popular: true
    },
    {
      name: "Merkez",
      price: "1299",
      period: "aylık",
      description: "Fizyoterapi merkezleri için",
      features: [
        "Çoklu terapist hesabı",
        "Merkez yönetim sistemi",
        "Grup terapi desteği",
        "Özel entegrasyonlar",
        "Eğitim programları",
        "Teknik danışmanlık"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
            Fizyoterapistler İçin Özel
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Fizyoterapist <span className="text-blue-600">Paketleri</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Modern rehabilitasyon teknolojileri ile hastalarınızın iyileşme sürecini hızlandırın ve pratiğinizi büyütün.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">3000+ Egzersiz</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">4.8/5 Memnuniyet</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Zap className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">20K+ İyileşme</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Fizyoterapide Dijital Dönüşüm
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Activity,
                title: "Akıllı Egzersizler",
                description: "AI destekli kişisel rehabilitasyon programları"
              },
              {
                icon: Video,
                title: "Video Rehabilitasyon",
                description: "Uzaktan fizyoterapi ve egzersiz takibi"
              },
              {
                icon: Zap,
                title: "Hızlı İyileşme",
                description: "Gelişmiş takip ile optimize edilmiş süreç"
              },
              {
                icon: Users,
                title: "Hasta Takibi",
                description: "Kapsamlı hasta gelişim izleme sistemi"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
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
            Rehabilitasyon Pratiğinizi Güçlendirin
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Her seviyedeki fizyoterapi pratiği için geliştirilmiş çözümler
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : 'shadow-lg'} hover:shadow-xl transition-shadow`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
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
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
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
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            İyileşmeye Öncülük Edin
          </h2>
          <p className="text-xl mb-8 opacity-90">
            14 günlük ücretsiz deneme ile teknolojinin gücünü keşfedin
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Ücretsiz Deneme Başlat
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PhysiotherapistPackage;
