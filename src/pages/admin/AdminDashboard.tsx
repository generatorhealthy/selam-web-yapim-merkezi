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
  Clock
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userProfile, loading } = useUserRole();

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

  const isAdmin = userProfile.role === 'admin';
  const isStaff = userProfile.role === 'staff';
  const isLegal = userProfile.role === 'legal';

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
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <HorizontalNavigation />
        
        <div className="relative">
          {/* Modern gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
          
          {/* Header Section */}
          <div className="relative z-10 px-6 py-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                        <Settings className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                          Merhaba
                        </h1>
                        <Badge variant="secondary" className="text-xs font-medium">
                          {getRoleDisplayName()} Paneli
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Yönetim paneline hoş geldiniz. Tüm işlemlerinizi buradan gerçekleştirebilirsiniz.
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Sistemi Aktif</span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{visibleCards.length} Modül</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Az önce</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 px-6 pb-12">
            <div className="mx-auto max-w-7xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <Card 
                      key={card.route}
                      className="group relative overflow-hidden border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1"
                      onClick={() => navigate(card.route)}
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <Badge variant="outline" className="opacity-60 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-3 w-3" />
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <CardTitle className="text-lg font-semibold leading-none group-hover:text-primary transition-colors">
                            {card.title}
                          </CardTitle>
                          {card.description && (
                            <CardDescription className="text-sm leading-relaxed">
                              {card.description}
                            </CardDescription>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start h-9 px-3 text-sm font-medium group-hover:bg-muted/50 transition-colors"
                        >
                          {card.buttonText}
                          <ArrowRight className="ml-auto h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                      </CardContent>
                      
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000" />
                    </Card>
                  );
                })}
              </div>
              
              {/* Status Bar */}
              <div className="mt-12 flex items-center justify-center">
                <div className="inline-flex items-center gap-6 rounded-full border bg-card/50 px-6 py-3 text-sm shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-medium text-foreground">Panel Aktif</span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="text-muted-foreground">
                    Son güncelleme: Az önce
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default AdminDashboard;
