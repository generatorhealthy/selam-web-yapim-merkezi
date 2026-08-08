import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, MessageCircle, Phone, CheckCircle, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { resolveCallNumber } from "@/utils/callNumber";
import { createSpecialtySlug } from "@/utils/doctorUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  experience?: number;
  rating?: number;
  reviews_count?: number;
  bio?: string;
  profile_picture?: string;
  online_consultation?: boolean;
  face_to_face_consultation?: boolean;
  phone?: string;
  referral_count?: number;
  slug?: string;
}

const DoctorList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [displayedSpecialists, setDisplayedSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 12;
  
  const specialties = [
    "Aile Danışmanı", "Cildiye", "Dil ve Konuşma Terapisti", 
    "Eğitim Danışmanlığı", "İlişki Danışmanı", "Kadın Doğum ve Hastalıkları",
    "Diş Hekimi", "Psikolog", "Psikolojik Danışmanlık", "Doktor", "Uzman",
    "Psikolojik Danışman"
  ];

  const cities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Isparta",
    "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
    "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
    "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van",
    "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
    "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
  ];

  useEffect(() => {
    fetchSpecialists();
    
    // Read URL parameters and set initial filters
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    const city = urlParams.get('city');
    
    if (search) setSearchTerm(search);
    if (city) setSelectedCity(city);
  }, []);

  useEffect(() => {
    filterSpecialists();
  }, [specialists, searchTerm, selectedSpecialty, selectedCity]);

  useEffect(() => {
    updateDisplayedSpecialists();
  }, [filteredSpecialists, currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      
      // Use a threshold for better browser compatibility (Chrome/Edge pixel rounding issues)
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const threshold = 200; // pixels before bottom to trigger load
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        loadMoreSpecialists();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore]);

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      
      // SECURITY: Use secure function to get specialists without personal contact info
      const { data: specialistsData, error: specialistsError } = await supabase
        .rpc('get_public_specialists');

      if (specialistsError) {
        console.error('Uzmanlar çekilirken hata:', specialistsError);
        toast({
          title: "Hata",
          description: "Uzmanlar yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Mevcut ay ve yıl için danışan yönlendirme verilerini çek
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      let referralData: any[] | null = null;
      try {
        const { data, error: referralError } = await supabase
          .from('client_referrals')
          .select('specialist_id, referral_count, is_referred')
          .eq('year', currentYear)
          .eq('month', currentMonth);

        if (!referralError) {
          referralData = data;
        } else {
          console.warn('Danışan yönlendirme verileri alınamadı (yetki kısıtlaması olabilir):', referralError.message);
        }
      } catch {
        console.warn('Danışan yönlendirme verileri alınamadı');
      }

      // Uzman verilerini danışan yönlendirme sayıları ile birleştir
      const specialistsWithReferrals = (specialistsData || []).map(specialist => {
        const referral = referralData?.find(r => r.specialist_id === specialist.id);
        const normalizedCount = referral ? (referral.referral_count || (referral.is_referred ? 1 : 0) || 0) : 0;
        return {
          ...specialist,
          referral_count: normalizedCount
        };
      });

      // Danışan yönlendirme sayısına göre sırala
      // Önce 0 danışan yönlendirmesi olanlar (rastgele sıralanır)
      // Sonra diğerleri danışan sayısına göre artan sırayla (aynı sayıda olanlar rastgele)
      const zeroReferrals = specialistsWithReferrals
        .filter(s => s.referral_count === 0)
        .sort(() => Math.random() - 0.5);
      
      const nonZeroReferrals = specialistsWithReferrals
        .filter(s => s.referral_count > 0)
        .sort((a, b) => {
          if (a.referral_count === b.referral_count) {
            return Math.random() - 0.5; // Aynı sayıda olanları rastgele sırala
          }
          return a.referral_count - b.referral_count; // Artan sırayla
        });

      const sortedSpecialists = [...zeroReferrals, ...nonZeroReferrals];
      setSpecialists(sortedSpecialists);
      
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSpecialists = () => {
    let filtered = [...specialists];

    // Arama filtresi
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(specialist =>
        specialist.name.toLowerCase().includes(searchLower) ||
        specialist.specialty.toLowerCase().includes(searchLower) ||
        specialist.city?.toLowerCase().includes(searchLower)
      );
    }

    // Uzmanlık alanı filtresi
    if (selectedSpecialty && selectedSpecialty !== "all" && selectedSpecialty.trim()) {
      filtered = filtered.filter(specialist => 
        specialist.specialty && specialist.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }

    // Şehir filtresi
    if (selectedCity && selectedCity !== "all" && selectedCity.trim()) {
      filtered = filtered.filter(specialist => 
        specialist.city && specialist.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    setFilteredSpecialists(filtered);
    setCurrentPage(0); // Filtre değiştiğinde sayfayı sıfırla
  };

  const updateDisplayedSpecialists = () => {
    const total = filteredSpecialists.length;
    if (total === 0) {
      setDisplayedSpecialists([]);
      setHasMore(false);
      return;
    }
    const count = (currentPage + 1) * ITEMS_PER_PAGE;
    // Loop back to the beginning when we run out of specialists
    const newDisplayed = Array.from({ length: count }, (_, i) => filteredSpecialists[i % total]);
    setDisplayedSpecialists(newDisplayed);
    // Always allow loading more so the list cycles endlessly
    setHasMore(true);
  };

  const loadMoreSpecialists = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentPage(prev => prev + 1);
    setLoadingMore(false);
  };

  const getAppointmentTypes = (specialist: Specialist) => {
    const types = [];
    if (specialist.online_consultation) types.push('Online');
    if (specialist.face_to_face_consultation !== false) types.push('Yüz Yüze');
    return types.length > 0 ? types : ['Yüz Yüze'];
  };

  const handleWhatsAppClick = (phone?: string) => {
    const whatsappUrl = `https://wa.me/905055566556`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = (phone?: string) => {
    window.location.href = `tel:${resolveCallNumber(phone)}`;
  };

  const handleProfileClick = (specialist: Specialist) => {
    const specialtySlug = createSpecialtySlug(specialist.specialty);
    navigate(`/${specialtySlug}/${specialist.slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Uzmanlar yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <HorizontalNavigation />

      {/* Hero + Filters */}
      <div className="bg-[#f5f5f7] pt-10 pb-6 md:pt-16 md:pb-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <span className="text-[11px] md:text-xs font-semibold tracking-[0.18em] text-gray-500 uppercase">
                Uzmanları Keşfet
              </span>
              <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                Alanında uzman
                <br />
                <span className="text-[#4f7cff]">danışmanlarla</span> tanışın.
              </h1>
            </div>

            <div className="lg:pb-2">
              <p className="text-sm md:text-base text-gray-600 mb-4 max-w-md">
                Deneyimli ve alanında uzman profesyonellerimizle tanışın, size en uygun uzmanı kolayca bulun.
              </p>
              <div className="rounded-[22px] bg-white/80 backdrop-blur-xl border border-white shadow-[0_10px_40px_-16px_rgba(0,0,0,0.18)] p-3">
                <div className="grid gap-2 md:grid-cols-[1.3fr_1fr_1fr_auto]">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Uzman ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 text-sm bg-[#f5f5f7] border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-[#4f7cff]"
                    />
                  </div>

                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger className="h-11 text-sm bg-[#f5f5f7] border-0 rounded-xl">
                      <SelectValue placeholder="Uzmanlık Alanı" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white/95 backdrop-blur-md shadow-xl">
                      <SelectItem value="all" className="rounded-lg">Tümü</SelectItem>
                      {specialties.map(specialty => (
                        <SelectItem key={specialty} value={specialty} className="rounded-lg">
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-11 text-sm bg-[#f5f5f7] border-0 rounded-xl" aria-label="Şehir seçin">
                      <SelectValue placeholder="Şehir" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white/95 backdrop-blur-md shadow-xl max-h-60">
                      <SelectItem value="all" className="rounded-lg">Tümü</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city} className="rounded-lg">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSpecialty("");
                      setSelectedCity("");
                      setCurrentPage(0);
                    }}
                    className="h-11 px-4 text-sm font-semibold rounded-xl text-[#4f7cff] hover:bg-[#4f7cff]/10"
                  >
                    <Filter className="w-4 h-4 mr-1.5" />
                    Temizle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {filteredSpecialists.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">Arama kriterlerinize uygun uzman bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedSpecialists.map((specialist, index) => {
                const specialtySlug = createSpecialtySlug(specialist.specialty);

                return (
                  <Card
                    key={`${specialist.id}-${index}`}
                    className="group bg-white border-0 rounded-[22px] overflow-hidden shadow-[0_4px_24px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.28)] hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in"
                  >
                    {/* Photo */}
                    <button
                      type="button"
                      onClick={() => handleProfileClick(specialist)}
                      className="relative block w-full aspect-[4/3] overflow-hidden bg-[#f5f5f7]"
                      aria-label={`${specialist.name} profilini görüntüle`}
                    >
                      <img
                        src={specialist.profile_picture || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=450&fit=crop&crop=face"}
                        alt={`${specialist.name} - ${specialist.specialty}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-green-700 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Onaylı
                      </span>
                    </button>

                    <CardContent className="flex flex-1 flex-col p-5">
                      <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#4f7cff]">
                        {specialist.specialty}
                      </span>

                      <h3
                        onClick={() => handleProfileClick(specialist)}
                        className="mt-2 text-lg font-bold tracking-tight text-gray-900 cursor-pointer hover:text-[#4f7cff] transition-colors line-clamp-1"
                      >
                        {specialist.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {specialist.city}
                        </span>
                        {specialist.experience ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            {specialist.experience} yıl deneyim
                          </span>
                        ) : null}
                      </div>

                      {specialist.bio && (
                        <p className="mt-3 text-[13px] leading-relaxed text-gray-600 line-clamp-3">
                          {specialist.bio}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {getAppointmentTypes(specialist).map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                              type === 'Online'
                                ? 'border-green-200 text-green-700 bg-green-50'
                                : 'border-purple-200 text-purple-700 bg-purple-50'
                            }`}
                          >
                            {type === 'Online' ? 'Online' : 'Yüz Yüze'}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-auto pt-5 flex flex-col gap-2">
                        <Button
                          asChild
                          className="w-full h-10 text-sm font-semibold rounded-full text-white"
                          style={{ backgroundColor: '#4f7cff' }}
                        >
                          <Link to={`/${specialtySlug}/${specialist.slug}`}>
                            Profili İncele
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="w-full h-10 text-sm font-semibold rounded-full border"
                          style={{ borderColor: '#4f7cff', color: '#4f7cff' }}
                        >
                          <Link to={`/randevu-al/${specialtySlug}/${specialist.slug}`}>
                            Randevu Al
                          </Link>
                        </Button>

                        {specialist.phone && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsAppClick(specialist.phone)}
                              className="flex-1 h-9 rounded-full text-gray-600 hover:bg-gray-100"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCallClick(specialist.phone)}
                              className="flex-1 h-9 rounded-full text-gray-600 hover:bg-gray-100"
                              title="Ara"
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7cff] mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Daha fazla uzman yükleniyor...</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default DoctorList;
