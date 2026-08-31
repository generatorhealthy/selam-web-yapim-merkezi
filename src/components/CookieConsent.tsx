import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Apple App Store guideline 5.1.2(i): native uygulamada çerez/tracking bildirimi gösterme
    if (Capacitor.isNativePlatform()) return;

    const consent = localStorage.getItem('cookie-consent');
    if (consent) return;

    const show = () => setShowBanner(true);
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
      className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none"
      style={{ contain: "layout paint" }}
    >
      <div
        className="pointer-events-auto mx-auto mb-2 w-[min(96vw,720px)] rounded-xl border border-border bg-card shadow-lg px-4 py-3 md:px-5 md:py-4"
        role="region"
        aria-label="Çerez tercihleri"
        aria-describedby="cookie-consent-description"
        data-cookie-consent
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p
            id="cookie-consent-description"
            className="text-xs md:text-sm text-muted-foreground leading-snug"
          >
            Deneyiminizi iyileştirmek ve trafiği analiz etmek için çerezler kullanıyoruz.{" "}
            <Link
              to="/privacy"
              className="text-primary underline-offset-2 hover:underline font-medium"
            >
              Gizlilik Politikası
            </Link>
            {" • "}
            <Link
              to="/disclosure-text"
              className="text-primary underline-offset-2 hover:underline font-medium"
            >
              Aydınlatma Metni
            </Link>
          </p>

          <div className="flex items-stretch gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-medium border-primary text-primary hover:bg-primary/5 flex-1 md:flex-none"
            >
              <Link to="/gizlilik-politikasi">Kişiselleştir</Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReject}
              className="text-xs font-medium flex-1 md:flex-none"
            >
              Reddet
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="text-xs font-semibold flex-1 md:flex-none"
            >
              Tüm çerezleri kabul et
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

};

export default CookieConsent;
