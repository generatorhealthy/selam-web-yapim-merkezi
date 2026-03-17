import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Safari agresif bağlantı cache'lemesi nedeniyle ağ değişikliğinde
 * (WiFi değiştirme vb.) Supabase realtime kanalları ve auth oturumu
 * "asılı" kalabiliyor. Bu hook, ağ tekrar çevrimiçi olduğunda
 * Supabase realtime bağlantılarını ve auth oturumunu yeniler.
 */
export const useNetworkRecovery = () => {
  const wasOfflineRef = useRef(false);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOffline = () => {
      wasOfflineRef.current = true;
    };

    const handleOnline = () => {
      // Kısa bir gecikme ile bağlantının stabilize olmasını bekle
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
      }

      recoveryTimerRef.current = setTimeout(async () => {
        try {
          // 1. Realtime kanallarını yeniden bağla
          supabase.realtime.disconnect();
          supabase.realtime.connect();

          // 2. Auth oturumunu yenile (stale token'ları temizle)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.refreshSession();
          }
        } catch (e) {
          // Sessizce başarısız ol - kullanıcı sayfayı yenileyebilir
          console.warn("[NetworkRecovery] Recovery failed:", e);
        }

        wasOfflineRef.current = false;
      }, 1500);
    };

    // Safari'de visibilitychange da ağ sorunlarını tetikleyebilir
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        // Sayfa tekrar görünür olduğunda hafif bir recovery yap
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            // Token süresi dolmuş olabilir
            const expiresAt = session.expires_at;
            if (expiresAt && expiresAt * 1000 < Date.now() + 60_000) {
              supabase.auth.refreshSession().catch(() => {});
            }
          }
        });
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
      }
    };
  }, []);
};
