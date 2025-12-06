import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Check, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface OrderData {
  id: string;
  orderNumber: string;
  package: string;
  amount: number;
  paymentMethod: string;
  customerName: string;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankInfo = {
    accountName: "DOKTORUM OL BİLGİ VE TEKNOLOJİ HİZMETLERİ",
    iban: "TR95 0004 6007 2188 8000 3848 15"
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast({
        title: "Kopyalandı",
        description: `${field} panoya kopyalandı.`
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  useEffect(() => {
    // First check URL parameters for order data (from Iyzico callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrderData = urlParams.get('orderData');
    
    if (urlOrderData) {
      try {
        const orderInfo = JSON.parse(decodeURIComponent(urlOrderData));
        setOrderData(orderInfo);
        setLoading(false);
        
        // Store in localStorage for consistency
        localStorage.setItem('lastOrder', JSON.stringify(orderInfo));
        
        // Clean URL by removing the parameter
        window.history.replaceState({}, document.title, '/odeme-basarili');
        return;
      } catch (error) {
        console.error('Error parsing URL order data:', error);
      }
    }
    
    // Fallback to localStorage if no URL data
    const lastOrderData = localStorage.getItem('lastOrder');
    if (lastOrderData) {
      try {
        const orderInfo = JSON.parse(lastOrderData);
        setOrderData(orderInfo);
        // Clear the data after reading it
        localStorage.removeItem('lastOrder');
        setLoading(false);
      } catch (error) {
        console.error('Error parsing order data:', error);
        // If data is corrupted, redirect to home
        setTimeout(() => navigate('/'), 2000);
      }
    } else {
      // If no order data found, redirect to home page after 3 seconds
      console.log('No order data found, redirecting to home');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [navigate]);

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Kredi Kartı';
      case 'bank_transfer':
        return 'Banka Havalesi/EFT';
      default:
        return method;
    }
  };

  // Show loading while checking for order data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Ödeme Başarılı - Doktorum Ol</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <HorizontalNavigation />
        <div className="py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="text-center">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600 mb-2">
                  Ödeme Başarılı!
                </CardTitle>
                <p className="text-gray-600">
                  Paketiniz başarıyla aktifleştirildi. Hoş geldiniz!
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 text-center">
                    Sipariş Detayları
                  </h3>
                  <div className="text-sm text-gray-600 space-y-3">
                    <div className="flex justify-between py-2">
                      <span>Sipariş No:</span>
                      <span className="font-medium text-gray-900">
                        {orderData?.orderNumber || `DRP-${Date.now().toString().slice(-12)}`}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Paket:</span>
                      <span className="font-medium text-gray-900">
                        {orderData?.package || 'Premium Paket'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Toplam:</span>
                      <span className="font-medium text-gray-900">
                        {orderData?.amount ? 
                          `${orderData.amount.toLocaleString('tr-TR')} ₺` : 
                          '2.998 ₺'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Ödeme Yöntemi:</span>
                      <span className="font-medium text-gray-900">
                        {orderData?.paymentMethod ? 
                          getPaymentMethodText(orderData.paymentMethod) : 
                          'Banka Havalesi/EFT'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Durum:</span>
                      <span className="font-medium text-green-600">Aktif</span>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer Info - Only show for bank_transfer payment method */}
                {orderData?.paymentMethod === 'bank_transfer' && (
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Banknote className="w-5 h-5 text-green-700" />
                      <h3 className="font-semibold text-green-900">Havale/EFT Bilgileri</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Account Name */}
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Hesap Adı</span>
                            <span className="font-medium text-gray-900 text-sm">{bankInfo.accountName}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(bankInfo.accountName, "Hesap adı")}
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-100"
                          >
                            {copiedField === "Hesap adı" ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* IBAN */}
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">IBAN</span>
                            <span className="font-mono font-medium text-gray-900 text-sm">{bankInfo.iban}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(bankInfo.iban.replace(/\s/g, ''), "IBAN")}
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-100"
                          >
                            {copiedField === "IBAN" ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Gönderilecek Tutar</span>
                            <span className="font-semibold text-green-700 text-lg">
                              {orderData?.amount ? `${orderData.amount.toLocaleString('tr-TR')} ₺` : '3.600 ₺'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(orderData?.amount?.toString() || '3600', "Tutar")}
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-100"
                          >
                            {copiedField === "Tutar" ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-orange-800">
                        <strong>Önemli:</strong> Ödeme yaparken açıklama kısmına <strong>Ad Soyadınızı</strong> yazınız. 
                        Dekontunuzu WhatsApp hattımızdan iletebilirsiniz.
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Sorularınız için{" "}
                    <a href="https://wa.me/905308232275" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      bizimle iletişime geçebilirsiniz
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PaymentSuccess;