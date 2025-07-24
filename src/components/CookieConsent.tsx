import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Çerez onayı verip verilmediğini kontrol et
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              Bu web sitesi, size en iyi kullanıcı deneyimini sunabilmek için çerezler kullanmaktadır. 
              Siteyi kullanmaya devam ederek çerez kullanımını kabul etmiş olursunuz. 
              Detaylı bilgi için{" "}
              <Link 
                to="/gizlilik-politikasi" 
                className="text-primary underline hover:text-primary/80"
              >
                Gizlilik Politikası
              </Link>
              {" "}sayfamızı inceleyebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="text-sm"
            >
              Reddet
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="text-sm"
            >
              Kabul Et
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;