import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar, Check, Users, ChevronLeft, ChevronRight } from "lucide-react";
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

  const fetchSpecialistsWithReferrals = async () => {
    try {
      setLoading(true);

      // Tüm aktif uzmanları getir
      const { data: specialistsData, error: specialistsError } = await supabase
        .from('specialists')
        .select('id, name, specialty, city, payment_day, internal_number')
        .eq('is_active', true)
        .not('payment_day', 'is', null)
        .order('payment_day', { ascending: true });

      if (specialistsError) throw specialistsError;

      // Bu aydaki yönlendirmeleri getir
      const { data: referralsData, error: referralsError } = await supabase
        .from('client_referrals')
        .select('specialist_id')
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .eq('is_referred', true);

      if (referralsError) throw referralsError;

      // Bu ay yönlendirme yapılan uzman ID'lerini set'e çevir
      const referredSpecialistIds = new Set(
        referralsData?.map(r => r.specialist_id) || []
      );

      // Uzmanları yönlendirme durumlarıyla birleştir
      const specialistsWithReferrals: SpecialistWithReferral[] = (specialistsData || []).map(specialist => ({
        ...specialist,
        hasReferralThisMonth: referredSpecialistIds.has(specialist.id)
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

  // Ödeme günlerine göre grupla (1-31)
  const groupedByPaymentDay = specialists.reduce((acc, specialist) => {
    const day = specialist.payment_day || 0;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(specialist);
    return acc;
  }, {} as Record<number, SpecialistWithReferral[]>);

  // Gün sırasına göre sırala
  const sortedDays = Object.keys(groupedByPaymentDay)
    .map(Number)
    .sort((a, b) => a - b);

  // İstatistikler
  const totalSpecialists = specialists.length;
  const referredCount = specialists.filter(s => s.hasReferralThisMonth).length;
  const pendingCount = totalSpecialists - referredCount;

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-blue-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yükleniyor...</h2>
          <p className="text-gray-600">Danışan takvimi yükleniyor</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-red-100/50">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Erişim Reddedildi</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <HorizontalNavigation />
        
        <main className="container mx-auto px-4 py-8">
          <AdminBackButton />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Danışan Takvimi</h1>
                <p className="text-gray-500">Ödeme günlerine göre uzman listesi</p>
              </div>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToCurrentMonth} className="min-w-[160px]">
                {monthNames[currentMonth - 1]} {currentYear}
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Toplam Uzman</p>
                    <p className="text-3xl font-bold text-blue-700">{totalSpecialists}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Yönlendirme Yapıldı</p>
                    <p className="text-3xl font-bold text-green-700">{referredCount}</p>
                  </div>
                  <Check className="w-10 h-10 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Bekleyen</p>
                    <p className="text-3xl font-bold text-orange-700">{pendingCount}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Day Groups */}
          <div className="space-y-4">
            {sortedDays.map(day => {
              const daySpecialists = groupedByPaymentDay[day];
              const referred = daySpecialists.filter(s => s.hasReferralThisMonth).length;
              const pending = daySpecialists.length - referred;
              
              return (
                <Card key={day} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 py-3 px-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Her Ayın {day}'i
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {referred} tamamlandı
                        </Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {pending} bekliyor
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {daySpecialists.map(specialist => (
                        <div 
                          key={specialist.id} 
                          className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                            specialist.hasReferralThisMonth ? 'bg-green-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {specialist.hasReferralThisMonth ? (
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500 text-sm font-medium">
                                  {specialist.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{specialist.name}</p>
                              <p className="text-sm text-gray-500">
                                {specialist.specialty} • {specialist.city}
                                {specialist.internal_number && ` • #${specialist.internal_number}`}
                              </p>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={specialist.hasReferralThisMonth ? "default" : "secondary"}
                            className={specialist.hasReferralThisMonth 
                              ? "bg-green-500 hover:bg-green-600" 
                              : "bg-gray-200 text-gray-600"
                            }
                          >
                            {specialist.hasReferralThisMonth ? "Yönlendirildi ✓" : "Bekliyor"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {sortedDays.length === 0 && (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Ödeme günü tanımlanmış uzman bulunamadı</h3>
                <p className="text-gray-500">Uzman profillerinde ödeme günü bilgisi girilmelidir.</p>
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
