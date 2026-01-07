import { useState } from "react";
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
  Loader2,
  User,
  Phone,
  Mail,
  Calendar,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PaymentAttempt {
  paymentStatus: string;
  errorMessage?: string;
  createdDate: number;
}

interface SubscriptionOrder {
  referenceCode: string;
  price: number;
  orderStatus: string;
  paymentAttempts: PaymentAttempt[];
}

interface UnpaidSubscription {
  referenceCode: string;
  customerEmail: string;
  customerGsmNumber: string;
  subscriptionStatus: string;
  pricingPlanName: string;
  orders: SubscriptionOrder[];
}

interface RetryResult {
  subscriptionRef: string;
  customerEmail: string;
  orderRef: string;
  success: boolean;
  message: string;
}

interface RetryResponse {
  status: string;
  message?: string;
  errorMessage?: string;
  summary: {
    unpaidSubscriptions: number;
    totalRetries: number;
    successful: number;
    failed: number;
  };
  results: RetryResult[];
  subscriptions?: UnpaidSubscription[];
}

const IyzicoPayments = () => {
  const [loading, setLoading] = useState(false);
  const [retryingOrder, setRetryingOrder] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RetryResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkFailedPayments = async () => {
    setLoading(true);
    const checkedAt = new Date();

    try {
      const { data, error } = await supabase.functions.invoke("retry-failed-iyzico-payments");

      setLastChecked(checkedAt);

      if (error) {
        const msg = error.message || "Ödeme kontrolü sırasında bir hata oluştu";
        setLastResult({
          status: "error",
          message: msg,
          summary: { unpaidSubscriptions: 0, totalRetries: 0, successful: 0, failed: 0 },
          results: [],
          subscriptions: [],
        });
        toast.error(msg);
        return;
      }

      setLastResult(data);

      if (data.status === "error") {
        toast.error(data.message || data.errorMessage || "API hatası oluştu");
        return;
      }

      if (data.summary.totalRetries > 0) {
        if (data.summary.successful > 0) {
          toast.success(`${data.summary.successful} ödeme başarıyla tekrar denendi`);
        }
        if (data.summary.failed > 0) {
          toast.error(`${data.summary.failed} ödeme tekrar denenemedi`);
        }
      } else if (data.summary.unpaidSubscriptions === 0) {
        toast.info("Ödenmemiş abonelik bulunamadı");
      } else {
        toast.info(`${data.summary.unpaidSubscriptions} ödenmemiş abonelik listelendi`);
      }
    } catch (error: any) {
      console.error("Ödeme kontrolü hatası:", error);
      const msg = error?.message || "Ödeme kontrolü sırasında bir hata oluştu";
      setLastChecked(checkedAt);
      setLastResult({
        status: "error",
        message: msg,
        summary: { unpaidSubscriptions: 0, totalRetries: 0, successful: 0, failed: 0 },
        results: [],
        subscriptions: [],
      });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const retrySpecificOrder = async (orderReferenceCode: string) => {
    setRetryingOrder(orderReferenceCode);
    try {
      const { data, error } = await supabase.functions.invoke("retry-failed-iyzico-payments", {
        body: { orderReferenceCode }
      });

      if (error) {
        toast.error(error.message || "Ödeme tekrar denenemedi");
        return;
      }

      if (data.status === "error") {
        toast.error(data.message || "Ödeme tekrar denenemedi");
        return;
      }

      if (data.results?.[0]?.success) {
        toast.success("Ödeme başarıyla tahsil edildi!");
        // Listeyi yenile
        await checkFailedPayments();
      } else {
        toast.error(data.results?.[0]?.message || "Ödeme tekrar denenemedi");
      }
    } catch (error: any) {
      toast.error(error?.message || "Bir hata oluştu");
    } finally {
      setRetryingOrder(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd MMM yyyy HH:mm", { locale: tr });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FAILED":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Başarısız</Badge>;
      case "SUCCESS":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Başarılı</Badge>;
      case "WAITING":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Bekliyor</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFailedOrdersCount = (sub: UnpaidSubscription) => {
    return sub.orders?.filter(o => 
      o.orderStatus === "WAITING" && 
      o.paymentAttempts?.some(a => a.paymentStatus === "FAILED")
    ).length || 0;
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>İyzico Ödemeleri - Divan Paneli</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30">
        <HorizontalNavigation />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <AdminBackButton />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              İyzico Ödemeleri
            </h1>
            <p className="text-muted-foreground mt-2">
              Başarısız abonelik ödemelerini takip edin ve yeniden deneyin
            </p>
          </div>

          {/* Bilgi Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Otomatik Deneme */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100">
                    <Clock className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-800">Otomatik Deneme Aktif</h3>
                    <p className="text-emerald-700 text-sm mt-1">
                      Sistem <strong>her 6 saatte bir</strong> (günde 4 kez) başarısız ödemeleri otomatik olarak tekrar deniyor.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manuel Kontrol */}
            <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-violet-100">
                    <CreditCard className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-violet-800">Manuel Kontrol</h3>
                    <p className="text-violet-700 text-sm mt-1 mb-3">
                      Aşağıdaki buton ile başarısız ödemeleri görüntüleyin ve tekrar deneyin.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button 
                        onClick={checkFailedPayments} 
                        disabled={loading}
                        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Kontrol Ediliyor...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Ödemeleri Kontrol Et
                          </>
                        )}
                      </Button>
                      {lastChecked && (
                        <span className="text-xs text-violet-600 bg-violet-100 px-3 py-1.5 rounded-full">
                          Son: {format(lastChecked, "dd MMM HH:mm", { locale: tr })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Hata Durumu */}
          {lastResult && lastResult.status === "error" && (
            <Card className="mb-6 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">API Hatası</h3>
                    <p className="text-red-700 text-sm mt-1">
                      {lastResult.message || lastResult.errorMessage || "iyzico API'ye bağlanırken bir hata oluştu"}
                    </p>
                    <p className="text-red-600 text-xs mt-2 bg-red-100 p-2 rounded-lg inline-block">
                      Supabase Edge Function ayarlarından IYZICO_API_KEY ve IYZICO_SECRET_KEY değerlerini kontrol edin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sonuçlar */}
          {lastResult && lastResult.status === "success" && (
            <>
              {/* Özet Kartlar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Ödenmemiş</p>
                        <p className="text-3xl font-bold text-amber-700 mt-1">{lastResult.summary.unpaidSubscriptions}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-100">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Toplam Deneme</p>
                        <p className="text-3xl font-bold text-blue-700 mt-1">{lastResult.summary.totalRetries}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-100">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Başarılı</p>
                        <p className="text-3xl font-bold text-emerald-700 mt-1">{lastResult.summary.successful}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-100">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-rose-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Başarısız</p>
                        <p className="text-3xl font-bold text-red-700 mt-1">{lastResult.summary.failed}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-red-100">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tüm Ödenmemiş Abonelikler */}
              {lastResult.subscriptions && lastResult.subscriptions.length > 0 && (
                <Card className="mb-6 shadow-sm border-0">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <span>Ödenmemiş Abonelikler</span>
                      <Badge variant="outline" className="ml-auto text-amber-600 border-amber-300 bg-amber-50">
                        {lastResult.subscriptions.length} Abonelik
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {lastResult.subscriptions.map((sub, index) => (
                        <Card key={index} className="border shadow-sm overflow-hidden">
                          {/* Üst Kısım - Müşteri Bilgisi */}
                          <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 p-4 border-b">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {sub.customerEmail.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">{sub.customerEmail}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{sub.customerGsmNumber || "-"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-0">
                                  {sub.pricingPlanName}
                                </Badge>
                                <span className="text-xs text-gray-500 font-mono">{sub.referenceCode.slice(0, 20)}...</span>
                                {getFailedOrdersCount(sub) > 0 && (
                                  <Badge variant="destructive" className="mt-1">
                                    {getFailedOrdersCount(sub)} Başarısız Ödeme
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Siparişler */}
                          {sub.orders && sub.orders.length > 0 && (
                            <div className="p-4 bg-white">
                              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Ödeme Siparişleri ({sub.orders.length})
                              </p>
                              <div className="space-y-3">
                                {sub.orders.map((order, orderIndex) => {
                                  const hasFailedAttempt = order.paymentAttempts?.some(a => a.paymentStatus === "FAILED");
                                  const isWaiting = order.orderStatus === "WAITING";
                                  const canRetry = isWaiting && hasFailedAttempt;
                                  
                                  return (
                                    <div 
                                      key={orderIndex} 
                                      className={`rounded-xl p-4 border ${
                                        canRetry 
                                          ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200" 
                                          : order.orderStatus === "SUCCESS" 
                                            ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                                            : "bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                          <span className="font-mono text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                            {order.referenceCode.slice(0, 24)}...
                                          </span>
                                          {getStatusBadge(order.orderStatus === "SUCCESS" ? "SUCCESS" : hasFailedAttempt ? "FAILED" : order.orderStatus)}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-xl font-bold text-gray-900">{order.price.toLocaleString('tr-TR')} ₺</span>
                                          {canRetry && (
                                            <Button 
                                              size="sm"
                                              onClick={() => retrySpecificOrder(order.referenceCode)}
                                              disabled={retryingOrder === order.referenceCode}
                                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md"
                                            >
                                              {retryingOrder === order.referenceCode ? (
                                                <>
                                                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                                  Deneniyor...
                                                </>
                                              ) : (
                                                <>
                                                  <RefreshCw className="h-3 w-3 mr-1.5" />
                                                  Tekrar Dene
                                                </>
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Son Ödeme Denemeleri */}
                                      {order.paymentAttempts && order.paymentAttempts.length > 0 && (
                                        <div className="space-y-2 mt-3 pt-3 border-t border-dashed">
                                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Son Denemeler</p>
                                          <div className="grid gap-2">
                                            {order.paymentAttempts
                                              .sort((a, b) => b.createdDate - a.createdDate)
                                              .slice(0, 3)
                                              .map((attempt, attemptIndex) => (
                                                <div 
                                                  key={attemptIndex} 
                                                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${
                                                    attempt.paymentStatus === "FAILED" 
                                                      ? "bg-red-100/80 text-red-800" 
                                                      : "bg-emerald-100/80 text-emerald-800"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    {attempt.paymentStatus === "FAILED" ? (
                                                      <XCircle className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                    )}
                                                    <span className="font-medium">
                                                      {attempt.paymentStatus === "FAILED" ? "Başarısız" : "Başarılı"}
                                                    </span>
                                                    {attempt.errorMessage && (
                                                      <span className="text-red-600 text-xs">
                                                        - {attempt.errorMessage}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <span className="text-xs opacity-80">{formatDate(attempt.createdDate)}</span>
                                                </div>
                                              ))
                                            }
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hiç ödenmemiş abonelik yoksa */}
              {lastResult.summary.unpaidSubscriptions === 0 && (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-emerald-100">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-800">Tüm Ödemeler Güncel</h3>
                        <p className="text-emerald-700 text-sm mt-1">
                          Şu anda ödenmemiş abonelik bulunmuyor. Tüm ödemeler başarıyla alınmış. 🎉
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
