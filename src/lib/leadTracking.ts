import { supabase } from "@/integrations/supabase/client";

const FIRST_KEY = "dko_first_touch";
const LAST_KEY = "dko_last_touch";
const SESSION_KEY = "dko_lead_session";
const PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_content", "utm_term",
  "fbclid", "meta_campaign_id", "meta_adset_id", "meta_ad_id",
];

const getCookie = (name: string) => {
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : undefined;
};

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export const getLeadSessionId = () => {
  let id = safeGet(SESSION_KEY);
  if (!id) {
    id = `ls_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    safeSet(SESSION_KEY, id);
  }
  return id;
};

/** Reklam parametrelerini yakalar: ilk temas asla ezilmez, son temas her reklamlı girişte güncellenir. */
export const captureAttribution = () => {
  try {
    const qs = new URLSearchParams(window.location.search);
    const touch: Record<string, string> = {};
    PARAMS.forEach((p) => { const v = qs.get(p); if (v) touch[p] = v.slice(0, 200); });
    const hasAd = Object.keys(touch).length > 0;
    const fbc = getCookie("_fbc") || (touch.fbclid ? `fb.1.${Date.now()}.${touch.fbclid}` : undefined);
    const fbp = getCookie("_fbp");
    const full = {
      ...touch,
      ...(fbc ? { fbc } : {}),
      ...(fbp ? { fbp } : {}),
      landing_page: window.location.pathname,
      referrer: document.referrer ? document.referrer.slice(0, 300) : "",
      at: new Date().toISOString(),
    };
    if (!safeGet(FIRST_KEY)) safeSet(FIRST_KEY, JSON.stringify(full));
    if (hasAd || !safeGet(LAST_KEY)) safeSet(LAST_KEY, JSON.stringify(full));
  } catch { /* ignore */ }
};

const readTouch = () => {
  const parse = (k: string) => { try { return JSON.parse(safeGet(k) || "{}"); } catch { return {}; } };
  return { first: parse(FIRST_KEY), last: parse(LAST_KEY) };
};

/** Merkezi olay kaydı. Hata olursa sessiz kalır, kullanıcı akışını asla bozmaz. */
export const trackLeadEvent = (eventName: string, properties: Record<string, unknown> = {}, eventId?: string) => {
  try {
    void supabase.rpc("track_lead_event" as any, {
      p_session_id: getLeadSessionId(),
      p_event_name: eventName,
      p_event_id: eventId ?? (crypto.randomUUID?.() ?? `${Date.now()}`),
      p_properties: properties,
      p_touch: readTouch(),
    }).then(() => undefined, () => undefined);
  } catch { /* ignore */ }
};

/** Kayıt formu sürümü: değişiklik öncesi/sonrası cohort ayrımı için olaylara eklenir. */
export const REGISTRATION_FORM_VERSION = "v2_2026-10-07";

/**
 * Aynı oturumda aynı anahtarla yalnız bir kez olay üretir (ör. 10 kez odaklanma → 1 olay).
 * Yalnız Doktorum Ol'un kendi analitiğine yazar; Meta'ya hiçbir şey göndermez.
 * properties içine kullanıcının yazdığı değer (e-posta, telefon, ad) KONULMAZ.
 */
export const trackLeadEventOnce = (eventName: string, dedupeKey: string, properties: Record<string, unknown> = {}) => {
  const k = `dko_once_${getLeadSessionId()}_${dedupeKey}`;
  try {
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch { /* sessionStorage yoksa yine de bir kez göndermeye çalış */ }
  trackLeadEvent(eventName, { form_version: REGISTRATION_FORM_VERSION, ...properties });
};
