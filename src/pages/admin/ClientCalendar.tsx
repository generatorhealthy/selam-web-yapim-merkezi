import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar, Check, Users, ChevronLeft, ChevronRight, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  payment_day: number | null;
  internal_number: string | null;
}

interface SpecialistWithReferral extends Specialist {
  hasReferralThisMonth: boolean;
  daysUntilPayment: number;
}

const ClientCalendar = () => {
  const [specialists, setSpecialists] = useState<SpecialistWithReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { userProfile, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const canAccess = !roleLoading && !!userProfile && userProfile.is_approved && ['admin', 'staff'].includes(userProfile.role);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const today = new Date().getDate();
  
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // Calculate days until payment
  const calculateDaysUntilPayment = (paymentDay: number): number => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    if (paymentDay >= currentDay) {
      return paymentDay - currentDay;
    } else {
      // Payment day is in next month
      return (daysInMonth - currentDay) + paymentDay;
    }
  };

  const fetchSpecialistsWithReferrals = async () => {
    try {
      setLoading(true);

      const { data: specialistsData, error: specialistsError } = await supabase
        .from('specialists')
        .select('id, name, specialty, city, payment_day, internal_number')
        .eq('is_active', true)
        .not('payment_day', 'is', null)
        .order('payment_day', { ascending: true });

      if (specialistsError) throw specialistsError;

      const { data: referralsData, error: referralsError } = await supabase
        .from('client_referrals')
        .select('specialist_id')
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .eq('is_referred', true);

      if (referralsError) throw referralsError;

      const referredSpecialistIds = new Set(
        referralsData?.map(r => r.specialist_id) || []
      );

      const specialistsWithReferrals: SpecialistWithReferral[] = (specialistsData || []).map(specialist => ({
        ...specialist,
        hasReferralThisMonth: referredSpecialistIds.has(specialist.id),
        daysUntilPayment: calculateDaysUntilPayment(specialist.payment_day || 0)
      }));

      setSpecialists(specialistsWithReferrals);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchSpecialistsWithReferrals();
    }
  }, [canAccess, currentMonth, currentYear]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Urgent specialists: within 10 days AND not referred
  const urgentSpecialists = specialists
    .filter(s => s.daysUntilPayment <= 10 && !s.hasReferralThisMonth)
    .sort((a, b) => a.daysUntilPayment - b.daysUntilPayment);

  // Group by payment day for regular view
  const groupedByPaymentDay = specialists.reduce((acc, specialist) => {
    const day = specialist.payment_day || 0;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(specialist);
    return acc;
  }, {} as Record<number, SpecialistWithReferral[]>);

  const sortedDays = Object.keys(groupedByPaymentDay)
    .map(Number)
    .sort((a, b) => a - b);

  // Statistics
  const totalSpecialists = specialists.length;
  const referredCount = specialists.filter(s => s.hasReferralThisMonth).length;
  const pendingCount = totalSpecialists - referredCount;
  const urgentCount = urgentSpecialists.length;

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-center border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Yükleniyor...</h2>
          <p className="text-white/70">Danışan takvimi yükleniyor</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-center border border-white/20">
          <h2 className="text-3xl font-bold text-red-300 mb-4">Erişim Reddedildi</h2>
          <p className="text-white/70">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Danışan Takvimi - Divan Paneli</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <HorizontalNavigation />
        
        <main className="container mx-auto px-4 py-8">
          <AdminBackButton />
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Danışan Takvimi</h1>
                <p className="text-white/60">Ödeme günlerine göre uzman yönlendirme takibi</p>
              </div>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="text-white hover:bg-white/20">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={goToCurrentMonth} className="min-w-[160px] text-white hover:bg-white/20 font-medium">
                {monthNames[currentMonth - 1]} {currentYear}
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="text-white hover:bg-white/20">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 font-medium">Toplam Uzman</p>
                    <p className="text-3xl font-bold text-white">{totalSpecialists}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 font-medium">Yönlendirildi</p>
                    <p className="text-3xl font-bold text-emerald-400">{referredCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 font-medium">Bekliyor</p>
                    <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/30 to-orange-500/30 backdrop-blur-sm border-red-400/30 hover:from-red-500/40 hover:to-orange-500/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-200 font-medium">Acil (10 Gün)</p>
                    <p className="text-3xl font-bold text-red-300">{urgentCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-red-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* URGENT SECTION - Priority specialists */}
          {urgentSpecialists.length > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border-red-400/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-500/30 to-orange-500/30 py-4 px-6 border-b border-red-400/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/40 rounded-xl flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-200" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      🚨 ACİL YÖNLENDİRME GEREKLİ
                    </CardTitle>
                    <p className="text-red-200/80 text-sm mt-1">
                      Bu uzmanların ödemesine 10 gün veya daha az kaldı ve henüz yönlendirme yapılmadı!
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-red-400/20">
                  {urgentSpecialists.map(specialist => (
                    <div 
                      key={specialist.id} 
                      className="flex items-center justify-between p-5 hover:bg-red-500/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                          <span className="text-white font-bold text-lg">
                            {specialist.daysUntilPayment}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-lg">{specialist.name}</p>
                          <p className="text-white/60 text-sm">
                            {specialist.specialty} • {specialist.city}
                            {specialist.internal_number && ` • #${specialist.internal_number}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className="bg-white/10 text-white border-white/20 px-3 py-1">
                          Ödeme: Her ayın {specialist.payment_day}'i
                        </Badge>
                        <Badge 
                          variant="destructive"
                          className="bg-red-500/30 text-red-200 border-red-400/30 px-3 py-1 animate-pulse"
                        >
                          {specialist.daysUntilPayment === 0 
                            ? "BUGÜN!" 
                            : `${specialist.daysUntilPayment} gün kaldı`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Specialists by Payment Day */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tüm Uzmanlar (Ödeme Günlerine Göre)
            </h2>
            
            {sortedDays.map(day => {
              const daySpecialists = groupedByPaymentDay[day];
              const referred = daySpecialists.filter(s => s.hasReferralThisMonth).length;
              const pending = daySpecialists.length - referred;
              const hasUrgent = daySpecialists.some(s => s.daysUntilPayment <= 10 && !s.hasReferralThisMonth);
              
              return (
                <Card 
                  key={day} 
                  className={`overflow-hidden backdrop-blur-sm transition-all ${
                    hasUrgent 
                      ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-400/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <CardHeader className={`py-3 px-6 border-b ${
                    hasUrgent 
                      ? 'bg-orange-500/20 border-orange-400/30' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-3 text-white">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          hasUrgent 
                            ? 'bg-orange-500/30 text-orange-300' 
                            : 'bg-purple-500/30 text-purple-300'
                        }`}>
                          {day}
                        </div>
                        Her Ayın {day}'i
                        {hasUrgent && (
                          <span className="text-orange-400 text-sm font-normal ml-2">
                            ⚠️ Yaklaşan ödeme
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                          {referred} tamamlandı
                        </Badge>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30">
                          {pending} bekliyor
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-white/10">
                      {daySpecialists
                        .sort((a, b) => {
                          // Sort by urgency first (not referred + close to payment)
                          if (!a.hasReferralThisMonth && !b.hasReferralThisMonth) {
                            return a.daysUntilPayment - b.daysUntilPayment;
                          }
                          if (!a.hasReferralThisMonth) return -1;
                          if (!b.hasReferralThisMonth) return 1;
                          return 0;
                        })
                        .map(specialist => {
                          const isUrgent = specialist.daysUntilPayment <= 10 && !specialist.hasReferralThisMonth;
                          
                          return (
                            <div 
                              key={specialist.id} 
                              className={`flex items-center justify-between p-4 transition-all ${
                                specialist.hasReferralThisMonth 
                                  ? 'bg-emerald-500/5' 
                                  : isUrgent 
                                    ? 'bg-red-500/10' 
                                    : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {specialist.hasReferralThisMonth ? (
                                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                ) : isUrgent ? (
                                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                                    <span className="text-white font-bold text-sm">
                                      {specialist.daysUntilPayment}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                    <span className="text-white/60 text-sm font-medium">
                                      {specialist.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className={`font-medium ${
                                    specialist.hasReferralThisMonth 
                                      ? 'text-emerald-300' 
                                      : isUrgent 
                                        ? 'text-red-300' 
                                        : 'text-white'
                                  }`}>
                                    {specialist.name}
                                  </p>
                                  <p className="text-sm text-white/50">
                                    {specialist.specialty} • {specialist.city}
                                    {specialist.internal_number && ` • #${specialist.internal_number}`}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!specialist.hasReferralThisMonth && (
                                  <Badge 
                                    variant="outline"
                                    className={`${
                                      isUrgent 
                                        ? 'bg-red-500/20 text-red-300 border-red-400/30' 
                                        : 'bg-white/10 text-white/60 border-white/20'
                                    }`}
                                  >
                                    {specialist.daysUntilPayment === 0 
                                      ? "Bugün!" 
                                      : `${specialist.daysUntilPayment} gün`}
                                  </Badge>
                                )}
                                <Badge 
                                  className={specialist.hasReferralThisMonth 
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" 
                                    : "bg-white/10 text-white/60 border-white/20"
                                  }
                                >
                                  {specialist.hasReferralThisMonth ? "Yönlendirildi ✓" : "Bekliyor"}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {sortedDays.length === 0 && (
              <Card className="p-12 text-center bg-white/5 border-white/10">
                <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white/60 mb-2">Ödeme günü tanımlanmış uzman bulunamadı</h3>
                <p className="text-white/40">Uzman profillerinde ödeme günü bilgisi girilmelidir.</p>
              </Card>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ClientCalendar;
