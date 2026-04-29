import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Users, Calendar, MessageSquare, UserCheck, Check, ArrowRight, Brain, Heart, Stethoscope, Users2, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const specialistTypes = [
  { icon: Brain, title: "Psikolog", description: "Ruh sağlığı uzmanları", color: "from-purple-500 to-purple-600" },
  { icon: Heart, title: "Aile Danışmanı", description: "Aile ve çift terapistleri", color: "from-pink-500 to-pink-600" },
  { icon: Stethoscope, title: "Doktor", description: "Tıp doktorları", color: "from-blue-500 to-blue-600" },
  { icon: Users2, title: "Uzman", description: "Diğer sağlık uzmanları", color: "from-green-500 to-green-600" },
];

interface IndexBelowFoldProps {
  onSearch: () => void;
}

const IndexBelowFold = ({ onSearch }: IndexBelowFoldProps) => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);

  useEffect(() => {
    const fetchRandomReviews = async () => {
      try {
        const { data: reviewsData, error: reviewsError } = await supabase.rpc('get_public_reviews', { p_limit: 20 });
        if (reviewsError) throw reviewsError;
        if (reviewsData && reviewsData.length > 0) {
          const shuffled = [...reviewsData].sort(() => 0.5 - Math.random());
          const selectedReviews = shuffled.slice(0, 4);
          const specialistIds = [...new Set(selectedReviews.map(r => r.specialist_id))];
          const { data: specialistsData } = await supabase
            .from('specialists')
            .select('id, name, profile_picture')
            .in('id', specialistIds);
          setReviews(selectedReviews);
          setSpecialists(specialistsData || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchRandomReviews();
  }, []);

  return (
    <>
      {/* Mobile App Download Banner - sadece mobilde görünür */}
      <section className="md:hidden relative py-8 px-4 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Yeni • Mobil Uygulamamız Yayında!
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
            Doktorum Ol Mobilde
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            Uygulamamızı hemen indirin, randevularınızı cebinizden yönetin.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://play.google.com/store/apps/details?id=com.doktorumol"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "https://doktorumol.com.tr";
              }}
              className="inline-flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 shadow-lg active:scale-95 transition-transform"
              aria-label="Google Play'den indir"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden="true">
                <path fill="#EA4335" d="M3.6 1.7C3.2 2.1 3 2.7 3 3.5v17c0 .8.2 1.4.6 1.8l.1.1L13.3 12.7v-.2L3.7 1.7z"/>
                <path fill="#FBBC04" d="M16.5 16l-3.2-3.3v-.2L16.5 9.2l.1.1 3.8 2.2c1.1.6 1.1 1.6 0 2.2L16.6 16z"/>
                <path fill="#4285F4" d="M16.6 15.9L13.3 12.5 3.6 22.3c.4.4 1 .4 1.7.1l11.3-6.5"/>
                <path fill="#34A853" d="M16.6 9.1L5.3 2.6c-.7-.4-1.3-.3-1.7.1l9.7 9.8 3.3-3.4z"/>
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[9px] opacity-80">'DEN ALIN</span>
                <span className="block text-base font-semibold">Google Play</span>
              </span>
            </a>
            <a
              href="https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 shadow-lg active:scale-95 transition-transform"
              aria-label="App Store'dan indir"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[9px] opacity-80">İndirin</span>
                <span className="block text-base font-semibold">App Store'dan</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <div className="relative py-16 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-8 py-3 rounded-full text-sm font-semibold mb-8 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              3 Adım'da Uzmana Kavuş.
            </div>
            <h2 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-8 leading-tight">
              Nasıl Çalışır?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Uzmanınızla buluşmanız için sadece <span className="font-semibold text-blue-600">3 basit adım.</span>
            </p>
          </div>

          <div className="relative max-w-7xl mx-auto">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px">
              <svg className="w-full h-32" viewBox="0 0 1200 120" fill="none">
                <path d="M0 60 Q300 20, 600 60 T1200 60" stroke="url(#gradient)" strokeWidth="3" strokeDasharray="8,4" className="animate-pulse" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
              {[
                { num: "01", title: "İhtiyacına uygun uzman keşfet", desc: <><span className="font-semibold text-blue-600">Bulunduğun bölgedeki</span> deneyimli ve değerlendirme puanı yüksek uzmanı kolayca keşfet.</>, icon: UserCheck, color: "blue" },
                { num: "02", title: "Uygun zamanı seç ve randevunu al", desc: <><span className="font-semibold text-purple-600">Takviminden sana en uygun</span> tarih ve saati belirleyerek randevunu hemen oluştur.</>, icon: Calendar, color: "purple" },
                { num: "03", title: "Randevu hatırlatıcısı al", desc: <>Randevu saatin yaklaşırken <span className="font-semibold text-green-600">SMS ya da WhatsApp</span> üzerinden sana hatırlatma gönderelim.</>, icon: MessageSquare, color: "green" },
              ].map((step) => (
                <div key={step.num} className="group relative">
                  <div className="relative">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-6 hover:scale-105 group-hover:bg-white/90">
                      <div className={`absolute inset-0 bg-gradient-to-r from-${step.color}-500 via-${step.color === 'purple' ? 'pink' : step.color === 'green' ? 'emerald' : 'purple'}-500 to-${step.color}-600 rounded-3xl p-px`}>
                        <div className="bg-white rounded-3xl h-full w-full"></div>
                      </div>
                      <div className="relative z-10 text-center">
                        <div className="relative mb-8">
                          <div className={`w-28 h-28 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-full flex items-center justify-center mx-auto shadow-2xl transform group-hover:scale-110 transition-all duration-500`}>
                            <span className="text-3xl font-bold text-white">{step.num}</span>
                          </div>
                          <div className={`absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-${step.color}-100 to-${step.color}-50 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
                            <step.icon className={`w-8 h-8 text-${step.color}-600`} />
                          </div>
                        </div>
                        <h3 className={`text-3xl font-bold text-gray-900 mb-6 group-hover:text-${step.color}-600 transition-colors duration-300`}>{step.title}</h3>
                        <p className="text-gray-600 leading-relaxed text-lg">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-20">
            <div className="inline-flex flex-col items-center">
              <Button 
                onClick={onSearch}
                className="group bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-bold text-xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border-2 border-white/20"
              >
                <span className="mr-3">Hemen Randevu Al</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <p className="text-sm text-gray-500 mt-4 font-medium">
                ✨ Hızlı Onay • ⚡ Anında onay • 🔒 Güvenli platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Danışan Değerlendirmeleri</h2>
                <p className="text-gray-600 mt-1">Gerçek danışanlardan gerçek deneyimler</p>
              </div>
            </div>
          </div>

          {reviews.length > 0 ? (
            <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-7xl mx-auto">
              <CarouselContent className="-ml-4">
                {reviews.map((review) => {
                  const specialist = specialists.find(s => s.id === review.specialist_id);
                  return (
                    <CarouselItem key={review.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <Card className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden group h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
                        <CardContent className="p-6 relative flex flex-col h-full">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0">
                              <Avatar className="w-16 h-16 border-2 border-blue-100 avatar-container">
                                <AvatarImage src={specialist?.profile_picture} alt={specialist?.name} className="avatar-image object-cover" loading="lazy" />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                                  {specialist?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900 truncate">{review.reviewer_display_name}</h3>
                                  <p className="text-sm text-blue-600 truncate">{specialist?.name || 'Uzman'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="relative flex-1 mb-4">
                            <Quote className="absolute -top-1 -left-1 w-6 h-6 text-blue-200" />
                            <p className="text-gray-600 italic pl-6 line-clamp-4">{review.comment}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Henüz değerlendirme bulunmamaktadır.</p>
            </div>
          )}
        </div>
      </div>

      {/* Specialists Section */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">Danışan Yönlendirme Platformu</h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
              Doktorumol.com.tr ile hastalarınıza daha iyi hizmet verin, randevu takibinizi kolaylaştırın ve online görüşme imkanlarıyla pratiğinizi genişletin.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {specialistTypes.map((type, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${type.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <type.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{type.title}</h3>
                  <p className="text-blue-100 text-sm">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-2xl p-1 shadow-2xl">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-300/30 to-emerald-300/30 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-300/30 to-green-300/30 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl flex-shrink-0 animate-bounce">
                      <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 bg-clip-text text-transparent">
                        Aylık Danışan Yönlendirme Garantisi
                      </h3>
                      <p className="text-green-700/80 mt-2 text-sm md:text-base font-medium">Her ay danışan yönlendirme garantisi ile risksiz büyüme</p>
                    </div>
                  </div>
                  <Link to="/ozel-firsat">
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap">
                      <span>Detayları Gör</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/30 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Platform Avantajları</h3>
                <div className="space-y-4">
                  {["Online randevu yönetimi ile zamandan tasarruf", "Hasta yorumları ile online itibarınızı yükseltin", "Profesyonel profil sayfası ile hastalarınıza ulaşın"].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-lg text-white">{text}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span className="text-lg text-white font-semibold">Aylık Danışan Yönlendirme Garantisi</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { title: "Özelleştirilmiş Çözümler", desc: "Her branşa özel tasarlanmış danışan yönlendirme sistemleri" },
                  { title: "Dijital Pazarlama Desteği", desc: "Google ve sosyal medya reklamları ile görünürlüğünüzü artırın" },
                  { title: "Teknik Destek", desc: "Profesyonel ekibimiz her zaman yanınızda" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg">
                    <h4 className="text-xl font-bold text-white mb-3 drop-shadow-sm">{item.title}</h4>
                    <p className="text-white/90 drop-shadow-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 rounded-lg shadow-lg">
              <Link to="/ozel-firsat">
                Detayları İncele
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default IndexBelowFold;
