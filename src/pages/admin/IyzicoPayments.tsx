import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface RetryResult {
  subscriptionRef: string;
  customerEmail: string;
  orderRef: string;
  success: boolean;
  message: string;
}

interface RetryResponse {
  status: string;
  summary: {
    unpaidSubscriptions: number;
    totalRetries: number;
    successful: number;
    failed: number;
  };
  results: RetryResult[];
}

const IyzicoPayments = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<RetryResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkFailedPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('retry-failed-iyzico-payments');
      
      if (error) throw error;
      
      setLastResult(data);
      setLastChecked(new Date());
      
      if (data.summary.totalRetries > 0) {
        if (data.summary.successful > 0) {
          toast.success(`${data.summary.successful} ödeme başarıyla tekrar denendi`);
        }
        if (data.summary.failed > 0) {
          toast.error(`${data.summary.failed} ödeme tekrar denenemedi`);
        }
      } else {
        toast.info("Tekrar denenmesi gereken ödeme bulunamadı");
      }
    } catch (error) {
      console.error("Ödeme kontrolü hatası:", error);
      toast.error("Ödeme kontrolü sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>İyzico Ödemeleri - Divan Paneli</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30">
        <HorizontalNavigation />
        
        <div className="container mx-auto px-4 py-8">
          <AdminBackButton />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              İyzico Ödemeleri
            </h1>
            <p className="text-gray-600 mt-2">
              Başarısız abonelik ödemelerini takip edin ve yeniden deneyin
            </p>
          </div>

          {/* Otomatik Deneme Bilgisi */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800">Otomatik Ödeme Denemesi Aktif</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Sistem her 6 saatte bir başarısız ödemeleri otomatik olarak tekrar deniyor. 
                    Son başarısız denemeden 6 saat geçmeden aynı ödeme tekrar denenmez.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manuel Kontrol */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Manuel Ödeme Kontrolü
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button 
                  onClick={checkFailedPayments} 
                  disabled={loading}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Kontrol Ediliyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Başarısız Ödemeleri Kontrol Et
                    </>
                  )}
                </Button>
                
                {lastChecked && (
                  <span className="text-sm text-gray-500">
                    Son kontrol: {format(lastChecked, "dd MMMM yyyy HH:mm", { locale: tr })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sonuçlar */}
          {lastResult && (
            <>
              {/* Özet Kartlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Ödenmemiş Abonelik</p>
                        <p className="text-2xl font-bold">{lastResult.summary.unpaidSubscriptions}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Toplam Deneme</p>
                        <p className="text-2xl font-bold">{lastResult.summary.totalRetries}</p>
                      </div>
                      <RefreshCw className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Başarılı</p>
                        <p className="text-2xl font-bold text-green-600">{lastResult.summary.successful}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Başarısız</p>
                        <p className="text-2xl font-bold text-red-600">{lastResult.summary.failed}</p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detaylı Sonuçlar */}
              {lastResult.results.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Deneme Detayları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Müşteri E-posta</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Abonelik Ref</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Sipariş Ref</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Durum</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Mesaj</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lastResult.results.map((result, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm">{result.customerEmail}</td>
                              <td className="py-3 px-4 text-sm font-mono text-xs">{result.subscriptionRef}</td>
                              <td className="py-3 px-4 text-sm font-mono text-xs">{result.orderRef}</td>
                              <td className="py-3 px-4">
                                <Badge variant={result.success ? "default" : "destructive"}>
                                  {result.success ? "Başarılı" : "Başarısız"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">{result.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {lastResult.results.length === 0 && lastResult.summary.unpaidSubscriptions > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-amber-800">Bekleme Süresinde</h3>
                        <p className="text-amber-700 text-sm mt-1">
                          {lastResult.summary.unpaidSubscriptions} ödenmemiş abonelik bulundu ancak son denemeden 
                          6 saat geçmediği için yeniden denenmediler. Sistem otomatik olarak uygun zamanda deneyecek.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default IyzicoPayments;
