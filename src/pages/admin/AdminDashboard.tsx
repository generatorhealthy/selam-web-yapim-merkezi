import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ClipboardCheck,
  Settings,
  Activity,
  Clock,
  MessageCircle,
  Phone
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userProfile, loading } = useUserRole();

  // Always call all hooks first, then handle conditional rendering
  const isAdmin = userProfile?.role === 'admin';
  const isStaff = userProfile?.role === 'staff';
  const isLegal = userProfile?.role === 'legal';

  const adminCards = [
    {
      title: "Kullanıcı Yönetimi",
      description: "",
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
      adminOnly: false,
      staffOnly: true
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
      adminOnly: true
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
      title: "Analitik Raporu",
      description: "Site trafiği, ziyaretçi analitiği ve detaylı raporlar",
      icon: BarChart3,
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      bgGradient: "from-violet-50 to-indigo-50",
      shadowColor: "shadow-violet-500/20",
      route: "/divan_paneli/analytics",
      buttonText: "Analitikleri Görüntüle",
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
    },
    {
      title: "Destek Bölümü",
      description: "Uzman destek taleplerini görüntüle ve yönet",
      icon: MessageSquare,
      gradient: "from-purple-500 via-indigo-500 to-blue-600",
      bgGradient: "from-purple-50 to-blue-50",
      shadowColor: "shadow-purple-500/20",
      route: "/divan_paneli/support-tickets",
      buttonText: "Destek Taleplerini Görüntüle",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Sözleşmeler",
      description: "Müşteri ön bilgilendirme ve mesafeli satış sözleşmelerini görüntüle",
      icon: FileText,
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-50 to-cyan-50",
      shadowColor: "shadow-emerald-500/20",
      route: "/divan_paneli/contracts",
      buttonText: "Sözleşmeleri Görüntüle",
      adminOnly: true
    },
    {
      title: "Verimor SMS Hizmeti",
      description: "Uzmanlar için SMS gönderim sistemi",
      icon: MessageCircle,
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      bgGradient: "from-violet-50 to-indigo-50",
      shadowColor: "shadow-violet-500/20",
      route: "/divan_paneli/sms-management",
      buttonText: "SMS Hizmetini Yönet",
      adminOnly: false,
      staffOnly: true
    },
    {
      title: "Santral Hizmeti",
      description: "Bulut santral sistemi ve dahili numara yönetimi",
      icon: Phone,
      gradient: "from-orange-500 via-red-500 to-pink-600",
      bgGradient: "from-orange-50 to-pink-50",
      shadowColor: "shadow-orange-500/20",
      route: "/divan_paneli/pbx-management",
      buttonText: "Santral Sistemini Yönet",
      adminOnly: true
    },
    {
      title: "Muhtemel Kayıt",
      description: "Potansiyel danışman kayıtlarını takip edin ve yönetin",
      icon: UserPlus,
      gradient: "from-purple-500 via-violet-500 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50",
      shadowColor: "shadow-purple-500/20",
      route: "/divan_paneli/prospective-registrations",
      buttonText: "Muhtemel Kayıtları Yönet",
      adminOnly: false,
      staffOnly: true
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

  // Conditional rendering after all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-blue-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yükleniyor...</h2>
          <p className="text-gray-600">Panel bilgileri alınıyor</p>
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

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Divan Paneli - Doktorum Ol</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
        </div>
        
        <HorizontalNavigation />
        
        <div className="relative z-10">
          {/* Enhanced Header Section */}
          <div className="px-6 py-12">
            <div className="mx-auto max-w-7xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white rounded-full text-sm font-semibold mb-8 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-500">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent font-bold">
                    Admin Panel
                  </span>
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                
                <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tight">
                  <span className="bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-800 bg-clip-text text-transparent drop-shadow-sm">
                    Merhaba
                  </span>
                </h1>
                
                <div className="max-w-2xl mx-auto mb-8">
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Profesyonel yönetim paneline hoş geldiniz. Tüm işlemlerinizi kolayca gerçekleştirebilirsiniz.
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-lg border border-white/50">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="font-semibold text-slate-700">Sistem Aktif</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-lg border border-white/50">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-700">{visibleCards.length} Modül</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-lg border border-white/50">
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200">
                      {getRoleDisplayName()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Cards Grid */}
          <div className="px-6 pb-16">
            <div className="mx-auto max-w-7xl">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <Card 
                      key={card.route}
                      className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl hover:bg-white/95 transition-all duration-500 cursor-pointer hover:scale-[1.05] hover:-translate-y-3 shadow-xl hover:shadow-2xl rounded-3xl animate-fade-in"
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          window.open(card.route, '_blank');
                        } else {
                          navigate(card.route);
                        }
                      }}
                      style={{
                        animationDelay: `${index * 120}ms`,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      {/* Enhanced gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-40 transition-all duration-700`} />
                      
                      {/* Animated border gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-30 rounded-3xl transition-all duration-700`} />
                      
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-20 rounded-3xl blur-xl transition-all duration-700 -z-10`} />
                      
                      <CardHeader className="pb-6 relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-700`}>
                            <Icon className="w-8 h-8 text-white drop-shadow-lg" />
                            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </div>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-800 group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-300 leading-tight">
                            {card.title}
                          </CardTitle>
                          {card.description && (
                            <CardDescription className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                              {card.description}
                            </CardDescription>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 relative z-10">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`w-full justify-between h-12 px-4 text-sm font-semibold bg-gradient-to-r from-white/50 to-white/30 hover:from-white/80 hover:to-white/60 border border-white/30 hover:border-white/50 backdrop-blur-sm rounded-xl transition-all duration-500 group-hover:shadow-lg text-slate-700 hover:text-slate-900`}
                        >
                          <span>{card.buttonText}</span>
                          <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                        </Button>
                      </CardContent>
                      
                      {/* Enhanced shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1200 skew-x-12" />
                      
                      {/* Floating particles effect */}
                      <div className="absolute top-4 right-4 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-500"></div>
                      <div className="absolute top-8 right-8 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 animate-ping delay-200 transition-opacity duration-500"></div>
                    </Card>
                  );
                })}
              </div>
              
              {/* Enhanced Status Bar */}
              <div className="mt-16 flex items-center justify-center">
                <div className="inline-flex items-center gap-8 rounded-full border border-white/30 bg-white/60 backdrop-blur-xl px-8 py-4 text-sm shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse shadow-lg shadow-emerald-400/50" />
                      <div className="absolute inset-0 h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-ping opacity-30" />
                    </div>
                    <span className="font-bold text-slate-800">Panel Aktif</span>
                  </div>
                  <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium">Son güncelleme: Az önce</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
        
        <style>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          .animate-fade-in {
            animation: fade-in 1s ease-out forwards;
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </>
  );
};

export default AdminDashboard;
