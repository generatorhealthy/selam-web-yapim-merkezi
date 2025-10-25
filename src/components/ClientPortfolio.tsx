import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Phone, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientReferral {
  id: string;
  year: number;
  month: number;
  referral_count: number;
  client_name: string | null;
  client_surname: string | null;
  client_contact: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientPortfolioProps {
  specialistId: string;
}

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const ClientPortfolio = ({ specialistId }: ClientPortfolioProps) => {
  const [referrals, setReferrals] = useState<ClientReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReferrals();
  }, [specialistId, selectedYear]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_referrals')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('year', selectedYear)
        .order('month', { ascending: true });

      if (error) throw error;

      setReferrals(data || []);
    } catch (error) {
      console.error('Danışan portföyü yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalReferrals = () => {
    return referrals.reduce((sum, ref) => sum + (ref.referral_count || 0), 0);
  };

  const getReferralsByMonth = (month: number) => {
    return referrals.filter(ref => ref.month === month && ref.referral_count > 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yönlendirme</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalReferrals()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedYear} yılı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Aylar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referrals.filter(r => r.referral_count > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Yönlendirme yapılan ay sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama/Ay</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referrals.filter(r => r.referral_count > 0).length > 0
                ? Math.round(getTotalReferrals() / referrals.filter(r => r.referral_count > 0).length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aylık ortalama danışan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Yıl Seçici */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danışan Yönlendirmeleri</CardTitle>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
              {monthNames.map((month, index) => (
                <TabsTrigger key={index + 1} value={(index + 1).toString()}>
                  {month.substring(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {monthNames.map((month, index) => {
              const monthReferrals = getReferralsByMonth(index + 1);
              const totalCount = monthReferrals.reduce((sum, ref) => sum + ref.referral_count, 0);

              return (
                <TabsContent key={index + 1} value={(index + 1).toString()} className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {month} {selectedYear}
                    </h3>
                    <Badge variant="secondary">
                      {totalCount} Yönlendirme
                    </Badge>
                  </div>

                  {monthReferrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Bu ay için yönlendirme bulunmamaktadır.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monthReferrals.map((referral) => (
                        <Card key={referral.id} className="bg-slate-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-primary" />
                                  <span className="font-medium">
                                    {referral.client_name && referral.client_surname
                                      ? `${referral.client_name} ${referral.client_surname}`
                                      : 'Danışan bilgisi mevcut değil'}
                                  </span>
                                </div>
                                
                                {referral.client_contact && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    <span>{referral.client_contact}</span>
                                  </div>
                                )}
                                
                                <div className="text-xs text-muted-foreground">
                                  Yönlendirme Tarihi: {new Date(referral.updated_at).toLocaleDateString('tr-TR')}
                                </div>
                              </div>
                              
                              <Badge className="bg-primary/10 text-primary">
                                {referral.referral_count} Danışan
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
