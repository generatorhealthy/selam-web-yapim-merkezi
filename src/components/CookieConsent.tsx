import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Apple App Store guideline 5.1.2(i): native uygulamada çerez/tracking bildirimi gösterme
    if (Capacitor.isNativePlatform()) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) return;

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
    <>
      {/* Hafif arka plan overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[59] animate-fade-in"
        aria-hidden="true"
      />

      <div
        className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] w-[min(94vw,560px)] rounded-2xl border border-border bg-card shadow-2xl p-6 md:p-7 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        data-cookie-consent
      >
        <div className="flex flex-col gap-4">
          <h2
            id="cookie-consent-title"
            className="text-lg md:text-xl font-bold text-foreground tracking-tight"
          >
            Gizliliğinize değer veriyoruz
          </h2>

          <p
            id="cookie-consent-description"
            className="text-sm text-muted-foreground leading-relaxed"
          >
            Tarama deneyiminizi geliştirmek, kişiselleştirilmiş içerikler sunmak ve
            trafiğimizi analiz etmek için çerezleri kullanıyoruz. "Tümünü Kabul Et"e
            tıklayarak çerez kullanımımıza izin vermiş olursunuz.{" "}
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

          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
            <Button
              variant="outline"
              size="default"
              asChild
              className="text-sm font-medium border-primary text-primary hover:bg-primary/5 sm:flex-1"
            >
              <Link to="/gizlilik-politikasi">Kişiselleştir</Link>
            </Button>
            <Button
              variant="secondary"
              size="default"
              onClick={handleReject}
              className="text-sm font-medium sm:flex-1"
            >
              Reddet
            </Button>
            <Button
              onClick={handleAccept}
              size="default"
              className="text-sm font-semibold sm:flex-[1.4] shadow-md"
            >
              Tüm çerezleri kabul et
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
