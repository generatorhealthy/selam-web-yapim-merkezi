import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, MapPin, Star, Circle, User, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { supabase } from "@/integrations/supabase/client";
import { createDoctorSlug, createSpecialtySlug } from "@/utils/doctorUtils";
import AppointmentWizard from "@/components/AppointmentWizard";

// Lazy load below-fold content (reviews, how it works, specialists, footer)
const IndexBelowFold = lazy(() => import("@/components/IndexBelowFold"));

const popularSpecialties = [
  { name: "Psikolog", slug: "psikolog" },
  { name: "Psikolojik Danışmanlık", slug: "psikolojik-danismanlik" },
  { name: "Aile Danışmanı", slug: "aile-danismani" },
  { name: "Psikiyatri", slug: "psikiyatri" },
  { name: "Kadın Hastalıkları ve Doğum", slug: "kadin-hastaliklari-ve-dogum" },
  { name: "Diyetisyen", slug: "diyetisyen" },
  { name: "Klinik Psikolog", slug: "klinik-psikolog" },
  { name: "Romatoloji", slug: "romatoloji" },
  { name: "Genel Cerrahi", slug: "genel-cerrahi" },
  { name: "Tıbbi Onkoloji", slug: "tibbi-onkoloji" },
  { name: "Dahiliye - İç Hastalıkları", slug: "dahiliye" }
];

const cities = [
  "İstanbul", "Ankara", "İzmir",
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu",
  "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne",
  "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri",
  "Hatay", "Iğdır", "Isparta", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri",
  "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
  "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya",
  "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon",
  "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  rating: number;
  image_url?: string;
  bio?: string;
  profile_picture?: string;
}

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [appointmentType, setAppointmentType] = useState("online");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchResults, setSearchResults] = useState<Specialist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search specialists as user types
  useEffect(() => {
    const searchSpecialists = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const { data: allSpecialists, error } = await supabase.rpc('get_public_specialists');
        if (error) throw error;
        
        const filtered = allSpecialists?.filter(specialist =>
          specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          specialist.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 3) || [];
        
        setSearchResults(filtered);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching specialists:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchSpecialists, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Hide search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCity) params.set('city', selectedCity);
    if (appointmentType) params.set('appointmentType', appointmentType);
    navigate(`/uzmanlar?${params.toString()}`);
  };

  const handleSpecialtyClick = (specialty: { name: string; slug: string }) => {
    navigate(`/uzmanlik/${specialty.slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <div className="hero-section above-fold bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white relative overflow-hidden min-h-[70vh]">
        <div className="absolute inset-0 will-change-auto">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-white/30 to-transparent rounded-full blur-3xl opacity-80"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-l from-white/20 to-transparent rounded-full blur-2xl opacity-70"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-gradient-to-t from-white/25 to-transparent rounded-full blur-3xl opacity-75"></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <header className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Doktorum Ol Randevu Sitesi
              </h1>
            </header>
            {/* Enhanced Search Form */}
            <div ref={searchContainerRef} className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-10 shadow-2xl mb-8 md:mb-12 mx-2 md:mx-0 border border-white/20 animate-scale-in">
              <div className="space-y-6 md:space-y-8">
                {/* Appointment Type Toggle */}
                <div className="flex justify-center">
                  <RadioGroup 
                    value={appointmentType} 
                    onValueChange={setAppointmentType}
                    className="flex gap-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-2 w-full max-w-lg border border-gray-200/50"
                  >
                    <div className="flex items-center flex-1">
                      <RadioGroupItem value="yüzyüze" id="yüzyüze" className="sr-only" />
                      <label 
                        htmlFor="yüzyüze" 
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-base flex-1 group ${
                          appointmentType === "yüzyüze" 
                            ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg transform scale-[1.02]" 
                            : "text-gray-600 hover:bg-white/80 hover:shadow-md"
                        }`}
                      >
                        <div className={`p-1 rounded-lg ${appointmentType === "yüzyüze" ? "bg-white/20" : "bg-gray-200/50"}`}>
                          <User className="w-5 h-5" />
                        </div>
                        <span>Yüz Yüze</span>
                      </label>
                    </div>
                    <div className="flex items-center flex-1">
                      <RadioGroupItem value="online" id="online" className="sr-only" />
                      <label 
                        htmlFor="online" 
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-base flex-1 group ${
                          appointmentType === "online" 
                            ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg transform scale-[1.02]" 
                            : "text-gray-600 hover:bg-white/80 hover:shadow-md"
                        }`}
                      >
                        <div className={`p-1 rounded-lg ${appointmentType === "online" ? "bg-white/20" : "bg-gray-200/50"}`}>
                          <Circle className="w-5 h-5" />
                        </div>
                        <span>Online</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Search Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                  <div className="lg:col-span-6 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-primary z-10" />
                      <Input
                        placeholder="Uzman, branş veya kurum ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 h-16 text-gray-900 border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg rounded-xl bg-white/90 backdrop-blur-sm transition-all duration-300 hover:border-primary/50"
                      />
                    </div>
                  </div>
                  
                  <div className="lg:col-span-3 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-primary z-20" />
                      <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger className="pl-14 h-16 text-gray-900 border-2 border-gray-200 focus:border-primary text-lg rounded-xl bg-white/90 backdrop-blur-sm transition-all duration-300 hover:border-primary/50">
                          <SelectValue placeholder="Şehir seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-lg border-2 border-gray-200 shadow-xl max-h-60 overflow-y-auto rounded-xl">
                          {cities.map((city) => (
                            <SelectItem key={city} value={city} className="text-base hover:bg-primary/10 transition-colors">{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-3">
                    <Button 
                      onClick={handleSearch}
                      className="w-full h-16 bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-primary/90 hover:via-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border-2 border-white/20"
                    >
                      <Search className="w-6 h-6 mr-3" />
                      <span className="hidden sm:inline">Randevu Ara</span>
                      <span className="sm:hidden">Ara</span>
                    </Button>
                  </div>
                </div>
                
                {/* Search Results */}
                {showResults && (searchResults.length > 0 || isSearching) && (
                  <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {isSearching ? (
                      <div className="p-6 text-center">
                        <div className="flex items-center justify-center space-x-2 text-gray-500">
                          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                        <p className="mt-2 text-gray-600">Uzmanlar aranıyor...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {searchResults.map((specialist) => (
                          <div 
                            key={specialist.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                            onClick={() => {
                              const doctorSlug = createDoctorSlug(specialist.name);
                              const specialtySlug = createSpecialtySlug(specialist.specialty);
                              navigate(`/${specialtySlug}/${doctorSlug}`);
                              setShowResults(false);
                            }}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <Avatar className="w-12 h-12 avatar-container">
                                  <AvatarImage 
                                    src={specialist.profile_picture} 
                                    alt={specialist.name}
                                    className="avatar-image object-cover"
                                    loading="lazy"
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                    <User className="w-6 h-6" />
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {specialist.name}
                                  </h4>
                                  <div className="flex items-center space-x-1 text-yellow-400">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-sm text-gray-600">{specialist.rating}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-blue-600 font-medium">{specialist.specialty}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{specialist.city}</span>
                                </div>
                                {specialist.bio && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {specialist.bio.length > 100 ? specialist.bio.substring(0, 100) + '...' : specialist.bio}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                        {searchResults.length === 3 && (
                          <div className="p-3 bg-gray-50 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleSearch}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Tüm sonuçları görüntüle
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-500">Aradığınız kriterlere uygun uzman bulunamadı.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Popular Specialties */}
            <div className="text-center px-2 md:px-0">
              <h3 className="text-lg md:text-xl font-medium mb-4 md:mb-6 text-blue-100">Branşlar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 max-w-6xl mx-auto">
                {popularSpecialties.slice(0, 10).map((specialty, index) => (
                  <button
                    key={index}
                    onClick={() => handleSpecialtyClick(specialty)}
                    className="px-2 py-2 md:px-4 md:py-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all duration-300 text-xs md:text-sm font-medium border border-white/20 hover:border-white/40 min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center text-center leading-tight"
                    title={specialty.name}
                  >
                    <span className="block truncate px-1">{specialty.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => navigate('/uzmanlar')}
                  className="px-2 py-2 md:px-4 md:py-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-300 text-xs md:text-sm font-medium border border-white/30 hover:border-white/50 min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center text-center leading-tight"
                >
                  <span className="block truncate px-1">Tümünü Göster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Below fold - lazy loaded */}
      <Suspense fallback={
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="loading-skeleton" style={{ height: '200px', borderRadius: '12px' }}></div>
          <div className="loading-skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
        </div>
      }>
        <IndexBelowFold onSearch={handleSearch} />
      </Suspense>
    </div>
  );
};

export default Index;
