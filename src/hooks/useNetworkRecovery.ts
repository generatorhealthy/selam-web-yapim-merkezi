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

      recoveryTimerRef.current = setTimeout(() => {
        try {
          supabase.realtime.disconnect();
          supabase.realtime.connect();
        } catch (e) {
          // Sessizce başarısız ol - kullanıcı sayfayı yenileyebilir
          console.warn("[NetworkRecovery] Recovery failed:", e);
        }

        wasOfflineRef.current = false;
      }, 1500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
      }
    };
  }, []);
};
