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
import { UserCheck, Calendar, Users, Plus, Minus, Search } from "lucide-react";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
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
  const { toast } = useToast();

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const fetchSpecialistsAndReferrals = async () => {
    try {
      setLoading(true);
      console.log("Fetching specialists and referrals for year:", currentYear);
      
      // Önce tüm aktif uzmanları getir
      const { data: specialistsData, error: specialistsError } = await supabase
        .from('specialists')
        .select('id, name, specialty, city')
        .eq('is_active', true)
        .order('name');

      if (specialistsError) {
        console.error('Specialists fetch error:', specialistsError);
        throw specialistsError;
      }

      console.log("Specialists fetched:", specialistsData?.length || 0);

      if (!specialistsData || specialistsData.length === 0) {
        console.log("No specialists found");
        setSpecialists([]);
        setFilteredSpecialists([]);
        return;
      }

      // Her uzman için 12 aylık referral verilerini getir/oluştur
      const specialistReferrals: SpecialistReferral[] = [];

      for (const specialist of specialistsData) {
        console.log(`Processing specialist: ${specialist.name}`);
        const monthlyReferrals: MonthlyReferral[] = [];

        // Tüm ayları bir seferde getir
        const { data: existingReferrals, error: referralsError } = await supabase
          .from('client_referrals')
          .select('*')
          .eq('specialist_id', specialist.id)
          .eq('year', currentYear);

        if (referralsError) {
          console.error('Referrals fetch error:', referralsError);
          // Hata olsa bile devam et
        }

        // Her ay için veri oluştur
        for (let month = 1; month <= 12; month++) {
          const existingReferral = existingReferrals?.find(r => r.month === month);
          
          if (existingReferral) {
            monthlyReferrals.push({
              month,
              count: existingReferral.referral_count || 0,
              notes: existingReferral.notes || ''
            });
          } else {
            // Kayıt yoksa sadece local state'e ekle, veritabanına ekleme
            monthlyReferrals.push({
              month,
              count: 0,
              notes: ''
            });
          }
        }

        specialistReferrals.push({
          id: specialist.id,
          specialist,
          referrals: monthlyReferrals
        });
      }

      console.log("Specialist referrals processed:", specialistReferrals.length);
      setSpecialists(specialistReferrals);
      
    } catch (error) {
      console.error('Error fetching data:', error);
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
    console.log("Year changed to:", currentYear);
    fetchSpecialistsAndReferrals();
  }, [currentYear]);

  // Filter specialists based on search term and sort by referral count
  useEffect(() => {
    let filtered = specialists;
    
    if (searchTerm.trim() !== "") {
      filtered = specialists.filter(specialistReferral =>
        specialistReferral.specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialistReferral.specialist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialistReferral.specialist.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by referral count for selected month (0 count first)
    const sorted = filtered.sort((a, b) => {
      const aReferral = a.referrals.find(ref => ref.month === selectedMonth);
      const bReferral = b.referrals.find(ref => ref.month === selectedMonth);
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

    try {
      console.log(`Updating referral count for specialist ${specialistId}, month ${month}, count ${newCount}`);
      
      // Önce kayıt var mı kontrol et
      const { data: existingRecord } = await supabase
        .from('client_referrals')
        .select('id')
        .eq('specialist_id', specialistId)
        .eq('year', currentYear)
        .eq('month', month)
        .single();

      if (existingRecord) {
        // Güncelle
        const { error } = await supabase
          .from('client_referrals')
          .update({
            referral_count: newCount,
            is_referred: newCount > 0,
            referred_at: newCount > 0 ? new Date().toISOString() : null,
            referred_by: newCount > 0 ? (await supabase.auth.getUser()).data.user?.id : null,
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Yeni kayıt oluştur
        const { error } = await supabase
          .from('client_referrals')
          .insert({
            specialist_id: specialistId,
            year: currentYear,
            month: month,
            referral_count: newCount,
            is_referred: newCount > 0,
            referred_at: newCount > 0 ? new Date().toISOString() : null,
            referred_by: newCount > 0 ? (await supabase.auth.getUser()).data.user?.id : null,
          });

        if (error) throw error;
      }

      // Local state'i güncelle
      setSpecialists(prev => 
        prev.map(spec => 
          spec.id === specialistId 
            ? {
                ...spec,
                referrals: spec.referrals.map(ref => 
                  ref.month === month 
                    ? { ...ref, count: newCount }
                    : ref
                )
              }
            : spec
        )
      );

      toast({
        title: "Başarılı",
        description: `${monthNames[month - 1]} ayı yönlendirme sayısı güncellendi`,
      });
      
    } catch (error) {
      console.error('Error updating referral count:', error);
      toast({
        title: "Hata",
        description: "Yönlendirme sayısı güncellenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const updateNotes = async (specialistId: string, month: number, notes: string) => {
    try {
      console.log(`Updating notes for specialist ${specialistId}, month ${month}`);
      
      // Önce kayıt var mı kontrol et
      const { data: existingRecord } = await supabase
        .from('client_referrals')
        .select('id')
        .eq('specialist_id', specialistId)
        .eq('year', currentYear)
        .eq('month', month)
        .single();

      if (existingRecord) {
        // Güncelle
        const { error } = await supabase
          .from('client_referrals')
          .update({ notes })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Yeni kayıt oluştur
        const { error } = await supabase
          .from('client_referrals')
          .insert({
            specialist_id: specialistId,
            year: currentYear,
            month: month,
            referral_count: 0,
            notes: notes
          });

        if (error) throw error;
      }

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
      console.error('Error updating notes:', error);
      toast({
        title: "Hata",
        description: "Not güncellenirken hata oluştu: " + (error as Error).message,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <AdminBackButton />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Danışan Yönlendirme</h1>
            <p className="text-gray-600">Uzmanların aylık danışan yönlendirme durumlarını takip edin</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={currentYear} 
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Uzman</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{specialists.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Yönlendirme</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{getTotalReferrals()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seçili Ay ({monthNames[selectedMonth - 1]})</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getMonthlyTotal(selectedMonth)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama/Ay</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {specialists.length > 0 ? Math.round(getTotalReferrals() / 12) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ay Seçimi ve Uzman Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>{currentYear} Yılı - Aylık Danışan Yönlendirme Takibi</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 mb-6">
                {monthNames.map((month, index) => (
                  <TabsTrigger key={index + 1} value={(index + 1).toString()} className="text-xs">
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
                    </div>

                    {/* Arama Bölümü */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Uzman adı, uzmanlık alanı veya şehir ile ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        {filteredSpecialists.length} / {specialists.length} uzman
                      </div>
                    </div>

                    {filteredSpecialists.map((specialistReferral) => {
                      const monthlyReferral = getSelectedMonthReferrals(specialistReferral);
                      
                      return (
                        <div key={specialistReferral.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                                {specialistReferral.specialist.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {specialistReferral.specialist.specialty} - {specialistReferral.specialist.city}
                              </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReferralCount(
                                    specialistReferral.id, 
                                    selectedMonth, 
                                    Math.max(0, monthlyReferral.count - 1)
                                  )}
                                  disabled={monthlyReferral.count <= 0}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                
                                <div className="text-center min-w-[60px]">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {monthlyReferral.count}
                                  </div>
                                  <div className="text-xs text-gray-500">yönlendirme</div>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReferralCount(
                                    specialistReferral.id, 
                                    selectedMonth, 
                                    monthlyReferral.count + 1
                                  )}
                                  className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="flex-1 min-w-[200px]">
                                <Input
                                  placeholder="Not ekle..."
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
                                  className="text-sm bg-white"
                                />
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
