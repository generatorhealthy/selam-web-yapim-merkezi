import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Phone, Mail, Home } from 'lucide-react';

const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any stored order data
    localStorage.removeItem('currentOrder');
  }, []);

  const getErrorMessage = () => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (error) {
      return `Hata: ${error}`;
    }

    switch (status) {
      case 'CANCELED':
        return 'Ödeme işlemi iptal edildi.';
      case 'INACTIVE':
        return 'Abonelik aktifleştirilemedi.';
      case 'FAILED':
        return 'Ödeme işlemi başarısız oldu.';
      default:
        return 'Ödeme işlemi sırasında bir hata oluştu.';
    }
  };

  const retryPayment = () => {
    // Clear any error state and redirect to packages
    navigate('/paketler');
  };

  return (
    <>
      <Helmet>
        <title>Ödeme Hatası - Doktorum Ol</title>
        <meta name="description" content="Ödeme işleminiz tamamlanamadı. Lütfen tekrar deneyin." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <Card className="text-center shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Ödeme Tamamlanamadı
              </CardTitle>
              <CardDescription className="text-xl text-gray-600">
                {getErrorMessage()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Ne Oldu?</h3>
                <ul className="text-yellow-800 text-sm space-y-2 text-left">
                  <li>• Ödeme işlemi tamamlanmadı</li>
                  <li>• Kartınızdan herhangi bir ücret çekilmedi</li>
                  <li>• Abonelik başlatılmadı</li>
                  <li>• Tekrar deneyebilirsiniz</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">💡 Önerilerimiz</h3>
                <ul className="text-blue-800 text-sm space-y-2 text-left">
                  <li>• Kart bilgilerinizi kontrol edin</li>
                  <li>• Kartınızda yeterli bakiye olduğundan emin olun</li>
                  <li>• İnternet bağlantınızı kontrol edin</li>
                  <li>• Farklı bir kart ile deneyebilirsiniz</li>
                  <li>• Sorun devam ederse müşteri hizmetlerimizle iletişime geçin</li>
                </ul>
              </div>

              <div className="pt-6 space-y-4">
                <Button 
                  onClick={retryPayment} 
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Tekrar Dene
                </Button>
                
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Ana Sayfaya Dön
                </Button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = 'tel:02167060611'}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    0216 706 06 11
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = 'mailto:info@doktorumol.com.tr'}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Destek İletişim
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  <strong>Güvenlik:</strong> Tüm ödeme işlemleri SSL sertifikası ile korunmakta ve
                  İyzico güvenli ödeme altyapısı kullanılmaktadır. Kart bilgileriniz hiçbir şekilde
                  saklanmaz.
                </p>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                Sorunlarınız için 7/24 destek hizmeti sunuyoruz 💪
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PaymentError;