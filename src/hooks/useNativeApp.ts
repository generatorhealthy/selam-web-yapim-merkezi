import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { initPushNotifications } from "@/services/pushNotificationService";

/**
 * Native uygulama başlangıç yaşam döngüsü:
 * - Status bar stilini ayarla
 * - Splash screen'i gizle
 * - Push notification izinlerini iste ve token kaydet
 * - Donanım geri tuşunu yönet
 */
export const useNativeApp = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await SplashScreen.hide();
      } catch (e) {
        console.warn("[Native] init UI failed", e);
      }

      // Push notifications - register with current user (if any)
      const { data: { session } } = await supabase.auth.getSession();
      await initPushNotifications(session?.user?.id);

      // Re-init on auth changes
      supabase.auth.onAuthStateChange((_event, sess) => {
        if (sess?.user?.id) {
          initPushNotifications(sess.user.id);
        }
      });
    })();

    // Android back button → web history
    const backSub = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    return () => {
      backSub.then((s) => s.remove());
    };
  }, []);
};
