import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, MapPin, Calendar, Star, Users, Circle, UserCheck, Clock, MessageSquare, User, Check, ArrowRight, Brain, Heart, Stethoscope, Users2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import PopularSpecialties from "@/components/PopularSpecialties";

const popularSpecialties = [
  { name: "Psikolog", slug: "psikolog" },
  { name: "Psikolojik Danışman", slug: "psikolojik-danisman" },
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

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [appointmentType, setAppointmentType] = useState("online");
  const [selectedCity, setSelectedCity] = useState("");
  const navigate = useNavigate();

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
      
      {/* Hero Section with Search - Improved Mobile Layout */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Search Form - Mobile Optimized */}
            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-2xl mb-8 md:mb-12 mx-2 md:mx-0">
              <div className="grid gap-4 md:gap-6">
                {/* Appointment Type Toggle - Mobile Friendly */}
                <div className="flex justify-center mb-4 md:mb-6">
                  <RadioGroup 
                    value={appointmentType} 
                    onValueChange={setAppointmentType}
                    className="flex gap-0 bg-gray-100 rounded-xl p-1 w-full max-w-md"
                  >
                    <div className="flex items-center flex-1">
                      <RadioGroupItem value="yüzyüze" id="yüzyüze" className="sr-only" />
                      <label 
                        htmlFor="yüzyüze" 
                        className={`flex items-center justify-center gap-2 md:gap-3 px-3 md:px-8 py-3 md:py-4 rounded-xl cursor-pointer transition-all font-medium text-sm md:text-base flex-1 ${
                          appointmentType === "yüzyüze" 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <User className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Yüz Yüze</span>
                        <span className="sm:hidden">Yüz Yüze</span>
                      </label>
                    </div>
                    <div className="flex items-center flex-1">
                      <RadioGroupItem value="online" id="online" className="sr-only" />
                      <label 
                        htmlFor="online" 
                        className={`flex items-center justify-center gap-2 md:gap-3 px-3 md:px-8 py-3 md:py-4 rounded-xl cursor-pointer transition-all font-medium text-sm md:text-base flex-1 ${
                          appointmentType === "online" 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Circle className="w-4 h-4 md:w-5 md:h-5" />
                        <span>Online</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Search Inputs - Mobile Stack Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                  {/* Search Input */}
                  <div className="md:col-span-6 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Uzman, branş veya kurum ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-14 md:h-16 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-base md:text-lg"
                    />
                  </div>
                  
                  {/* City Select */}
                  <div className="md:col-span-3 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="pl-12 h-14 md:h-16 text-gray-900 border-gray-200 focus:border-blue-500 text-base md:text-lg">
                        <SelectValue placeholder="Şehir seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                        {cities.map((city) => (
                          <SelectItem key={city} value={city} className="text-base">{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Search Button */}
                  <div className="md:col-span-3">
                    <Button 
                      onClick={handleSearch}
                      className="w-full h-14 md:h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base md:text-lg rounded-lg shadow-lg"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">Randevu Ara</span>
                      <span className="sm:hidden">Ara</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Specialties - Mobile Grid Layout */}
            <div className="text-center px-2 md:px-0">
              <h3 className="text-lg md:text-xl font-medium mb-4 md:mb-6 text-blue-100">Branşlar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap justify-center gap-2 md:gap-3 max-w-4xl mx-auto">
                {popularSpecialties.slice(0, 10).map((specialty, index) => (
                  <button
                    key={index}
                    onClick={() => handleSpecialtyClick(specialty)}
                    className="px-3 md:px-6 py-2 md:py-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all duration-300 text-xs md:text-sm font-medium border border-white/20 hover:border-white/40 whitespace-nowrap overflow-hidden text-ellipsis"
                    title={specialty.name}
                  >
                    <span className="block md:hidden text-xs leading-tight">
                      {specialty.name.length > 12 ? specialty.name.substring(0, 12) + '...' : specialty.name}
                    </span>
                    <span className="hidden md:block">
                      {specialty.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => navigate('/uzmanlar')}
                  className="col-span-2 sm:col-span-1 md:col-span-auto px-4 md:px-6 py-2 md:py-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all duration-300 text-xs md:text-sm font-medium border border-white/20 hover:border-white/40"
                >
                  Tümünü Göster
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
                        Sana yakın uzman bul
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed text-lg">
                        <span className="font-semibold text-blue-600">Yaşadığın yere en yakın</span> ve en çok yorum yapılan doktoru bul.
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
                        Randevu tarihini belirle ve randevunu oluştur
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed text-lg">
                        <span className="font-semibold text-purple-600">Sana uygun olan</span> en yakın randevu tarih ve saatini belirle ve randevunu oluştur.
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
                        Randevunu hatırlatalım
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed text-lg">
                        Randevu zamanın yaklaştığında <span className="font-semibold text-green-600">SMS veya WhatsApp</span> ile hatırlatalım.
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

          {/* Benefits Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
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
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg text-white">Aylık garantili danışan yönlendirme sistemi</span>
                  </div>
                </div>
              </div>

              {/* New Features Section */}
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h4 className="text-xl font-semibold text-white mb-3">Özelleştirilmiş Çözümler</h4>
                  <p className="text-blue-100">Her branşa özel tasarlanmış danışan yönlendirme sistemleri</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h4 className="text-xl font-semibold text-white mb-3">Dijital Pazarlama Desteği</h4>
                  <p className="text-blue-100">Google ve sosyal medya reklamları ile görünürlüğünüzü artırın</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h4 className="text-xl font-semibold text-white mb-3">Teknik Destek</h4>
                  <p className="text-blue-100">Profesyonel ekibimiz her zaman yanınızda</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 rounded-lg shadow-lg">
              <Link to="/paketler">
                Detayları İncele
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* PopularSpecialties Component */}
      <PopularSpecialties />

      <Footer />
    </div>
  );
};

export default Index;
