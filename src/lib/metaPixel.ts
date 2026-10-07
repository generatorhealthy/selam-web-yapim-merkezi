/**
 * Meta Pixel (tarayıcı). Yalnız Pixel ID içerir — erişim anahtarı asla burada olmaz.
 * Yalnız production alan adında ve çerez onayı "accepted" iken yüklenir.
 * event_id'ler sunucu CAPI ile aynı deterministik formülü kullanır (dedup).
 */
export const META_PIXEL_ID = "1053321257408384";
const PROD_HOSTS = ["doktorumol.com.tr", "www.doktorumol.com.tr", "doctorumol.com.tr", "www.doctorumol.com.tr"];

type Fbq = ((...args: unknown[]) => void) & { callMethod?: any; queue?: unknown[]; loaded?: boolean; version?: string; push?: any };
declare global { interface Window { fbq?: Fbq; _fbq?: Fbq } }

let initialized = false;
let lastPath: string | null = null;

const isProd = () => {
  try { return PROD_HOSTS.includes(window.location.hostname); } catch { return false; }
};
const isTestVisit = () => {
  try {
    const qs = new URLSearchParams(window.location.search);
    if ((qs.get("utm_campaign") || "").toUpperCase().startsWith("TEST_") || qs.get("meta_ad_id") === "333333") return true;
    const lt = localStorage.getItem("dko_last_touch") || "";
    return /"utm_campaign":"TEST_/i.test(lt) || lt.includes('"meta_ad_id":"333333"');
  } catch { return false; }
};
export const hasMarketingConsent = () => {
  try { return localStorage.getItem("cookie-consent") === "accepted"; } catch { return false; }
};
const canTrack = () => isProd() && hasMarketingConsent() && !isTestVisit();

/** Onay ve ortam uygunsa Meta resmi fbevents.js'i yükler. Birden çok çağrı güvenlidir. */
export const initMetaPixel = (): boolean => {
  if (initialized) return true;
  if (!canTrack()) return false;
  if (!window.fbq) {
    const n: Fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod(...args) : n.queue!.push(args);
    } as Fbq;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    window.fbq = n; if (!window._fbq) window._fbq = n;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  window.fbq!("init", META_PIXEL_ID);
  initialized = true;
  return true;
};

/** SPA rota değişiminde PageView; aynı rota için tekrar göndermez. */
export const trackPixelPageView = (path: string) => {
  if (!initMetaPixel()) return;
  if (lastPath === path) return;
  lastPath = path;
  window.fbq!("track", "PageView");
};

/** Funnel olayı; eventID sunucu CAPI event_id'si ile aynı olmalı. Purchase bilinçli olarak engellidir. */
export const trackPixelEvent = (eventName: "Lead" | "CompleteRegistration" | "InitiateCheckout", eventId: string, params: Record<string, unknown> = {}) => {
  if (!eventId || !initMetaPixel()) return;
  window.fbq!("track", eventName, params, { eventID: eventId });
};

/** Sunucuyla aynı formül: meta-capi-event → `${event_name.toLowerCase()}_${external_id}`. */
export const capiEventIdForUser = (eventName: string, userId: string) => `${eventName.toLowerCase()}_${userId}`;
/** Sunucuyla aynı formül: meta-ad-intelligence kuyruğu → `checkout_${anonymous_session_id}`. */
export const capiCheckoutEventId = (sessionId: string) => `checkout_${sessionId}`;
