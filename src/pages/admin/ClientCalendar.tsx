import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar, Check, Users, ChevronLeft, ChevronRight, AlertTriangle, Clock, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Helmet } from "react-helmet-async";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  payment_day: number | null;
  internal_number: string | null;
}

interface ClientReferral {
  specialist_id: string;
  referred_at: string | null;
  is_referred: boolean;
}

interface SpecialistWithReferral extends Specialist {
  hasReferralInCycle: boolean;
  daysUntilPayment: number;
  daysSinceLastReferral: number | null;
  lastReferralDate: string | null;
  calendarNote: string;
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
  
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // Ödeme gününe kaç gün kaldığını hesapla
  const calculateDaysUntilPayment = (paymentDay: number): number => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    if (paymentDay >= currentDay) {
      return paymentDay - currentDay;
    } else {
      return (daysInMonth - currentDay) + paymentDay;
    }
  };


  const fetchSpecialistsWithReferrals = async () => {
    try {
      setLoading(true);

      const { data: specialistsData, error: specialistsError } = await supabase
        .from('specialists')
        .select('id, name, specialty, city, payment_day, internal_number, created_at')
        .eq('is_active', true)
        .not('payment_day', 'is', null)
        .order('payment_day', { ascending: true });

      if (specialistsError) throw specialistsError;

      // Son 3 ayın yönlendirmelerini çek (referred_at ile birlikte)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: referralsData, error: referralsError } = await supabase
        .from('client_referrals')
        .select('specialist_id, referred_at, is_referred')
        .eq('is_referred', true)
        .gte('referred_at', threeMonthsAgo.toISOString());

      if (referralsError) throw referralsError;

      // Her uzman için döngü içinde yönlendirme var mı kontrol et
      const specialistsWithReferrals: SpecialistWithReferral[] = (specialistsData || []).map(specialist => {
        const paymentDay = specialist.payment_day || 1;
        const today = new Date();
        
        // Bu uzmanın tüm yönlendirmelerini bul ve en son olanı al
        const specialistReferrals = (referralsData || [])
          .filter((r: ClientReferral) => r.specialist_id === specialist.id && r.referred_at)
          .sort((a: ClientReferral, b: ClientReferral) => 
            new Date(b.referred_at!).getTime() - new Date(a.referred_at!).getTime()
          );
        
        const lastReferral = specialistReferrals[0];
        const lastReferralDate = lastReferral?.referred_at || null;
        
        let daysSinceLastReferral: number | null = null;
        let hasReferralInCycle = false;
        
        if (lastReferralDate) {
          const lastDate = new Date(lastReferralDate);
          const diffMs = today.getTime() - lastDate.getTime();
          daysSinceLastReferral = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          // 20 gün içinde yönlendirme yapılmışsa OK, yoksa acil
          hasReferralInCycle = daysSinceLastReferral < 20;
        }

        return {
          ...specialist,
          hasReferralInCycle,
          daysUntilPayment: calculateDaysUntilPayment(paymentDay),
          daysSinceLastReferral,
          lastReferralDate,
        };
      });

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

  // Acil yönlendirme: Döngü içinde yönlendirme yapılmamış uzmanlar
  // Hiç yönlendirme yapılmayanlar en üstte, sonra gün sayısına göre sırala
  const urgentSpecialists = specialists
    .filter(s => !s.hasReferralInCycle)
    .sort((a, b) => {
      const aNoReferral = a.daysSinceLastReferral === null;
      const bNoReferral = b.daysSinceLastReferral === null;
      if (aNoReferral && !bNoReferral) return -1;
      if (!aNoReferral && bNoReferral) return 1;
      if (aNoReferral && bNoReferral) return a.daysUntilPayment - b.daysUntilPayment;
      return (b.daysSinceLastReferral!) - (a.daysSinceLastReferral!);
    });

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

  const totalSpecialists = specialists.length;
  const referredCount = specialists.filter(s => s.hasReferralInCycle).length;
  const pendingCount = totalSpecialists - referredCount;
  const urgentCount = urgentSpecialists.length;

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl text-center border border-slate-700">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Yükleniyor...</h2>
          <p className="text-slate-400">Danışan takvimi yükleniyor</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl text-center border border-slate-700">
          <h2 className="text-3xl font-bold text-red-400 mb-4">Erişim Reddedildi</h2>
          <p className="text-slate-400">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
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
      
      <div className="min-h-screen bg-slate-900">
        <HorizontalNavigation />
        
        <main className="container mx-auto px-4 py-8">
          <AdminBackButton />
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Danışan Takvimi</h1>
                <p className="text-slate-400">Ödeme günlerine göre uzman yönlendirme takibi</p>
              </div>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1 border border-slate-700">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="text-white hover:bg-slate-700">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={goToCurrentMonth} className="min-w-[160px] text-white hover:bg-slate-700 font-medium">
                {monthNames[currentMonth - 1]} {currentYear}
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="text-white hover:bg-slate-700">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Toplam Uzman</p>
                    <p className="text-3xl font-bold text-white">{totalSpecialists}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Yönlendirildi</p>
                    <p className="text-3xl font-bold text-emerald-400">{referredCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Bekliyor</p>
                    <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-900 border-red-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-300 font-medium">Yönlendirme Bekliyor</p>
                    <p className="text-3xl font-bold text-red-200">{urgentCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* URGENT SECTION */}
          {urgentSpecialists.length > 0 && (
            <Card className="mb-8 bg-red-950 border-red-800 overflow-hidden">
              <CardHeader className="bg-red-900 py-4 px-6 border-b border-red-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      🚨 ACİL YÖNLENDİRME GEREKLİ
                    </CardTitle>
                    <p className="text-red-300 text-sm mt-1">
                      Bu uzmanların son yönlendirmesinin üzerinden 20 gün veya daha fazla geçti!
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-red-800">
                  {urgentSpecialists.map(specialist => (
                    <div 
                      key={specialist.id} 
                      className="flex items-center justify-between p-5 hover:bg-red-900 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {specialist.daysUntilPayment}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-lg">{specialist.name}</p>
                          <p className="text-red-300 text-sm">
                            {specialist.specialty} • {specialist.city}
                            {specialist.internal_number && ` • #${specialist.internal_number}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className="bg-slate-700 text-white border-slate-600 px-3 py-1">
                          Ödeme: Her ayın {specialist.payment_day}'i
                        </Badge>
                        {specialist.daysSinceLastReferral !== null ? (
                          <Badge className="bg-red-600 text-white border-red-500 px-3 py-1 animate-pulse">
                            Son yönlendirme: {specialist.daysSinceLastReferral} gün önce
                          </Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white border-red-500 px-3 py-1 animate-pulse">
                            Hiç yönlendirme yapılmadı
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


          {/* All Specialists by Payment Day */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tüm Uzmanlar (Ödeme Günlerine Göre)
            </h2>
            
            {sortedDays.map(day => {
              const daySpecialists = groupedByPaymentDay[day];
              const referred = daySpecialists.filter(s => s.hasReferralInCycle).length;
              const pending = daySpecialists.length - referred;
              const hasUrgent = daySpecialists.some(s => !s.hasReferralInCycle);
              
              return (
                <Card 
                  key={day} 
                  className={`overflow-hidden ${
                    hasUrgent 
                      ? 'bg-orange-950 border-orange-800' 
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <CardHeader className={`py-3 px-6 border-b ${
                    hasUrgent 
                      ? 'bg-orange-900 border-orange-800' 
                      : 'bg-slate-700 border-slate-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-3 text-white">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                          hasUrgent ? 'bg-orange-600' : 'bg-purple-600'
                        }`}>
                          {day}
                        </div>
                        Her Ayın {day}'i
                        {hasUrgent && (
                          <span className="text-orange-300 text-sm font-normal ml-2">
                            ⚠️ Yönlendirme bekliyor
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-700 text-white border-emerald-600">
                          {referred} tamamlandı
                        </Badge>
                        <Badge className="bg-amber-700 text-white border-amber-600">
                          {pending} bekliyor
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className={`divide-y ${hasUrgent ? 'divide-orange-800' : 'divide-slate-700'}`}>
                      {daySpecialists
                        .sort((a, b) => {
                          // Önce yönlendirme yapılmayanlar
                          if (!a.hasReferralInCycle && !b.hasReferralInCycle) {
                            return a.daysUntilPayment - b.daysUntilPayment;
                          }
                          if (!a.hasReferralInCycle) return -1;
                          if (!b.hasReferralInCycle) return 1;
                          return 0;
                        })
                        .map(specialist => {
                          const needsReferral = !specialist.hasReferralInCycle;
                          
                          return (
                            <div 
                              key={specialist.id} 
                              className={`flex items-center justify-between p-4 transition-all ${
                                specialist.hasReferralInCycle 
                                  ? 'bg-emerald-950' 
                                  : needsReferral 
                                    ? 'bg-red-950' 
                                    : 'hover:bg-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {specialist.hasReferralInCycle ? (
                                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                ) : needsReferral ? (
                                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center animate-pulse">
                                    <span className="text-white font-bold text-sm">
                                      {specialist.daysUntilPayment}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                      {specialist.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className={`font-medium ${
                                    specialist.hasReferralInCycle 
                                      ? 'text-emerald-300' 
                                      : needsReferral 
                                        ? 'text-red-300' 
                                        : 'text-white'
                                  }`}>
                                    {specialist.name}
                                  </p>
                                  <p className="text-sm text-slate-400">
                                    {specialist.specialty} • {specialist.city}
                                    {specialist.internal_number && ` • #${specialist.internal_number}`}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!specialist.hasReferralInCycle && (
                                  <Badge 
                                    className={`${
                                      needsReferral 
                                        ? 'bg-red-700 text-white border-red-600' 
                                        : 'bg-slate-600 text-white border-slate-500'
                                    }`}
                                  >
                                    {specialist.daysUntilPayment === 0 
                                      ? "Bugün!" 
                                      : `${specialist.daysUntilPayment} gün`}
                                  </Badge>
                                )}
                                <Badge 
                                  className={specialist.hasReferralInCycle 
                                    ? "bg-emerald-700 text-white border-emerald-600" 
                                    : "bg-slate-600 text-slate-300 border-slate-500"
                                  }
                                >
                                  {specialist.hasReferralInCycle ? "Yönlendirildi ✓" : "Bekliyor"}
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
              <Card className="p-12 text-center bg-slate-800 border-slate-700">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">Ödeme günü tanımlanmış uzman bulunamadı</h3>
                <p className="text-slate-500">Uzman profillerinde ödeme günü bilgisi girilmelidir.</p>
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
