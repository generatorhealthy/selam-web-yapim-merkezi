import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { UserCheck, Calendar, Users, Plus, Minus, Search, Hash, Edit3, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  internal_number?: string;
  online_consultation?: boolean;
  face_to_face_consultation?: boolean;
  payment_day?: number;
}

interface MonthlyReferral {
  month: number;
  count: number;
  notes: string;
}

interface SpecialistReferral {
  id: string;
  specialist: Specialist;
  referrals: MonthlyReferral[];
}

const ClientReferrals = () => {
  const [specialists, setSpecialists] = useState<SpecialistReferral[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<SpecialistReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const { userProfile, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const canAccess = !roleLoading && !!userProfile && userProfile.is_approved && ['admin','staff'].includes(userProfile.role);

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const fetchSpecialistsAndReferrals = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching specialists and referrals for year:", currentYear);
      
      // Paralel veri çekme ile performansı artır
      const [specialistsResult, referralsResult] = await Promise.all([
        // Tüm aktif uzmanları getir
        supabase
          .from('specialists')
          .select('id, name, specialty, city, internal_number, online_consultation, face_to_face_consultation, payment_day')
          .eq('is_active', true)
          .order('name'),
        
        // Yönlendirmeleri admin/staff için RLS'i güvenli şekilde aşan RPC ile getir
        supabase.rpc('admin_get_client_referrals', { p_year: currentYear })
      ]);

      const { data: specialistsData, error: specialistsError } = specialistsResult;
      const { data: allReferrals, error: referralsError } = referralsResult;

      if (specialistsError) {
        console.error('❌ Specialists fetch error:', specialistsError);
        throw specialistsError;
      }

      if (referralsError) {
        console.error('❌ Referrals fetch error:', referralsError);
        // Referral hatası olsa bile devam et
      }

      console.log("✅ Specialists fetched:", specialistsData?.length || 0);
      console.log("✅ Referrals fetched:", allReferrals?.length || 0);
      
      // Debug: internal_number değerlerini logla
      specialistsData?.forEach(specialist => {
        console.log(`🔍 Specialist ${specialist.name}: internal_number = "${specialist.internal_number}"`);
      });

      if (!specialistsData || specialistsData.length === 0) {
        console.log("⚠️ No specialists found");
        setSpecialists([]);
        setFilteredSpecialists([]);
        return;
      }

      // Referral verilerini specialist_id'ye göre grupla (daha hızlı)
      const referralsBySpecialist = new Map();
      allReferrals?.forEach(referral => {
        if (!referralsBySpecialist.has(referral.specialist_id)) {
          referralsBySpecialist.set(referral.specialist_id, []);
        }
        referralsBySpecialist.get(referral.specialist_id).push(referral);
      });

      // Her uzman için 12 aylık veriyi oluştur (batch processing)
      const specialistReferrals: SpecialistReferral[] = specialistsData.map(specialist => {
        const specialistReferrals = referralsBySpecialist.get(specialist.id) || [];
        
          const monthlyReferrals: MonthlyReferral[] = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            // Aynı ay için birden fazla kayıt varsa: notlar için en güncel kaydı al, sayı için en yüksek değeri kullan
            const matches = (specialistReferrals as any[]).filter((r: any) => Number(r.month) === month);

            // En güncel kayıt (not için)
            const latest = matches.length > 1
              ? matches.slice().sort((a: any, b: any) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())[0]
              : matches[0];

            // Sayı için güvenli yaklaşım: mevcut kayıtlar içindeki en yüksek referral_count
            const maxCount = matches.length
              ? Math.max(...matches.map((m: any) => (m?.referral_count !== undefined && m?.referral_count !== null) ? Number(m.referral_count) : 0))
              : 0;
            
            return {
              month,
              count: maxCount,
              notes: typeof latest?.notes === 'string' ? latest.notes : ''
            };
          });

        return {
          id: specialist.id,
          specialist,
          referrals: monthlyReferrals
        };
      });

      console.log("✅ Specialist referrals processed:", specialistReferrals.length);
      setSpecialists(specialistReferrals);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      console.log("Auth ready. Fetching for year:", currentYear, "role:", userProfile?.role);
      fetchSpecialistsAndReferrals();
    } else {
      console.log("Waiting for auth to fetch referrals...");
    }
  }, [currentYear, canAccess]);

  // Sayfa odağa geldiğinde verileri yenile (yalnızca yetki varsa)
  useEffect(() => {
    const handleFocus = () => {
      if (canAccess) {
        fetchSpecialistsAndReferrals();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentYear, canAccess]);

  // Filter specialists based on search term and sort by referral count
  useEffect(() => {
    const filtered =
      searchTerm.trim() !== ""
        ? specialists.filter((specialistReferral) =>
            specialistReferral.specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialistReferral.specialist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialistReferral.specialist.city.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : specialists;

    // Sort by referral count for selected month (0 count first) - do NOT mutate original array
    const sorted = [...filtered].sort((a, b) => {
      const aReferral = a.referrals.find((ref) => ref.month === selectedMonth);
      const bReferral = b.referrals.find((ref) => ref.month === selectedMonth);
      const aCount = aReferral?.count || 0;
      const bCount = bReferral?.count || 0;

      // 0 count items first, then ascending order
      if (aCount === 0 && bCount !== 0) return -1;
      if (aCount !== 0 && bCount === 0) return 1;
      return aCount - bCount;
    });

    setFilteredSpecialists(sorted);
  }, [specialists, searchTerm, selectedMonth]);

  const updateReferralCount = async (specialistId: string, month: number, newCount: number) => {
    if (newCount < 0) return;

    // Optimistic update first, then persist; rollback on error
    const prevState = JSON.parse(JSON.stringify(specialists)) as SpecialistReferral[];

    setSpecialists(prev =>
      prev.map(spec =>
        spec.id === specialistId
          ? {
              ...spec,
              referrals: spec.referrals.map(ref =>
                ref.month === month ? { ...ref, count: newCount } : ref
              ),
            }
          : spec
      )
    );
    // Keep visible list in sync immediately
    setFilteredSpecialists(prev =>
      prev.map(spec =>
        spec.id === specialistId
          ? {
              ...spec,
              referrals: spec.referrals.map(ref =>
                ref.month === month ? { ...ref, count: newCount } : ref
              ),
            }
          : spec
      )
    );

    const currentUserId = (await supabase.auth.getUser()).data.user?.id || null;

    try {
      console.log(`Updating referral via RPC for specialist ${specialistId}, month ${month}, count ${newCount}`);

      const { error } = await supabase.rpc('admin_upsert_client_referral', {
        p_specialist_id: specialistId,
        p_year: currentYear,
        p_month: month,
        p_referral_count: newCount,
        p_referred_by: currentUserId,
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `${monthNames[month - 1]} ayı yönlendirme sayısı güncellendi`,
      });

      // Sunucudan taze veriyi çekerek kalıcılığı doğrula
      await fetchSpecialistsAndReferrals();
    } catch (rpcError) {
      console.error('RPC failed, attempting direct upsert fallback:', rpcError);
      try {
        const { error: upsertError } = await supabase
          .from('client_referrals')
          .upsert({
            specialist_id: specialistId,
            year: currentYear,
            month,
            referral_count: newCount,
            is_referred: newCount > 0,
            referred_at: newCount > 0 ? new Date().toISOString() : null,
            referred_by: newCount > 0 ? currentUserId : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'specialist_id,year,month' })
          .select();

        if (upsertError) throw upsertError;

        toast({
          title: "Başarılı",
          description: `${monthNames[month - 1]} ayı yönlendirme sayısı güncellendi`,
        });
        await fetchSpecialistsAndReferrals();
      } catch (error) {
        console.error('Error updating referral count (fallback upsert):', error);
        // Rollback to previous state on failure
        setSpecialists(prevState);
        toast({
          title: "Hata",
          description: "Yönlendirme sayısı güncellenirken hata oluştu: " + (error as Error).message,
          variant: "destructive",
        });
      }
    }
  };

  const updateNotes = async (specialistId: string, month: number, notes: string) => {
    try {
      console.log(`Updating notes via RPC for specialist ${specialistId}, month ${month}`);
      
      const { data, error } = await supabase.rpc('admin_update_client_referral_notes', {
        p_specialist_id: specialistId,
        p_year: currentYear,
        p_month: month,
        p_notes: notes
      });

      if (error) throw error;

      // Local state'i güncelle
      setSpecialists(prev => 
        prev.map(spec => 
          spec.id === specialistId 
            ? {
                ...spec,
                referrals: spec.referrals.map(ref => 
                  ref.month === month 
                    ? { ...ref, notes }
                    : ref
                )
              }
            : spec
        )
      );

      toast({
        title: "Başarılı",
        description: "Not güncellendi",
      });
      
    } catch (error) {
      console.error('Error updating notes (RPC):', error);
      toast({
        title: "Hata",
        description: "Not güncellenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const updateCity = async (specialistId: string, newCity: string) => {
    try {
      console.log(`Updating city for specialist ${specialistId}, new city: ${newCity}`);
      
      const { error } = await supabase
        .from('specialists')
        .update({ city: newCity })
        .eq('id', specialistId);

      if (error) throw error;

      // Local state'i güncelle
      setSpecialists(prev => 
        prev.map(spec => 
          spec.id === specialistId 
            ? {
                ...spec,
                specialist: { ...spec.specialist, city: newCity }
              }
            : spec
        )
      );

      toast({
        title: "Başarılı",
        description: "Şehir bilgisi güncellendi",
      });
      
    } catch (error) {
      console.error('Error updating city:', error);
      toast({
        title: "Hata",
        description: "Şehir güncellenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const updateInternalNumber = async (specialistId: string, newInternalNumber: string) => {
    try {
      console.log(`🔄 Starting internal number update for specialist ${specialistId}, new number: "${newInternalNumber}"`);
      
      // Test permission first
      const { data: readTest, error: readError } = await supabase
        .from('specialists')
        .select('id, internal_number, updated_at')
        .eq('id', specialistId)
        .single();
        
      if (readError) {
        console.error('❌ Cannot read specialist:', readError);
        throw new Error('Uzmanı okuma yetkisi yok: ' + readError.message);
      }
      
      console.log('✅ Current data before update:', readTest);
      
      const { data, error } = await supabase
        .from('specialists')
        .update({ 
          internal_number: newInternalNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialistId)
        .select();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      console.log(`✅ Database update successful:`, data);

      // Verify the update by fetching the specific record
      const { data: verification, error: verifyError } = await supabase
        .from('specialists')
        .select('internal_number, updated_at')
        .eq('id', specialistId)
        .single();

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
      } else {
        console.log(`✅ Verification: Database shows internal_number as "${verification.internal_number}"`);
        console.log(`📊 Updated_at comparison - Before: ${readTest.updated_at}, After: ${verification.updated_at}`);
      }

      // Force complete data refresh without page reload
      console.log('🔄 Refreshing all data from database...');
      await fetchSpecialistsAndReferrals();
      
      toast({
        title: "Başarılı",
        description: "Dahili numara başarıyla kaydedildi.",
      });
      
    } catch (error) {
      console.error('❌ Error updating internal number:', error);
      toast({
        title: "Hata",
        description: "Dahili numara güncellenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const getTotalReferrals = () => {
    return filteredSpecialists.reduce((total, spec) => 
      total + spec.referrals.reduce((specTotal, ref) => specTotal + ref.count, 0), 0
    );
  };

  const getMonthlyTotal = (month: number) => {
    return filteredSpecialists.reduce((total, spec) => {
      const monthReferral = spec.referrals.find(ref => ref.month === month);
      return total + (monthReferral?.count || 0);
    }, 0);
  };

  const getSelectedMonthReferrals = (specialistReferral: SpecialistReferral) => {
    return specialistReferral.referrals.find(ref => ref.month === selectedMonth) || {
      month: selectedMonth,
      count: 0,
      notes: ''
    };
  };

  // Copy August notes to other months
  const copyAugustNotesToAllMonths = async () => {
    try {
      console.log('🔄 Copying August notes to all months...');
      
      for (const specialist of specialists) {
        const augustReferral = specialist.referrals.find(ref => ref.month === 8);
        if (augustReferral && augustReferral.notes) {
          console.log(`📝 Copying notes for ${specialist.specialist.name}: "${augustReferral.notes}"`);
          
          // Copy to all months (1-12)
          for (let month = 1; month <= 12; month++) {
            if (month !== 8) { // Skip August itself
              await updateNotes(specialist.id, month, augustReferral.notes);
            }
          }
        }
      }
      
      toast({
        title: "Başarılı",
        description: "Ağustos ayındaki notlar tüm aylara kopyalandı.",
      });
      
    } catch (error) {
      console.error('❌ Error copying August notes:', error);
      toast({
        title: "Hata",
        description: "Notlar kopyalanırken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Color generator for internal numbers
  const getInternalNumberColor = (internalNumber?: string) => {
    if (!internalNumber) return "bg-gray-100 text-gray-600";
    
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700", 
      "bg-green-100 text-green-700",
      "bg-orange-100 text-orange-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
      "bg-teal-100 text-teal-700",
      "bg-yellow-100 text-yellow-700"
    ];
    
    const hash = internalNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Generate consultation type badges
  const getConsultationBadges = (specialist: Specialist) => {
    const badges = [];
    
    if (specialist.face_to_face_consultation) {
      badges.push(
        <Badge key="face-to-face" className="bg-emerald-100 text-emerald-700 border-0 font-medium px-3 py-1 text-xs">
          Yüz Yüze
        </Badge>
      );
    }
    
    if (specialist.online_consultation) {
      badges.push(
        <Badge key="online" className="bg-blue-100 text-blue-700 border-0 font-medium px-3 py-1 text-xs">
          Online
        </Badge>
      );
    }
    
    return badges;
  };

  // Access control - only admin and staff can access
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center font-medium">Yetki kontrolü yapılıyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !userProfile.is_approved || !['admin', 'staff'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md text-center">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Erişim Reddedildi</h2>
          <p className="text-slate-600 mb-4">
            Bu sayfaya sadece admin ve staff üyeleri erişebilir.
          </p>
          <Button 
            onClick={() => window.history.back()} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center font-medium">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <AdminBackButton />
        
        {/* Header Section with Enhanced Design */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    Danışan Yönlendirme
                  </h1>
                  <p className="text-slate-600 text-lg">Uzmanların aylık danışan yönlendirme durumlarını takip edin</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <select 
                    value={currentYear} 
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    className="px-6 py-3 bg-white/90 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Toplam Uzman</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{specialists.length}</div>
              <p className="text-xs text-blue-600 mt-1">Aktif uzman sayısı</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Toplam Yönlendirme</CardTitle>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{getTotalReferrals()}</div>
              <p className="text-xs text-emerald-600 mt-1">Yıllık toplam</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Seçili Ay ({monthNames[selectedMonth - 1]})</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {getMonthlyTotal(selectedMonth)}
              </div>
              <p className="text-xs text-purple-600 mt-1">Bu ay toplam</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Ortalama/Ay</CardTitle>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {specialists.length > 0 ? Math.round(getTotalReferrals() / 12) : 0}
              </div>
              <p className="text-xs text-orange-600 mt-1">Aylık ortalama</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Monthly Tracking Section */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              {currentYear} Yılı - Aylık Danışan Yönlendirme Takibi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 mb-8 bg-slate-100/50 p-1 rounded-xl">
                {monthNames.map((month, index) => (
                  <TabsTrigger 
                    key={index + 1} 
                    value={(index + 1).toString()} 
                    className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-200"
                  >
                    {month.substring(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {monthNames.map((_, monthIndex) => (
                <TabsContent key={monthIndex + 1} value={(monthIndex + 1).toString()}>
                  <div className="space-y-6">
                     <div className="text-center mb-6">
                       <h3 className="text-2xl font-bold text-gray-800 mb-2">
                         {monthNames[monthIndex]} {currentYear}
                       </h3>
                       <p className="text-gray-600">
                         Bu ay toplam {getMonthlyTotal(monthIndex + 1)} yönlendirme yapıldı
                       </p>
                       <div className="mt-4">
                         <Button
                           onClick={copyAugustNotesToAllMonths}
                           variant="outline"
                           className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-600"
                         >
                           Ağustos Notlarını Tüm Aylara Kopyala
                         </Button>
                       </div>
                     </div>

                    {/* Enhanced Search Section */}
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-blue-100/30 rounded-2xl"></div>
                      <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              placeholder="Uzman adı, uzmanlık alanı veya şehir ile ara..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-12 py-3 bg-white/80 border-white/50 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                            />
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-white/50">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">
                              {filteredSpecialists.length} / {specialists.length} uzman
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {filteredSpecialists.map((specialistReferral) => {
                      const monthlyReferral = getSelectedMonthReferrals(specialistReferral);
                      
                      return (
                        <div key={specialistReferral.id} className="relative group">
                          {/* Background gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          
                          <div className="relative bg-white/90 backdrop-blur-sm border border-white/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-blue-200/50">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                              {/* Specialist Info Section */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <h4 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-200">
                                        {specialistReferral.specialist.name}
                                      </h4>
                                      {specialistReferral.specialist.internal_number && (
                                        <Badge 
                                          className={`${getInternalNumberColor(specialistReferral.specialist.internal_number)} border-0 font-medium px-3 py-1 text-xs`}
                                        >
                                          <Hash className="w-3 h-3 mr-1" />
                                          {specialistReferral.specialist.internal_number}
                                        </Badge>
                                      )}
                                     </div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="font-medium text-slate-600">{specialistReferral.specialist.specialty}</span>
                                        <div className="flex gap-2">
                                          {getConsultationBadges(specialistReferral.specialist)}
                                        </div>
                                      </div>
                                      {specialistReferral.specialist.payment_day && (
                                        <div className="text-sm text-slate-500 mb-2">
                                          <span className="font-medium">Ödeme Günü:</span> Her ayın {specialistReferral.specialist.payment_day}'ı
                                        </div>
                                      )}
                                      
                                         {/* Editable Fields */}
                                       <div className="flex gap-3">
                                         <div className="flex-1">
                                           <Label className="text-xs text-slate-500 mb-1 block">Şehir</Label>
                                           <Input
                                             placeholder="Şehir girin..."
                                             value={specialistReferral.specialist.city}
                                             onChange={(e) => {
                                               setSpecialists(prev => 
                                                 prev.map(spec => 
                                                   spec.id === specialistReferral.id 
                                                     ? {
                                                         ...spec,
                                                         specialist: { ...spec.specialist, city: e.target.value }
                                                       }
                                                     : spec
                                                 )
                                               );
                                             }}
                                             onBlur={(e) => updateCity(
                                               specialistReferral.id, 
                                               e.target.value
                                             )}
                                             className="h-8 text-sm bg-white/80 border-slate-200/50 rounded-lg"
                                           />
                                         </div>
                                          <div className="flex-1">
                                            <Label className="text-xs text-slate-500 mb-1 block">Dahili Numara</Label>
                                            <Input
                                              placeholder="Dahili numara..."
                                              value={specialistReferral.specialist.internal_number || ''}
                                              onChange={(e) => {
                                                const newValue = e.target.value;
                                                console.log(`Internal number changed for ${specialistReferral.specialist.name}: ${newValue}`);
                                                setSpecialists(prev => 
                                                  prev.map(spec => 
                                                    spec.id === specialistReferral.id 
                                                      ? {
                                                          ...spec,
                                                          specialist: { ...spec.specialist, internal_number: newValue }
                                                        }
                                                      : spec
                                                  )
                                                );
                                                setFilteredSpecialists(prev => 
                                                  prev.map(spec => 
                                                    spec.id === specialistReferral.id 
                                                      ? {
                                                          ...spec,
                                                          specialist: { ...spec.specialist, internal_number: newValue }
                                                        }
                                                      : spec
                                                  )
                                                );
                                              }}
                                              onBlur={(e) => {
                                                console.log(`Internal number blur event for ${specialistReferral.specialist.name}: ${e.target.value}`);
                                                updateInternalNumber(specialistReferral.id, e.target.value);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  console.log(`Internal number Enter pressed for ${specialistReferral.specialist.name}: ${e.currentTarget.value}`);
                                                  updateInternalNumber(specialistReferral.id, e.currentTarget.value);
                                                  e.currentTarget.blur();
                                                }
                                              }}
                                              className="h-8 text-sm bg-white/80 border-slate-200/50 rounded-lg"
                                            />
                                          </div>
                                       </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Controls Section */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                                {/* Referral Counter */}
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-2xl"></div>
                                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200/30 shadow-md p-4">
                                    <div className="flex items-center space-x-4">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateReferralCount(
                                          specialistReferral.id, 
                                          monthIndex + 1, 
                                          Math.max(0, monthlyReferral.count - 1)
                                        )}
                                        disabled={monthlyReferral.count <= 0}
                                        className="h-10 w-10 p-0 rounded-xl border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </Button>
                                      
                                      <div className="text-center min-w-[80px]">
                                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                          {monthlyReferral.count}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium">yönlendirme</div>
                                      </div>
                                      
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateReferralCount(
                                          specialistReferral.id, 
                                          monthIndex + 1, 
                                          monthlyReferral.count + 1
                                        )}
                                        className="h-10 w-10 p-0 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all duration-200"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Notes Section */}
                                <div className="flex-1 min-w-[250px]">
                                  <div className="relative">
                                    <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                     <Input
                                        placeholder="Notlar girin..."
                                       value={monthlyReferral.notes}
                                      onChange={(e) => {
                                        setSpecialists(prev => 
                                          prev.map(spec => 
                                            spec.id === specialistReferral.id 
                                              ? {
                                                  ...spec,
                                                  referrals: spec.referrals.map(ref => 
                                                    ref.month === selectedMonth 
                                                      ? { ...ref, notes: e.target.value }
                                                      : ref
                                                  )
                                                }
                                              : spec
                                          )
                                        );
                                      }}
                                      onBlur={(e) => updateNotes(
                                        specialistReferral.id, 
                                        selectedMonth, 
                                        e.target.value
                                      )}
                                      className="pl-10 py-3 bg-white/80 border-slate-200/50 rounded-xl shadow-sm focus:shadow-md focus:border-blue-300 transition-all duration-200"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredSpecialists.length === 0 && searchTerm && (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">"{searchTerm}" araması için sonuç bulunamadı.</p>
                        <p className="text-sm mt-2">Farklı bir terim ile tekrar deneyin.</p>
                      </div>
                    )}
                    
                    {specialists.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Henüz uzman bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default ClientReferrals;
