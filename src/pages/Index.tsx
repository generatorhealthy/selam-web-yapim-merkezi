import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Search, MapPin, Calendar, Star, Users, Circle, UserCheck, Clock, MessageSquare, User, Check, ArrowRight, Brain, Heart, Stethoscope, Users2, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import PopularSpecialties from "@/components/PopularSpecialties";
import { supabase } from "@/integrations/supabase/client";
import { createDoctorSlug, createSpecialtySlug } from "@/utils/doctorUtils";

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
  "İstanbul", "Ankara", "İzmir", // Top 3 cities first
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch random reviews with specialist data
  useEffect(() => {
    const fetchRandomReviews = async () => {
      try {
        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .rpc('get_public_reviews');
        
        if (reviewsError) throw reviewsError;
        
        if (reviewsData && reviewsData.length > 0) {
          // Shuffle and take 4 random reviews
          const shuffled = [...reviewsData].sort(() => 0.5 - Math.random());
          const selectedReviews = shuffled.slice(0, 4);
          
          // Get unique specialist IDs
          const specialistIds = [...new Set(selectedReviews.map(r => r.specialist_id))];
          
          // Fetch specialist data for these reviews
          const { data: specialistsData, error: specialistsError } = await supabase
            .from('specialists')
            .select('id, name, profile_picture')
            .in('id', specialistIds);
          
          if (specialistsError) throw specialistsError;
          
          setReviews(selectedReviews);
          setSpecialists(specialistsData || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchRandomReviews();
  }, []);

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
        // SECURITY: Use secure function for search
        const { data: allSpecialists, error } = await supabase
          .rpc('get_public_specialists');
        
        if (error) throw error;
        
        // Filter search results
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
    // Create URL with search parameters and redirect to /uzmanlar
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCity) params.set('city', selectedCity);
    if (appointmentType) params.set('appointmentType', appointmentType);
    
    navigate(`/uzmanlar?${params.toString()}`);
  };

  const handleSpecialtyClick = (specialty: { name: string; slug: string }) => {
    console.log('Index page specialty clicked:', specialty);
    navigate(`/uzmanlik/${specialty.slug}`);
  };

  const specialistTypes = [
    {
      icon: Brain,
      title: "Psikolog",
      description: "Ruh sağlığı uzmanları",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Heart,
      title: "Aile Danışmanı", 
      description: "Aile ve çift terapistleri",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Stethoscope,
      title: "Doktor",
      description: "Tıp doktorları",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users2,
      title: "Uzman",
      description: "Diğer sağlık uzmanları",
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      
      {/* Hero Section with Enhanced Dynamic Design */}
      <div className="hero-section above-fold bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white relative overflow-hidden min-h-[70vh]">
        {/* Enhanced Background Pattern - Optimized for LCP */}
        <div className="absolute inset-0 will-change-auto">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-white/30 to-transparent rounded-full blur-3xl opacity-80"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-l from-white/20 to-transparent rounded-full blur-2xl opacity-70"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-gradient-to-t from-white/25 to-transparent rounded-full blur-3xl opacity-75"></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Search Form */}
            <div ref={searchContainerRef} className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-10 shadow-2xl mb-8 md:mb-12 mx-2 md:mx-0 border border-white/20 animate-scale-in">
              <div className="space-y-6 md:space-y-8">
                {/* Appointment Type Toggle - Enhanced Design */}
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

                {/* Enhanced Search Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                  {/* Search Input with Enhanced Design */}
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
                  
                  {/* City Select with Enhanced Design */}
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
                  
                  {/* Enhanced Search Button */}
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
                
                {/* Search Results - Show below search when searching */}
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
                        {searchResults.map((specialist, index) => (
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

            {/* Popular Specialties - Mobile Grid Layout */}
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
                    <span className="block truncate px-1">
                      {specialty.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => navigate('/uzmanlar')}
                  className="px-2 py-2 md:px-4 md:py-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-300 text-xs md:text-sm font-medium border border-white/30 hover:border-white/50 min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center text-center leading-tight"
                >
                  <span className="block truncate px-1">
                    Tümünü Göster
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Ultra Modern Design */}
      <div className="relative py-16 md:py-32 overflow-hidden">
        {/* Advanced Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-8 py-3 rounded-full text-sm font-semibold mb-8 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              3 Adım'da Uzmana Kavuş
            </div>
            
            <h2 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-8 leading-tight">
              Nasıl Çalışır?
            </h2>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Uzmanınızla buluşmanız için sadece <span className="font-semibold text-blue-600">3 basit adım.</span>
            </p>
          </div>

          {/* Steps Container */}
          <div className="relative max-w-7xl mx-auto">
            {/* Connection Lines - More elegant curves */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px">
              <svg className="w-full h-32" viewBox="0 0 1200 120" fill="none">
                <path
                  d="M0 60 Q300 20, 600 60 T1200 60"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Steps */}
            <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
              {/* Step 1 */}
              <div className="group relative">
                <div className="relative">
                  {/* Card with advanced styling */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-6 hover:scale-105 group-hover:bg-white/90">
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-3xl p-px">
                      <div className="bg-white rounded-3xl h-full w-full"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 text-center">
                      {/* Step Number with advanced styling */}
                      <div className="relative mb-8">
                        <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl transform group-hover:scale-110 transition-all duration-500">
                          <span className="text-3xl font-bold text-white">01</span>
                        </div>
                        {/* Floating icon */}
                        <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                          <UserCheck className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>

                      <h3 className="text-3xl font-bold text-gray-900 mb-6 group-hover:text-blue-600 transition-colors duration-300">
                        İhtiyacına uygun uzman keşfet
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed text-lg">
                        <span className="font-semibold text-blue-600">Bulunduğun bölgedeki</span> deneyimli ve değerlendirme puanı yüksek uzmanı kolayca keşfet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="relative">
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-6 hover:scale-105 group-hover:bg-white/90">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-3xl p-px">
                      <div className="bg-white rounded-3xl h-full w-full"></div>
                    </div>
                    
                    <div className="relative z-10 text-center">
                      <div className="relative mb-8">
                        <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl transform group-hover:scale-110 transition-all duration-500">
                          <span className="text-3xl font-bold text-white">02</span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                          <Calendar className="w-8 h-8 text-purple-600" />
                        </div>
                      </div>

                      <h3 className="text-3xl font-bold text-gray-900 mb-6 group-hover:text-purple-600 transition-colors duration-300">
                        Uygun zamanı seç ve randevunu al
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed text-lg">
                        <span className="font-semibold text-purple-600">Takviminden sana en uygun</span> tarih ve saati belirleyerek randevunu hemen oluştur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <div className="relative">
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-6 hover:scale-105 group-hover:bg-white/90">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-3xl p-px">
                      <div className="bg-white rounded-3xl h-full w-full"></div>
                    </div>
                    
                    <div className="relative z-10 text-center">
                      <div className="relative mb-8">
                        <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl transform group-hover:scale-110 transition-all duration-500">
                          <span className="text-3xl font-bold text-white">03</span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                          <MessageSquare className="w-8 h-8 text-green-600" />
                        </div>
                      </div>

                      <h3 className="text-3xl font-bold text-gray-900 mb-6 group-hover:text-green-600 transition-colors duration-300">
                        Randevu hatırlatıcısı al
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed text-lg">
                        Randevu saatin yaklaşırken <span className="font-semibold text-green-600">SMS ya da WhatsApp</span> üzerinden sana hatırlatma gönderelim.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements for Extra Polish */}
            <div className="absolute -top-10 left-1/4 w-6 h-6 bg-blue-200 rounded-full opacity-40 animate-bounce delay-1000"></div>
            <div className="absolute -bottom-10 right-1/4 w-8 h-8 bg-purple-200 rounded-full opacity-30 animate-bounce delay-2000"></div>
            <div className="absolute top-1/2 left-10 w-4 h-4 bg-green-200 rounded-full opacity-50 animate-bounce delay-500"></div>
          </div>

          {/* Enhanced Call to Action */}
          <div className="text-center mt-20">
            <div className="inline-flex flex-col items-center">
              <Button 
                onClick={handleSearch}
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

      {/* Reviews Section - Danışan Değerlendirmeleri */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Danışan Değerlendirmeleri
                </h2>
                <p className="text-gray-600 mt-1">Gerçek danışanlardan gerçek deneyimler</p>
              </div>
            </div>
          </div>

          {reviews.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-7xl mx-auto"
            >
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
                                <AvatarImage 
                                  src={specialist?.profile_picture} 
                                  alt={specialist?.name}
                                  className="avatar-image object-cover"
                                  loading="lazy"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                                  {specialist?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                                    {review.reviewer_display_name}
                                  </h3>
                                  <p className="text-sm text-blue-600 truncate">
                                    {specialist?.name || 'Uzman'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative flex-1 mb-4">
                            <Quote className="absolute -top-1 -left-1 w-6 h-6 text-blue-200" />
                            <p className="text-gray-600 italic pl-6 line-clamp-4">
                              {review.comment}
                            </p>
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
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Danışan Yönlendirme Platformu
            </h2>
            
            <p className="text-xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
              Doktorumol.com.tr ile hastalarınıza daha iyi hizmet verin, 
              randevu takibinizi kolaylaştırın ve online görüşme 
              imkanlarıyla pratiğinizi genişletin.
            </p>
          </div>

          {/* Specialist Types Grid */}
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

          {/* Highlighted Guarantee Banner */}
          <div className="relative mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-2xl p-1 shadow-2xl animate-pulse-slow">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 md:p-8 relative overflow-hidden">
                {/* Decorative elements */}
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
                      <p className="text-green-700/80 mt-2 text-sm md:text-base font-medium">
                        Her ay danışan yönlendirme garantisi ile risksiz büyüme
                      </p>
                    </div>
                  </div>
                  <Link to="/bu-aya-ozel">
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap">
                      <span>Detayları Gör</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/30 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Platform Avantajları</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg text-white">Online randevu yönetimi ile zamandan tasarruf</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg text-white">Hasta yorumları ile online itibarınızı yükseltin</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg text-white">Profesyonel profil sayfası ile hastalarınıza ulaşın</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span className="text-lg text-white font-semibold">Aylık Danışan Yönlendirme Garantisi</span>
                  </div>
                </div>
              </div>

              {/* New Features Section */}
              <div className="space-y-6">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg">
                  <h4 className="text-xl font-bold text-white mb-3 drop-shadow-sm">Özelleştirilmiş Çözümler</h4>
                  <p className="text-white/90 drop-shadow-sm">Her branşa özel tasarlanmış danışan yönlendirme sistemleri</p>
                </div>
                
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg">
                  <h4 className="text-xl font-bold text-white mb-3 drop-shadow-sm">Dijital Pazarlama Desteği</h4>
                  <p className="text-white/90 drop-shadow-sm">Google ve sosyal medya reklamları ile görünürlüğünüzü artırın</p>
                </div>
                
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-lg">
                  <h4 className="text-xl font-bold text-white mb-3 drop-shadow-sm">Teknik Destek</h4>
                  <p className="text-white/90 drop-shadow-sm">Profesyonel ekibimiz her zaman yanınızda</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 rounded-lg shadow-lg">
              <Link to="/bu-aya-ozel">
                Detayları İncele
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>


      <Footer />
    </div>
  );
};

export default Index;
