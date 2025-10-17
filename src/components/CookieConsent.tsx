import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Çerez onayı verip verilmediğini kontrol et ve gösterimi LCP sonrası ertele
    const consent = localStorage.getItem('cookie-consent');
    if (consent) return;

    const show = () => setShowBanner(true);
    // LCP'yi etkilememesi için idle anında veya kısa gecikme ile göster
    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(show, { timeout: 2000 });
    } else {
      const t = setTimeout(show, 1500);
      return () => clearTimeout(t);
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
    <div
      className="fixed bottom-4 right-4 z-50 w-[min(92vw,480px)] rounded-lg border border-border bg-card shadow-lg p-4 animate-fade-in"
      role="dialog"
      aria-live="polite"
      aria-label="Çerez bildirimi"
      data-cookie-consent
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bu web sitesi, size en iyi kullanıcı deneyimini sunabilmek için çerezler kullanmaktadır. Siteyi kullanmaya devam ederek çerez kullanımını kabul etmiş olursunuz. Detaylı bilgi için{" "}
            <Link
              to="/gizlilik-politikasi"
              className="text-primary underline hover:opacity-90"
            >
              Gizlilik Politikası
            </Link>{" "}
            sayfamızı inceleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            size="icon"
            onClick={handleReject}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;