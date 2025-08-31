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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 relative overflow-hidden">
        {/* Enhanced Background decorations with more depth */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main decorative circles */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-300/40 to-purple-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-300/40 to-rose-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-br from-indigo-300/30 to-blue-300/30 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-cyan-300/30 to-teal-300/30 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
          
          {/* Additional floating elements */}
          <div className="absolute top-20 left-1/4 w-4 h-4 bg-blue-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-40 right-1/3 w-3 h-3 bg-purple-400 rounded-full opacity-30 animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/5 w-5 h-5 bg-pink-400 rounded-full opacity-25 animate-bounce" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 right-1/5 w-3 h-3 bg-indigo-400 rounded-full opacity-20 animate-bounce" style={{animationDelay: '3s'}}></div>
        </div>

        <div className="relative z-10">
          {/* Enhanced Header with better typography and spacing */}
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-20">
              {/* Hero badge with enhanced styling */}
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-md rounded-full px-8 py-4 mb-8 shadow-2xl border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Özel Fırsatlar
                </span>
              </div>
              
              {/* Enhanced main title */}
              <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Premium Paketler
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                Dijital dünyadaki profesyonel varlığınızı güçlendirin ve daha fazla hastaya ulaşın
              </p>
              
              {/* Enhanced payment badge */}
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-8 py-4 rounded-2xl font-bold shadow-lg border border-amber-200">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></span>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></span>
                </div>
                <span className="text-lg">Aylık Ödeme Seçeneği</span>
              </div>
            </div>

            {/* Enhanced Packages Grid */}
            <div className="grid lg:grid-cols-2 gap-8 mb-20 max-w-6xl mx-auto">
              {packages.map((pkg) => {
                const IconComponent = pkg.icon;
                return (
                  <Card 
                    key={pkg.id} 
                    className={`relative group transition-all duration-700 hover:scale-[1.03] hover:shadow-3xl ${
                      pkg.popular 
                        ? 'ring-4 ring-blue-400/50 shadow-2xl bg-gradient-to-br from-white via-blue-50/50 to-purple-50/30' 
                        : 'hover:shadow-2xl bg-gradient-to-br from-white via-gray-50/50 to-blue-50/20'
                    } ${selectedPackage === pkg.id ? 'ring-4 ring-blue-400/50 scale-[1.03]' : ''} backdrop-blur-sm border-0 overflow-hidden`}
                  >
                    
                    <CardHeader className="text-center pb-6 pt-12">
                      {/* Enhanced icon container */}
                      <div className="mb-6">
                        <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r ${pkg.color} p-5 shadow-2xl group-hover:scale-110 transition-transform duration-300 relative`}>
                          <IconComponent className="w-10 h-10 text-white" />
                          {/* Glow effect */}
                          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${pkg.color} opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-300`}></div>
                        </div>
                      </div>
                      
                      <CardTitle className="text-3xl font-bold text-gray-900 mb-6">
                        {pkg.name}
                      </CardTitle>
                      
                      {/* Enhanced pricing section */}
                      <div className="space-y-3">
                        <div className="text-xl text-gray-500 line-through font-medium">
                          {pkg.originalPrice.toLocaleString('tr-TR')} ₺
                        </div>
                        <div className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-4">
                          {pkg.price.toLocaleString('tr-TR')} ₺
                        </div>
                        <div className="text-sm text-gray-600 mb-6 font-medium">
                          /aylık KDV Dahil
                        </div>
                        <Badge variant="destructive" className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white px-6 py-2 text-base font-bold rounded-full shadow-lg">
                          %{Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)} Süper İndirim
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                      {/* Enhanced features list */}
                      <div className="space-y-4 mb-8">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-4 group/feature">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 flex items-center justify-center mt-0.5 shadow-lg group-hover/feature:scale-110 transition-transform duration-200">
                              <Check className="w-3.5 h-3.5 text-white font-bold" />
                            </div>
                            <span className="text-gray-700 text-base leading-relaxed group-hover/feature:text-gray-900 transition-colors font-medium">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Enhanced CTA button */}
                      <Button 
                        asChild
                        className={`w-full py-8 text-xl font-bold shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white border-0 rounded-2xl relative overflow-hidden group/btn`}
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
                          {/* Button shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                          <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
                          Hemen Satın Al
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Enhanced Features Section */}
            <div className="bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/30 backdrop-blur-md rounded-3xl p-12 shadow-2xl border border-white/20 mb-16">
              <div className="text-center mb-16">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-4">
                  Tüm Paketlerde Standart Özellikler
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Her pakette yer alan premium özellikler ile işinizi dijital dünyada güçlendirin
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Target,
                    title: "Aylık Garantili Danışan Yönlendirme",
                    description: "Aylık Danışan Yönlendirme Garantisi ile sürekli danışan akışı",
                    color: "from-green-500 to-emerald-600"
                  },
                  {
                    icon: Megaphone,
                    title: "Zengin Reklamlar",
                    description: "Google ve sosyal medya platformlarında zengin içerikli reklam yönetimi",
                    color: "from-purple-500 to-violet-600"
                  },
                  {
                    icon: Calendar,
                    title: "Randevu Sistemi",
                    description: "Online randevu yönetimi ve takip sistemi",
                    color: "from-blue-500 to-cyan-600"
                  },
                  {
                    icon: Headphones,
                    title: "Müşteri Desteği",
                    description: "7/24 profesyonel teknik destek hizmeti",
                    color: "from-orange-500 to-red-600"
                  }
                ].map((feature, index) => (
                  <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                    <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-3xl transition-shadow duration-300 relative`}>
                      <feature.icon className="w-10 h-10 text-white" />
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.color} opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-300`}></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-3 text-xl leading-tight">{feature.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced CTA Section */}
            <div className="text-center bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 rounded-3xl p-16 text-white shadow-3xl relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-4xl font-bold mb-6">
                  Sorularınız mı var?
                </h3>
                <p className="text-gray-300 mb-12 text-xl max-w-2xl mx-auto">
                  Size yardımcı olmaktan mutluluk duyarız. Uzman ekibimiz her zaman yanınızda ve en iyi çözümü birlikte bulalım.
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleWhatsAppContact}
                  className="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-2xl text-base md:text-lg px-6 md:px-12 py-4 md:py-6 rounded-2xl font-bold transition-all duration-300 hover:scale-105 w-full max-w-md mx-auto"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp ile Anında İletişim
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Packages;
