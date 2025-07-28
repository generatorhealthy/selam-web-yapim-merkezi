import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, MessageCircle, Phone, CheckCircle, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createDoctorSlug, createSpecialtySlug } from "@/utils/doctorUtils";
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
  const ITEMS_PER_PAGE = 4;
  
  const specialties = [
    "Psikiyatri", "Psikoloji", "Kardiyoloji", "Dermatoloji", 
    "Ortopedi ve Travmatoloji", "Kadın Hastalıkları ve Doğum",
    "Göz Hastalıkları", "Kulak Burun Boğaz hastalıkları – KBB",
    "Plastik Cerrahi", "Dahiliye – İç Hastalıkları",
    "Çocuk Sağlığı ve Hastalıkları", "Endokrinoloji ve Metabolizma Hastalıkları",
    "Nöroloji (Beyin ve Sinir Hastalıkları)", "Gastroenteroloji",
    "Üroloji", "Genel Cerrahi"
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
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) {
        return;
      }
      loadMoreSpecialists();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore]);

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      
      // Rastgele sıralama ile tüm uzmanları çek
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Uzmanlar çekilirken hata:', error);
        toast({
          title: "Hata",
          description: "Uzmanlar yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Rastgele karıştır
      const shuffledData = (data || []).sort(() => Math.random() - 0.5);
      setSpecialists(shuffledData);
      
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
    const endIndex = (currentPage + 1) * ITEMS_PER_PAGE;
    const newDisplayed = filteredSpecialists.slice(0, endIndex);
    setDisplayedSpecialists(newDisplayed);
    setHasMore(endIndex < filteredSpecialists.length);
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
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/90${cleanPhone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCallClick = (phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleProfileClick = (specialist: Specialist) => {
    const specialtySlug = createSpecialtySlug(specialist.specialty);
    const doctorSlug = createDoctorSlug(specialist.name);
    navigate(`/${specialtySlug}/${doctorSlug}`);
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
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      <HorizontalNavigation />
      
      {/* Header Section */}
      <div className="bg-white py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4" style={{ color: '#4f7cff' }}>
            Uzmanlar
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Alanında uzman, deneyimli uzmanlarla tanışın. Sağlığınız için en doğru rehberliği alın ve hemen randevu oluşturun.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Filter Section */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-lg border border-white/40 p-6 md:p-8 mb-6 md:mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Filter className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Uzman Ara & Filtrele
            </h2>
          </div>
          
          <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-4'}`}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
              <Input
                placeholder="Doktor adı, branş veya şehir..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm hover:border-blue-300 focus:border-blue-500 transition-all duration-300 shadow-sm"
              />
            </div>
            
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="h-14 text-base border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm hover:border-blue-300 focus:border-blue-500 transition-all duration-300 shadow-sm">
                <SelectValue placeholder="Uzmanlık Alanı Seçin" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 bg-white/95 backdrop-blur-md shadow-xl">
                <SelectItem value="all" className="rounded-lg">Tümü</SelectItem>
                {specialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty} className="rounded-lg">
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-14 text-base border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm hover:border-blue-300 focus:border-blue-500 transition-all duration-300 shadow-sm">
                <SelectValue placeholder="Şehir Seçin" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 bg-white/95 backdrop-blur-md shadow-xl max-h-60">
                <SelectItem value="all" className="rounded-lg">Tümü</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city} className="rounded-lg">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedSpecialty("");
                setSelectedCity("");
                setCurrentPage(0);
              }}
              className="h-14 text-base border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-2xl font-semibold bg-white/80 backdrop-blur-sm transition-all duration-300 shadow-sm"
            >
              Filtreleri Temizle
            </Button>
          </div>
          
        </div>

        {filteredSpecialists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Arama kriterlerinize uygun uzman bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 md:space-y-8">
              {displayedSpecialists.map((specialist) => {
                const specialtySlug = createSpecialtySlug(specialist.specialty);
                const doctorSlug = createDoctorSlug(specialist.name);
                
                return (
                  <Card key={specialist.id} className="bg-white border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-2xl overflow-hidden animate-fade-in">
                    <CardContent className="p-4 md:p-8">
                      <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex gap-8'}`}>
                        {/* Doctor Image */}
                        <div className={`${isMobile ? 'self-center' : 'flex-shrink-0'}`}>
                          <img
                            src={specialist.profile_picture || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face"}
                            alt={specialist.name}
                            className={`${isMobile ? 'w-24 h-24' : 'w-40 h-40'} rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={() => handleProfileClick(specialist)}
                          />
                        </div>

                        {/* Doctor Info */}
                        <div className="flex-1">
                          <div className={`${isMobile ? 'text-center' : 'flex items-start justify-between'} mb-4`}>
                            <div>
                              <div className={`${isMobile ? 'flex flex-col items-center gap-2' : 'flex items-center gap-3'} mb-3`}>
                                <h3 
                                  className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors`}
                                  onClick={() => handleProfileClick(specialist)}
                                >
                                  {specialist.name}
                                </h3>
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                                  <span className="text-xs md:text-sm font-semibold">Onaylı Profil</span>
                                </div>
                              </div>
                              
                              <div className={`mb-4 ${isMobile ? 'flex justify-center' : ''}`}>
                                <Badge className="text-sm px-4 py-2 rounded-xl font-semibold" style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                                  👤 {specialist.specialty}
                                </Badge>
                              </div>

                              <div className={`${isMobile ? 'flex flex-col items-center gap-2' : 'flex items-center gap-6'} text-base text-gray-600 mb-4`}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-5 h-5" />
                                  {specialist.city}
                                </div>
                                {specialist.experience && (
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {specialist.experience} yıl deneyim
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {specialist.bio && (
                            <p className={`text-gray-600 text-base leading-relaxed mb-6 line-clamp-3 ${isMobile ? 'text-center text-sm' : ''}`}>
                              {specialist.bio}
                            </p>
                          )}

                          {/* Consultation Types */}
                          <div className={`${isMobile ? 'flex justify-center' : 'flex'} gap-4 mb-6 md:mb-8`}>
                            {getAppointmentTypes(specialist).map((type) => (
                              <Badge 
                                key={type} 
                                variant="outline" 
                                className={`text-sm px-4 py-2 rounded-xl font-semibold ${
                                  type === 'Online' 
                                    ? 'border-green-200 text-green-700 bg-green-50' 
                                    : 'border-purple-200 text-purple-700 bg-purple-50'
                                }`}
                              >
                                {type === 'Online' ? '🌐 Online' : '👥 Yüz Yüze'}
                              </Badge>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex gap-4'}`}>
                            <Button 
                              asChild 
                              className={`${isMobile ? 'w-full' : ''} h-12 px-8 text-base font-semibold rounded-xl text-white`} 
                              style={{ backgroundColor: '#4f7cff' }}
                            >
                              <Link to={`/${specialtySlug}/${doctorSlug}`}>
                                Profili İncele
                              </Link>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              asChild 
                              className={`${isMobile ? 'w-full' : ''} h-12 px-8 text-base font-semibold rounded-xl border-2`}
                              style={{ borderColor: '#4f7cff', color: '#4f7cff' }}
                            >
                              <Link to={`/randevu-al/${specialtySlug}/${doctorSlug}`}>
                                📅 Randevu Al
                              </Link>
                            </Button>

                            {/* Contact Buttons */}
                            {specialist.phone && (
                              <div className={`${isMobile ? 'flex justify-center' : 'flex'} gap-3`}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleWhatsAppClick(specialist.phone)}
                                  className="w-12 h-12 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-5 h-5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleCallClick(specialist.phone)}
                                  className="w-12 h-12 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                                  title="Ara"
                                >
                                  <Phone className="w-5 h-5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Daha fazla uzman yükleniyor...</p>
              </div>
            )}

            {/* End of Results Indicator */}
            {!hasMore && displayedSpecialists.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Tüm uzmanlar gösterildi</p>
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
