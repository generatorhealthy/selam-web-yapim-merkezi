
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Calendar, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const Landing = () => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Logo yüklenemedi, metin logo gösterilecek');
    const img = e.target as HTMLImageElement;
    // Logo başarısız olursa direkt text logo göster
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = '<div class="text-2xl font-bold text-blue-600">Doktorum Ol</div>';
    }
  };

  return (
    <>
      <Helmet>
        <title>Doktorum Ol Randevu Sitesi</title>
        <meta name="description" content="Doktorum Ol Randevu Sitesinden psikolog, psikolojik danışman, aile danışmanı kadın doğum hastalıkları ve psikiyatri alanlarında randevu al." />
        <meta name="keywords" content="psikolog, aile danışmanı, doktorum ol, psikolojik danışman" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <HorizontalNavigation />
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src="/logo.png" 
                alt="Doktorum Ol Logo" 
                className="h-16 w-auto object-contain"
                onError={handleImageError}
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Doktor Randevunuzu
              <span className="text-blue-600 block">Kolayca Alın</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              En iyi doktorlarla online randevu alın. Hızlı, güvenli ve kolay randevu sistemi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/">
                  Randevu Al <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Doktor Olarak Katıl
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Uzman Doktorlar</h3>
                <p className="text-gray-600">
                  Alanında uzman doktorlardan randevu alın
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Kolay Randevu</h3>
                <p className="text-gray-600">
                  24/7 online randevu alma imkanı
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Phone className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Anında İletişim</h3>
                <p className="text-gray-600">
                  Doktorlarınızla direkt iletişim kurun
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="bg-blue-600 text-white rounded-2xl p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-blue-100">Uzman Doktor</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">10.000+</div>
                <div className="text-blue-100">Mutlu Hasta</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">50+</div>
                <div className="text-blue-100">Branş</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Hemen Başlayın
            </h2>
            <p className="text-gray-600 mb-6">
              Sağlığınız için en doğru adımı atın
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link to="/">
                Randevu Al <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Landing;
