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
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [retryingSubscription, setRetryingSubscription] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RetryResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  const toggleExpand = (refCode: string) => {
    setExpandedSubs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(refCode)) {
        newSet.delete(refCode);
      } else {
        newSet.add(refCode);
      }
      return newSet;
    });
  };

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

  const retrySpecificOrder = async (orderReferenceCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const retryAllForSubscription = async (sub: UnpaidSubscription, e: React.MouseEvent) => {
    e.stopPropagation();

    // Son ödeme denemesi FAILED olan siparişleri bul
    const retryableOrders = sub.orders?.filter(o => {
      if (!o.paymentAttempts || o.paymentAttempts.length === 0) return false;
      const lastAttempt = [...o.paymentAttempts].sort((a, b) => b.createdDate - a.createdDate)[0];
      return lastAttempt?.paymentStatus === "FAILED";
    }) || [];

    if (retryableOrders.length === 0) {
      toast.info("Bu abonelikte yeniden denenecek başarısız ödeme bulunamadı.");
      setExpandedSubs((prev) => new Set(prev).add(sub.referenceCode));
      return;
    }

    setRetryingSubscription(sub.referenceCode);

    let successCount = 0;
    let failCount = 0;

    for (const order of retryableOrders) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "retry-failed-iyzico-payments",
          {
            body: { orderReferenceCode: order.referenceCode },
          }
        );

        if (!error && data.results?.[0]?.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} ödeme başarıyla tahsil edildi!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} ödeme tekrar denenemedi`);
    }

    await checkFailedPayments();
    setRetryingSubscription(null);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd MMM yyyy HH:mm", { locale: tr });
  };

  // Son ödeme denemesinin FAILED olduğu siparişleri bul
  const getRetryableOrders = (sub: UnpaidSubscription) => {
    return sub.orders?.filter(o => {
      if (!o.paymentAttempts || o.paymentAttempts.length === 0) return false;
      // Son denemeyi bul (en yeni tarihli)
      const lastAttempt = [...o.paymentAttempts].sort((a, b) => b.createdDate - a.createdDate)[0];
      return lastAttempt?.paymentStatus === "FAILED";
    }) || [];
  };

  const getFailedOrdersCount = (sub: UnpaidSubscription) => {
    return getRetryableOrders(sub).length;
  };

  const getTotalFailedAmount = (sub: UnpaidSubscription) => {
    return getRetryableOrders(sub).reduce((sum, o) => sum + o.price, 0);
  };

  // Tek bir sipariş için son deneme FAILED mi kontrol et
  const isOrderRetryable = (order: SubscriptionOrder) => {
    if (!order.paymentAttempts || order.paymentAttempts.length === 0) return false;
    const lastAttempt = [...order.paymentAttempts].sort((a, b) => b.createdDate - a.createdDate)[0];
    return lastAttempt?.paymentStatus === "FAILED";
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
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              İyzico Ödemeleri
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Başarısız abonelik ödemelerini takip edin ve yeniden deneyin
            </p>
          </div>

          {/* Bilgi ve Kontrol */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-800 text-sm">Otomatik Deneme Aktif</h3>
                    <p className="text-emerald-700 text-xs">Her 6 saatte bir (günde 4 kez) otomatik deneme</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100">
                      <CreditCard className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-violet-800 text-sm">Manuel Kontrol</h3>
                      <p className="text-violet-700 text-xs">Listeyi yenile ve durumu kontrol et</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={checkFailedPayments} 
                      disabled={loading}
                      size="sm"
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-sm"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Kontrol Et</span>
                    </Button>
                    {lastChecked && (
                      <span className="text-xs text-violet-600 bg-violet-100 px-2 py-1 rounded-full hidden sm:inline">
                        {format(lastChecked, "HH:mm", { locale: tr })}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Hata */}
          {lastResult && lastResult.status === "error" && (
            <Card className="mb-6 border-red-200 bg-red-50 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-red-800 font-medium text-sm">API Hatası</p>
                    <p className="text-red-700 text-xs">{lastResult.message || lastResult.errorMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sonuçlar */}
          {lastResult && lastResult.status === "success" && (
            <>
              {/* Özet */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardContent className="py-3 px-4">
                    <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Ödenmemiş</p>
                    <p className="text-2xl font-bold text-amber-700">{lastResult.summary.unpaidSubscriptions}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="py-3 px-4">
                    <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">Deneme</p>
                    <p className="text-2xl font-bold text-blue-700">{lastResult.summary.totalRetries}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardContent className="py-3 px-4">
                    <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">Başarılı</p>
                    <p className="text-2xl font-bold text-emerald-700">{lastResult.summary.successful}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-rose-50">
                  <CardContent className="py-3 px-4">
                    <p className="text-[10px] font-medium text-red-600 uppercase tracking-wide">Başarısız</p>
                    <p className="text-2xl font-bold text-red-700">{lastResult.summary.failed}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Abonelikler Grid */}
              {lastResult.subscriptions && lastResult.subscriptions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {lastResult.subscriptions.map((sub, index) => {
                    const failedCount = getFailedOrdersCount(sub);
                    const failedAmount = getTotalFailedAmount(sub);
                    const isExpanded = expandedSubs.has(sub.referenceCode);
                    const isRetrying = retryingSubscription === sub.referenceCode;

                    return (
                      <Collapsible 
                        key={index} 
                        open={isExpanded} 
                        onOpenChange={() => toggleExpand(sub.referenceCode)}
                      >
                        <Card className={`shadow-sm transition-all cursor-pointer hover:shadow-md ${
                          failedCount > 0 ? "border-red-200 bg-gradient-to-br from-white to-red-50/30" : "border-gray-200"
                        }`}>
                          <CollapsibleTrigger asChild>
                            <CardContent className="py-4">
                              {/* Üst: Avatar + E-posta + Badge */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {sub.customerEmail.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate max-w-[180px]">
                                      {sub.customerEmail}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {sub.customerGsmNumber || "-"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              {/* Orta: Paket + Tutar */}
                              <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                                  {sub.pricingPlanName}
                                </Badge>
                                {failedCount > 0 && (
                                  <span className="text-lg font-bold text-red-600">
                                    {failedAmount.toLocaleString('tr-TR')} ₺
                                  </span>
                                )}
                              </div>

                              {/* Alt: Durum + Buton */}
                              <div className="flex items-center justify-between">
                                {sub.subscriptionStatus === "UNPAID" ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Ödeme Yok
                                  </Badge>
                                ) : failedCount > 0 ? (
                                  <Badge variant="destructive" className="text-xs">
                                    {failedCount} Başarısız Ödeme
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                                    Aktif
                                  </Badge>
                                )}
                                
                                {/* Her ödenmemiş abonelik için tekrar dene butonu */}
                                {(sub.subscriptionStatus === "UNPAID" || failedCount > 0) && (
                                  <Button 
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => retryAllForSubscription(sub, e)}
                                    disabled={isRetrying}
                                    className="h-7 text-xs px-3"
                                  >
                                    {isRetrying ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Tekrar Dene
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t px-4 py-3 bg-gray-50/50">
                              <p className="text-xs font-medium text-gray-600 mb-2">Siparişler ({sub.orders?.length || 0})</p>
                              <div className="space-y-2">
                                {sub.orders?.map((order, orderIndex) => {
                                  const canRetry = isOrderRetryable(order);
                                  const isOrderRetryingNow = retryingOrder === order.referenceCode;

                                  return (
                                    <div 
                                      key={orderIndex} 
                                      className={`rounded-lg p-3 text-xs ${
                                        canRetry 
                                          ? "bg-red-50 border border-red-200" 
                                          : "bg-emerald-50 border border-emerald-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <code className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border">
                                            {order.referenceCode.slice(0, 16)}...
                                          </code>
                                          {canRetry ? (
                                            <Badge variant="destructive" className="text-[10px] h-5">Başarısız</Badge>
                                          ) : (
                                            <Badge className="bg-emerald-500 text-white text-[10px] h-5">Başarılı</Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold">{order.price.toLocaleString('tr-TR')} ₺</span>
                                          {canRetry && (
                                            <Button 
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => retrySpecificOrder(order.referenceCode, e)}
                                              disabled={isOrderRetryingNow}
                                              className="h-6 text-[10px] px-2 border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                              {isOrderRetryingNow ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                "Dene"
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Son Denemeler */}
                                      {order.paymentAttempts && order.paymentAttempts.length > 0 && (
                                        <div className="space-y-1 mt-2 pt-2 border-t border-dashed">
                                          {order.paymentAttempts
                                            .sort((a, b) => b.createdDate - a.createdDate)
                                            .slice(0, 2)
                                            .map((attempt, i) => (
                                              <div 
                                                key={i} 
                                                className={`flex items-center justify-between text-[10px] px-2 py-1 rounded ${
                                                  attempt.paymentStatus === "FAILED" 
                                                    ? "bg-red-100 text-red-700" 
                                                    : "bg-emerald-100 text-emerald-700"
                                                }`}
                                              >
                                                <span className="flex items-center gap-1">
                                                  {attempt.paymentStatus === "FAILED" ? (
                                                    <XCircle className="h-3 w-3" />
                                                  ) : (
                                                    <CheckCircle className="h-3 w-3" />
                                                  )}
                                                  {attempt.paymentStatus === "FAILED" ? "Başarısız" : "Başarılı"}
                                                  {attempt.errorMessage && (
                                                    <span className="opacity-75">- {attempt.errorMessage.slice(0, 30)}</span>
                                                  )}
                                                </span>
                                                <span className="opacity-75">{formatDate(attempt.createdDate)}</span>
                                              </div>
                                            ))
                                          }
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              )}

              {/* Tüm ödemeler güncel */}
              {lastResult.summary.unpaidSubscriptions === 0 && (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-emerald-800">Tüm Ödemeler Güncel</h3>
                    <p className="text-emerald-700 text-sm mt-1">Ödenmemiş abonelik bulunmuyor 🎉</p>
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
