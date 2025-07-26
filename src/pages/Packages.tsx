import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Calendar, Headphones, Sparkles, Crown, Gift, Target, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping for database values
const iconMap: { [key: string]: any } = {
  Crown,
  Sparkles,
  Star,
  Gift,
  Target,
  Users,
  Calendar
};

const Packages = () => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .eq('price', 2998)
        .order('price', { ascending: true });

      if (error) throw error;

      // Map database data to frontend format
      const mappedPackages = data.map(pkg => ({
        id: pkg.package_key,
        name: pkg.name,
        price: Number(pkg.price),
        originalPrice: Number(pkg.original_price),
        features: pkg.features,
        color: pkg.color,
        popular: pkg.popular,
        icon: iconMap[pkg.icon] || Crown
      }));

      setPackages(mappedPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = "905335822275"; // 0533 582 22 75
    const message = "Merhaba, Paketiniz ile ilgili bilgi almak istiyorum";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
          <title>Paketler - Doktorum Ol</title>
        </Helmet>
        
        <HorizontalNavigation />
        
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Paketler yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Paketler - Doktorum Ol</title>
      </Helmet>
      
      <HorizontalNavigation />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg">
                <Gift className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Özel Fırsatlar</span>
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Paketler
              </h1>
              
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-6 py-3 rounded-full font-semibold shadow-sm">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Aylık Ödeme
              </div>
            </div>

            {/* Packages Grid */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
              {packages.map((pkg) => {
                const IconComponent = pkg.icon;
                return (
                  <Card 
                    key={pkg.id} 
                    className={`relative group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
                      pkg.popular 
                        ? 'ring-2 ring-blue-400 shadow-xl bg-gradient-to-br from-white to-blue-50/50' 
                        : 'hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50'
                    } ${selectedPackage === pkg.id ? 'ring-2 ring-blue-400 scale-[1.02]' : ''} backdrop-blur-sm border-0`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 text-sm font-semibold shadow-lg">
                          <Star className="w-4 h-4 mr-2 fill-current" />
                          En Popüler
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4 pt-8">
                      <div className="mb-4">
                        <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${pkg.color} p-4 shadow-lg`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {pkg.name}
                      </CardTitle>
                      
                      <div className="space-y-2">
                        <div className="text-lg text-gray-500 line-through">
                          {pkg.originalPrice.toLocaleString('tr-TR')} ₺
                        </div>
                        <div className="text-5xl font-bold text-gray-900 mb-2">
                          {pkg.price.toLocaleString('tr-TR')} ₺
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          /aylık KDV Dahil
                        </div>
                        <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-1">
                          %{Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)} İndirim
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-8">
                      <div className="space-y-4 mb-8">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3 group">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center mt-0.5 shadow-sm">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-900 transition-colors">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        asChild
                        className={`w-full py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white border-0`}
                      >
                        <Link 
                          to="/odeme-sayfasi" 
                          state={{ 
                            packageData: {
                              id: pkg.id,
                              name: pkg.name,
                              price: pkg.price,
                              originalPrice: pkg.originalPrice,
                              features: pkg.features,
                              type: pkg.id
                            }
                          }}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Satın Al
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Features Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-0 mb-12">
              <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Tüm Paketlerde Standart Özellikler
              </h3>
              <div className="grid md:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Aylık Garantili Danışan Yönlendirme</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Aylık Garantili danışan yönlendirme sistemimiz ile sürekli danışan akışı</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Megaphone className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Zengin Reklamlar</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Google ve sosyal medya platformlarında zengin içerikli reklam yönetimi</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Randevu Sistemi</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Online randevu yönetimi ve takibi</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Müşteri Desteği</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">7/24 profesyonel teknik destek</p>
                </div>
              </div>
            </div>

            <div className="text-center bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 text-white shadow-xl">
              <h3 className="text-3xl font-bold mb-4">
                Sorularınız mı var?
              </h3>
              <p className="text-gray-300 mb-8 text-lg">
                Size yardımcı olmaktan mutluluk duyarız. Uzman ekibimiz her zaman yanınızda.
              </p>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppContact}
                className="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp ile İletişime Geçin
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Packages;
