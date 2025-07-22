import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  Users, 
  UserPlus, 
  Calendar, 
  FileText, 
  MessageSquare, 
  ShoppingCart, 
  BarChart3, 
  Trophy, 
  Scale,
  DollarSign,
  UserCheck,
  ArrowRight,
  Sparkles,
  Zap,
  ClipboardCheck
} from "lucide-react";

const AdminDashboard = () => {
  // ÇOK BASIT TEST!
  console.log("🔥🔥🔥 ADMIN DASHBOARD YÜKLENDI! 🔥🔥🔥");
  console.warn("🔥🔥🔥 ADMIN DASHBOARD YÜKLENDI! 🔥🔥🔥");
  console.error("🔥🔥🔥 ADMIN DASHBOARD YÜKLENDI! 🔥🔥🔥");
  
  const navigate = useNavigate();
  const { userProfile, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/30">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div className="flex items-center gap-2 text-gray-600 font-medium">
            <Zap className="w-4 h-4 animate-pulse" />
            <span>Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile || !['admin', 'staff', 'legal'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-red-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  const isAdmin = userProfile.role === 'admin';
  const isStaff = userProfile.role === 'staff';
  const isLegal = userProfile.role === 'legal';

  const adminCards = [
    {
      title: "Kullanıcı Yönetimi",
      description: "Mevcut kullanıcıları görüntüle ve yönet",
      icon: Users,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      shadowColor: "shadow-blue-500/20",
      route: "/divan_paneli/users",
      buttonText: "Kullanıcıları Görüntüle",
      adminOnly: true
    },
    {
      title: "Kullanıcı Oluştur",
      description: "Yeni kullanıcı hesabı oluştur",
      icon: UserPlus,
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      shadowColor: "shadow-emerald-500/20",
      route: "/divan_paneli/users/create",
      buttonText: "Yeni Kullanıcı",
      adminOnly: true
    },
    {
      title: "Test Yönetimi",
      description: "Uzman testlerini onayla, düzenle veya sil",
      icon: ClipboardCheck,
      gradient: "from-cyan-500 via-blue-500 to-indigo-600",
      bgGradient: "from-cyan-50 to-indigo-50",
      shadowColor: "shadow-cyan-500/20",
      route: "/divan_paneli/tests",
      buttonText: "Testleri Yönet",
      adminOnly: true
    },
    {
      title: "Paket Yönetimi",
      description: "Paketlerin fiyatlarını ve özelliklerini yönet",
      icon: ShoppingCart,
      gradient: "from-purple-500 via-violet-500 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50",
      shadowColor: "shadow-purple-500/20",
      route: "/divan_paneli/packages",
      buttonText: "Paketleri Yönet",
      adminOnly: true
    },
    {
      title: "Ön Bilgilendirme Formu",
      description: "Sözleşme ön bilgilendirme formunu düzenle",
      icon: FileText,
      gradient: "from-purple-500 via-pink-500 to-rose-600",
      bgGradient: "from-purple-50 to-rose-50",
      shadowColor: "shadow-purple-500/20",
      route: "/divan_paneli/pre-info-form",
      buttonText: "Formu Düzenle",
      adminOnly: true
    },
    {
      title: "Uzman Yönetimi",
      description: "Uzmanları görüntüle ve yönet",
      icon: Users,
      gradient: "from-purple-500 via-violet-500 to-purple-600",
      bgGradient: "from-purple-50 to-violet-50",
      shadowColor: "shadow-purple-500/20",
      route: "/divan_paneli/specialists",
      buttonText: "Uzmanları Görüntüle",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Uzman Ekle",
      description: "Sisteme yeni uzman ekle",
      icon: UserPlus,
      gradient: "from-indigo-500 via-blue-500 to-cyan-600",
      bgGradient: "from-indigo-50 to-cyan-50",
      shadowColor: "shadow-indigo-500/20",
      route: "/divan_paneli/specialists/add",
      buttonText: "Yeni Uzman Ekle",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Danışan Yönlendirme",
      description: "Aylık danışan yönlendirme takibi",
      icon: UserCheck,
      gradient: "from-orange-500 via-amber-500 to-yellow-600",
      bgGradient: "from-orange-50 to-yellow-50",
      shadowColor: "shadow-orange-500/20",
      route: "/divan_paneli/client-referrals",
      buttonText: "Yönlendirmeleri Görüntüle",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Randevu Yönetimi",
      description: "Randevuları görüntüle ve yönet",
      icon: Calendar,
      gradient: "from-sky-500 via-cyan-500 to-blue-600",
      bgGradient: "from-sky-50 to-blue-50",
      shadowColor: "shadow-sky-500/20",
      route: "/divan_paneli/appointments",
      buttonText: "Randevuları Görüntüle",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Blog Yönetimi",
      description: "Blog yazılarını görüntüle ve yönet",
      icon: FileText,
      gradient: "from-amber-500 via-orange-500 to-red-600",
      bgGradient: "from-amber-50 to-red-50",
      shadowColor: "shadow-amber-500/20",
      route: "/divan_paneli/blog",
      buttonText: "Blog Yazıları",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Müşteri Yönetimi",
      description: "Müşteri bilgilerini görüntüle",
      icon: Users,
      gradient: "from-teal-500 via-cyan-500 to-blue-600",
      bgGradient: "from-teal-50 to-blue-50",
      shadowColor: "shadow-teal-500/20",
      route: "/divan_paneli/customers",
      buttonText: "Müşterileri Görüntüle",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Yorum Yönetimi",
      description: "Kullanıcı yorumlarını yönet",
      icon: MessageSquare,
      gradient: "from-green-500 via-emerald-500 to-teal-600",
      bgGradient: "from-green-50 to-teal-50",
      shadowColor: "shadow-green-500/20",
      route: "/divan_paneli/reviews",
      buttonText: "Yorumları Görüntüle",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Hukuki İşlemler",
      description: "Hukuki süreçleri yönet",
      icon: Scale,
      gradient: "from-rose-500 via-pink-500 to-red-600",
      bgGradient: "from-rose-50 to-red-50",
      shadowColor: "shadow-rose-500/20",
      route: "/divan_paneli/legal-proceedings",
      buttonText: "Hukuki İşlemleri Görüntüle",
      adminOnly: true,
      legalAccess: true
    },
    {
      title: "Sipariş Yönetimi",
      description: "Siparişleri görüntüle ve yönet",
      icon: ShoppingCart,
      gradient: "from-pink-500 via-rose-500 to-red-600",
      bgGradient: "from-pink-50 to-red-50",
      shadowColor: "shadow-pink-500/20",
      route: "/divan_paneli/orders",
      buttonText: "Siparişleri Görüntüle",
      adminOnly: true
    },
    {
      title: "Yeni Sipariş",
      description: "Manuel sipariş oluştur",
      icon: ShoppingCart,
      gradient: "from-teal-500 via-green-500 to-emerald-600",
      bgGradient: "from-teal-50 to-emerald-50",
      shadowColor: "shadow-teal-500/20",
      route: "/divan_paneli/orders/new",
      buttonText: "Sipariş Oluştur",
      adminOnly: true
    },
    {
      title: "Raporlar",
      description: "Detaylı raporları görüntüle",
      icon: BarChart3,
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      bgGradient: "from-violet-50 to-indigo-50",
      shadowColor: "shadow-violet-500/20",
      route: "/divan_paneli/reports",
      buttonText: "Raporları Görüntüle",
      adminOnly: true
    },
    {
      title: "Başarı İstatistikleri",
      description: "Performans istatistiklerini görüntüle",
      icon: Trophy,
      gradient: "from-yellow-500 via-amber-500 to-orange-600",
      bgGradient: "from-yellow-50 to-orange-50",
      shadowColor: "shadow-yellow-500/20",
      route: "/divan_paneli/success-statistics",
      buttonText: "İstatistikleri Görüntüle",
      adminOnly: true
    },
    {
      title: "Çalışan Maaşları",
      description: "Çalışan maaş ödemelerini yönet",
      icon: DollarSign,
      gradient: "from-slate-500 via-gray-500 to-zinc-600",
      bgGradient: "from-slate-50 to-zinc-50",
      shadowColor: "shadow-slate-500/20",
      route: "/divan_paneli/employee-salaries",
      buttonText: "Maaşları Görüntüle",
      adminOnly: true
    }
  ];

  const visibleCards = adminCards.filter(card => {
    if (isLegal) {
      return card.legalAccess;
    }
    
    if (isAdmin) {
      return true;
    }
    
    if (isStaff) {
      return !card.adminOnly;
    }
    
    return false;
  });

  const getRoleDisplayName = () => {
    if (isAdmin) return 'Admin';
    if (isStaff) return 'Staff';
    if (isLegal) return 'Hukuk Birimi';
    return 'Kullanıcı';
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Divan Paneli - Doktorum Ol</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239fa8da' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Enhanced Header Section */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Panel
            </span>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          
           <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-600 via-red-800 to-red-900 bg-clip-text text-transparent">
              🔥 TEST ÇALIŞIYOR MU? 🔥
            </span>
          </h1>
          
          <div className="max-w-3xl mx-auto">
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sistem Aktif</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{visibleCards.length} Modül Mevcut</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {visibleCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
                key={card.route}
                className={`group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-700 cursor-pointer hover:scale-[1.02] hover:-translate-y-2 ${card.shadowColor} shadow-lg hover:shadow-2xl rounded-2xl animate-fade-in`}
                onClick={() => navigate(card.route)}
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                
                {/* Animated border gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500`} />
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300 leading-tight">
                    {card.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm leading-relaxed mt-2">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0 relative z-10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`w-full border-2 border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:${card.gradient} hover:text-white hover:border-transparent hover:shadow-lg transition-all duration-500 font-semibold text-gray-700 hover:scale-105`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {card.buttonText}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </CardContent>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -top-full group-hover:top-full bg-gradient-to-b from-transparent via-white/20 to-transparent transition-all duration-1000 transform rotate-12 opacity-0 group-hover:opacity-100" />
              </Card>
            );
          })}
        </div>

        {/* Enhanced Footer Stats */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/30">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Panel Aktif</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="text-sm text-gray-600 font-medium">
              Son Güncelleme: Bugün
            </div>
          </div>
        </div>
      </div>
      
      <Footer />

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(30px);
        }
      `}</style>
      </div>
    </>
  );
};

export default AdminDashboard;
