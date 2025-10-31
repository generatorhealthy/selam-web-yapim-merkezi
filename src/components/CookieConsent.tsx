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
      className="fixed bottom-20 right-2 left-2 md:bottom-4 md:right-4 md:left-auto z-[60] w-auto md:w-[min(92vw,420px)] rounded-lg border border-border bg-card shadow-lg p-3 md:p-4 animate-fade-in"
      role="dialog"
      aria-live="polite"
      aria-label="Çerez bildirimi"
      data-cookie-consent
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-1">
            Bu site çerez kullanır.{" "}
            <Link
              to="/gizlilik-politikasi"
              className="text-primary underline hover:opacity-90"
            >
              Detaylı bilgi
            </Link>
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReject}
            className="h-6 w-6 md:h-8 md:w-8 shrink-0"
          >
            <X className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="text-xs md:text-sm flex-1"
          >
            Reddet
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
            className="text-xs md:text-sm flex-1"
          >
            Kabul Et
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;