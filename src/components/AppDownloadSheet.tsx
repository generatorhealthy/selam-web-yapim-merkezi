import { useState, useEffect } from "react";
import { X, Search, Calendar, Bell } from "lucide-react";

const APP_LOGO_URL = "/app-icon.png";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.lovable.doktorumol";
const APP_STORE_URL = "https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr";
const DISMISS_KEY = "app_download_sheet_dismissed";

type Device = "ios" | "android" | "other";

const detectDevice = (): Device => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || (navigator as any).vendor || "";
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  return "other";
};

const AppDownloadSheet = () => {
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<Device>("other");

  useEffect(() => {
    const d = detectDevice();
    setDevice(d);
    // Only show on mobile devices that aren't already in the native app
    const isMobile = d === "ios" || d === "android";
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "true";
    if (isMobile && !dismissed) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem(DISMISS_KEY, "true");
  };

  const storeUrl = device === "android" ? PLAY_STORE_URL : APP_STORE_URL;
  const isAndroid = device === "android";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="relative w-full bg-gradient-to-b from-primary to-blue-700 rounded-t-3xl px-5 pt-3 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/40" />

        {/* Close */}
        <button
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white active:scale-90 transition-transform"
        >
          <X className="h-5 w-5" />
        </button>

        {/* App info */}
        <div className="flex items-center gap-4">
          <img
            src={APP_LOGO_URL}
            alt="Doktorum Ol uygulama logosu"
            className="h-14 w-14 rounded-2xl shadow-lg"
          />
          <div>
            <h3 className="text-xl font-bold text-white">Doktorum Ol</h3>
            <p className="text-sm text-white/80">Ücretsiz — iOS &amp; Android</p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
            <Search className="h-3.5 w-3.5" /> Uzmanını bul
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
            <Calendar className="h-3.5 w-3.5" /> Randevunu al
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
            <Bell className="h-3.5 w-3.5" /> Hatırlatmaları gör
          </span>
        </div>

        {/* Store button */}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClose}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-5 py-4 text-white shadow-lg active:scale-[0.98] transition-transform"
          aria-label={isAndroid ? "Google Play'den indir" : "App Store'dan indir"}
        >
          {isAndroid ? (
            <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
              <path fill="#EA4335" d="M3.6 1.7C3.2 2.1 3 2.7 3 3.5v17c0 .8.2 1.4.6 1.8l.1.1L13.3 12.7v-.2L3.7 1.7z" />
              <path fill="#FBBC04" d="M16.5 16l-3.2-3.3v-.2L16.5 9.2l.1.1 3.8 2.2c1.1.6 1.1 1.6 0 2.2L16.6 16z" />
              <path fill="#4285F4" d="M16.6 15.9L13.3 12.5 3.6 22.3c.4.4 1 .4 1.7.1l11.3-6.5" />
              <path fill="#34A853" d="M16.6 9.1L5.3 2.6c-.7-.4-1.3-.3-1.7.1l9.7 9.8 3.3-3.4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          )}
          <span className="text-left leading-tight">
            <span className="block text-[10px] opacity-80">İndir</span>
            <span className="block text-lg font-semibold">
              {isAndroid ? "Google Play" : "App Store"}
            </span>
          </span>
        </a>
      </div>
    </div>
  );
};

export default AppDownloadSheet;
