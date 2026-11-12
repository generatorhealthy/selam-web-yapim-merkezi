import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Capacitor } from "@capacitor/core";
import { readChoice, saveChoices, type Purpose } from "@/lib/consent";

const PURPOSES: Purpose[] = ["analytics", "advertising"];

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const gpc = typeof navigator !== "undefined" && (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

  // Bandın yüksekliğini yayınla: sayfalar (ör. kayıt CTA'sı) bandın üstünde kalabilsin.
  useEffect(() => {
    const root = document.documentElement;
    if (!showBanner || !boxRef.current) { root.style.removeProperty("--cookie-banner-h"); return; }
    const el = boxRef.current;
    const set = () => root.style.setProperty("--cookie-banner-h", `${Math.ceil(el.getBoundingClientRect().height) + 8}px`);
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); root.style.removeProperty("--cookie-banner-h"); };
  }, [showBanner, showSettings]);

  const syncSwitches = useCallback(() => {
    setAnalytics(readChoice("analytics") === "granted");
    setAdvertising(readChoice("advertising") === "granted");
  }, []);

  useEffect(() => {
    // Apple App Store guideline 5.1.2(i): native uygulamada çerez/tracking bildirimi gösterme
    if (Capacitor.isNativePlatform()) return;

    // KVKK: izin gerektiren ölçüm onaydan önce başlamaz; cevabı olmayan herkese bant gösterilir.
    const unanswered = PURPOSES.some((purpose) => readChoice(purpose) === null);
    if (!unanswered) return;

    const show = () => setShowBanner(true);
    if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(show, { timeout: 2000 });
    } else {
      const t = setTimeout(show, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  // Footer'daki "Çerez Tercihleri" bağlantısı bandı yeniden açar (geri çekme yolu).
  useEffect(() => {
    const open = () => {
      syncSwitches();
      setShowSettings(true);
      setShowBanner(true);
    };
    window.addEventListener("open-cookie-settings", open);
    return () => window.removeEventListener("open-cookie-settings", open);
  }, [syncSwitches]);

  const close = () => { setShowBanner(false); setShowSettings(false); };

  const handleAcceptAll = () => {
    saveChoices({ analytics: "granted", advertising: "granted" });
    close();
  };

  const handleRejectAll = () => {
    saveChoices({ analytics: "denied", advertising: "denied" });
    close();
  };

  const handleSaveSettings = () => {
    saveChoices({ analytics: analytics ? "granted" : "denied", advertising: advertising ? "granted" : "denied" });
    close();
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none"
      style={{ contain: "layout paint" }}
    >
      <div
        ref={boxRef}
        className="pointer-events-auto mx-auto mb-2 w-[min(96vw,720px)] rounded-xl border border-border bg-card shadow-lg px-3 py-2 md:px-5 md:py-4"
        role="region"
        aria-label="Çerez tercihleri"
        aria-describedby="cookie-consent-description"
        data-cookie-consent
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="flex flex-col gap-2 md:gap-3 md:flex-row md:items-center md:justify-between">
            <p
              id="cookie-consent-description"
              className="text-xs md:text-sm text-muted-foreground leading-snug"
            >
              Zorunlu işlemler dışında, ziyaret ölçümü ve reklam ölçümü yalnızca izninizle çalışır.{" "}
              <Link to="/aydinlatma-metni" className="text-primary underline-offset-2 hover:underline font-medium">
                Aydınlatma Metni
              </Link>
            </p>

            <div className="flex items-stretch gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { syncSwitches(); setShowSettings((v) => !v); }}
                className="text-xs font-medium border-primary text-primary hover:bg-primary/5 flex-1 md:flex-none"
              >
                Tercihleri Yönet
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRejectAll}
                className="text-xs font-medium flex-1 md:flex-none"
              >
                Reddet
              </Button>
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="text-xs font-semibold flex-1 md:flex-none"
              >
                Tümünü Kabul Et
              </Button>
            </div>
          </div>

          {showSettings && (
            <div className="border-t border-border pt-3 flex flex-col gap-3" data-cookie-settings>
              {gpc && (
                <p className="text-xs text-muted-foreground">
                  Tarayıcınızın gizlilik sinyali (Global Privacy Control) uygulanıyor; izne bağlı ölçümler kapalı tutulur.
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Zorunlu</p>
                  <p className="text-xs text-muted-foreground">Oturum ve güvenlik için gereklidir, kapatılamaz.</p>
                </div>
                <Switch checked disabled aria-label="Zorunlu çerezler her zaman açık" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Ziyaret ölçümü</p>
                  <p className="text-xs text-muted-foreground">Sayfa görüntüleme ve kullanım istatistikleri (Google Analytics).</p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  disabled={gpc}
                  aria-label="Ziyaret ölçümü izni"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Reklam ölçümü</p>
                  <p className="text-xs text-muted-foreground">Reklam dönüşüm ve kampanya ölçümü (Google Ads, Meta).</p>
                </div>
                <Switch
                  checked={advertising}
                  onCheckedChange={setAdvertising}
                  disabled={gpc}
                  aria-label="Reklam ölçümü izni"
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveSettings} className="text-xs font-semibold">
                  Tercihlerimi Kaydet
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
