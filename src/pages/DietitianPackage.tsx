import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Apple, Activity, Video, Globe } from "lucide-react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const DietitianPackage = () => {
  const features = [
    "Kişiselleştirilmiş diyet planları",
    "Besin değeri hesaplama araçları", 
    "Hasta takip ve izleme sistemi",
    "Online beslenme danışmanlığı",
    "Mobil uygulama entegrasyonu",
    "Otomatik menü önerileri",
    "Gelişim raporu oluşturma",
    "Beslenme eğitimi materyalleri"
  ];

  const plans = [
    {
      name: "Temel",
      price: "399",
      period: "aylık",
      description: "Yeni başlayan diyetisyenler için",
      features: [
        "Ayda 30 hasta",
        "Temel diyet planları",
        "Email desteği",
        "Basit raporlama"
      ],
      popular: false
    },
    {
      name: "Profesyonel", 
      price: "699",
      period: "aylık",
      description: "Deneyimli diyetisyenler için",
      features: [
        "Sınırsız hasta takibi",
        "Gelişmiş diyet modülleri",
        "Video danışmanlık",
        "Besin veritabanı",
        "Mobil uygulama",
        "Detaylı analizler"
      ],
      popular: true
    },
    {
      name: "Klinik",
      price: "1199",
      period: "aylık", 
      description: "Beslenme klinikleri için",
      features: [
        "Çoklu diyetisyen desteği",
        "Klinik yönetim sistemi",
        "Özel entegrasyonlar",
        "API erişimi",
        "Eğitim programları",
        "Özel danışmanlık"
      ],
      popular: false
    }
  ];

  return (
    <>
      <Helmet>
        <title>Diyetisyen Paketleri - Doktorum Ol</title>
        <meta name="description" content="Diyetisyenler için özel paketler. Modern beslenme danışmanlığı araçları ile pratiğinizi büyütün." />
        <meta name="keywords" content="diyetisyen paketi, beslenme danışmanlığı, diyet planı, sağlıklı beslenme" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <HorizontalNavigation />
        
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
              Diyetisyenler İçin Özel
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Diyetisyen <span className="text-green-600">Paketleri</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Modern beslenme danışmanlığı ile hastaların yaşam kalitesini artırın. Dijital araçlarla pratiğinizi büyütün.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Apple className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">5000+ Sağlıklı Menü</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium">4.9/5 Memnuniyet</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">15K+ Başarı Hikayesi</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Beslenme Danışmanlığında Teknoloji
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Apple,
                  title: "Akıllı Menüler",
                  description: "AI destekli kişisel diyet planı oluşturma"
                },
                {
                  icon: Activity,
                  title: "Gelişim Takibi",
                  description: "Hasta ilerlemesini anlık izleme sistemi"
                },
                {
                  icon: Video,
                  title: "Online Danışmanlık",
                  description: "Video görüşme ile uzaktan beslenme desteği"
                },
                {
                  icon: Globe,
                  title: "Mobil Erişim",
                  description: "Hastalar için mobil uygulama desteği"
                }
              ].map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className="w-12 h-12 text-green-600 mx-auto mb-4" />
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
              Pratiğinizi Büyütecek Paketler
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Her büyüklükteki beslenme pratiği için tasarlanmış çözümler
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-green-500 shadow-xl' : 'shadow-lg'} hover:shadow-xl transition-shadow`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white">
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
                      className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-800'}`}
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
        <section className="py-16 px-4 bg-green-600 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Sağlıklı Yaşama Öncülük Edin
            </h2>
            <p className="text-xl mb-8 opacity-90">
              14 günlük ücretsiz deneme ile farkı yaşayın
            </p>
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Ücretsiz Deneme Başlat
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default DietitianPackage;
