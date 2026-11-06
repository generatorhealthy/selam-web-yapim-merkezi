import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Ziyaretçinin her sayfada gerçekten (sekme görünürken) kaldığı süreyi kaydeder.
// Kelime Sıralayıcısı kartındaki "kalma süresi" bu kayıtlardan hesaplanır.
const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seo_page_engagement`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const SEARCH_HOSTS = /(google|bing|yandex|duckduckgo|yahoo)\./i;

function sessionId() {
  let id = sessionStorage.getItem("seo_sid");
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("seo_sid", id); }
  return id;
}

export default function SeoEngagementTracker() {
  const { pathname } = useLocation();
  const state = useRef({ path: "", visibleMs: 0, since: 0, fromSearch: false, ref: null as string | null, sent: false });

  useEffect(() => {
    const flush = () => {
      const s = state.current;
      if (!s.path || s.sent) return;
      const total = s.visibleMs + (s.since ? Date.now() - s.since : 0);
      s.sent = true;
      if (total < 500) return;
      try {
        fetch(ENDPOINT, {
          method: "POST", keepalive: true,
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ path: s.path.slice(0, 300), duration_ms: Math.min(total, 3600000), from_search: s.fromSearch, referrer_host: s.ref, session_id: sessionId() }),
        }).catch(() => {});
      } catch { /* sessiz */ }
    };

    if (pathname.startsWith("/divan_paneli") || pathname.startsWith("/doktor-paneli")) return;
    const first = !state.current.path;
    let ref: string | null = null;
    try { ref = first && document.referrer ? new URL(document.referrer).hostname : null; } catch { ref = null; }
    state.current = {
      path: pathname, visibleMs: 0, since: document.visibilityState === "visible" ? Date.now() : 0,
      fromSearch: !!ref && SEARCH_HOSTS.test(ref), ref, sent: false,
    };
    const onVis = () => {
      const s = state.current;
      if (document.visibilityState === "hidden") {
        if (s.since) { s.visibleMs += Date.now() - s.since; s.since = 0; }
        flush();
      } else if (!s.sent) s.since = Date.now();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [pathname]);

  return null;
}
