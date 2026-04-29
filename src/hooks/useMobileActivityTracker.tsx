import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const PAGE_TITLES: Record<string, string> = {
  "/mobile/home": "Anasayfa",
  "/mobile/search": "Keşfet",
  "/mobile/appointments": "Randevular",
  "/mobile/profile": "Profil",
  "/mobile/login": "Giriş",
  "/mobile/signup": "Kayıt",
  "/mobile/dashboard": "Uzman Paneli",
  "/mobile/specialist-appointments": "Uzman Randevuları",
  "/mobile/specialist-clients": "Danışanlar",
  "/mobile/specialist-profile": "Uzman Profili",
  "/mobile/specialist-blog": "Uzman Blog",
  "/mobile/specialist-referrals": "Uzman Yönlendirmeleri",
  "/mobile/specialist-portfolio": "Portföy",
  "/mobile/specialist-subscription": "Abonelik",
  "/mobile/specialist-contracts": "Sözleşmeler",
  "/mobile/specialist-support": "Destek",
  "/mobile/specialist-new-appointment": "Yeni Randevu",
  "/mobile/patient-dashboard": "Danışan Paneli",
  "/mobile/patient-appointments": "Danışan Randevuları",
  "/mobile/patient-favorites": "Favoriler",
  "/mobile/patient-profile": "Danışan Profili",
  "/mobile/patient-tests": "Testlerim",
  "/mobile/booking": "Randevu Al",
  "/mobile/blog": "Blog",
  "/mobile/tests": "Testler",
};

const getSessionId = () => {
  let id = sessionStorage.getItem("mobile_activity_session");
  if (!id) {
    id = `mob_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("mobile_activity_session", id);
  }
  return id;
};

const getPageTitle = (pathname: string) => {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match dynamic routes
  if (pathname.startsWith("/mobile/specialist/")) return "Uzman Detayı";
  if (pathname.startsWith("/mobile/blog/")) return "Blog Yazısı";
  if (pathname.startsWith("/mobile/test/")) return "Test Sayfası";
  return pathname.split("/").pop() || "Bilinmeyen";
};

export const useMobileActivityTracker = () => {
  const location = useLocation();
  const { userProfile } = useUserRole();
  const sessionStartRef = useRef<string | null>(null);
  const lastLoggedPath = useRef<string | null>(null);
  const sessionId = useRef<string>(getSessionId());
  const currentPathRef = useRef(location.pathname);

  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  // Log page views
  useEffect(() => {
    if (!location.pathname.startsWith("/mobile")) return;
    if (location.pathname === lastLoggedPath.current) return;
    lastLoggedPath.current = location.pathname;

    const log = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return; // Only track authenticated users

        if (!sessionStartRef.current) {
          sessionStartRef.current = new Date().toISOString();
        }

        const platform = Capacitor.getPlatform();
        const isNative = Capacitor.isNativePlatform();

        await supabase.from("mobile_activity_logs").insert({
          user_id: user.id,
          user_name: userProfile?.name || user.email,
          user_email: userProfile?.email || user.email,
          user_role: userProfile?.role || "guest",
          action_type: "page_view",
          page_url: location.pathname,
          page_title: getPageTitle(location.pathname),
          platform,
          is_native: isNative,
          user_agent: navigator.userAgent,
          session_id: sessionId.current,
          session_start: sessionStartRef.current,
        });
      } catch {
        // silent
      }
    };

    void log();
  }, [location.pathname, userProfile]);

  // Log session end on unmount
  useEffect(() => {
    return () => {
      if (!sessionStartRef.current) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        const user = session?.user;
        if (!user) return;
        supabase.from("mobile_activity_logs").insert({
          user_id: user.id,
          user_name: userProfile?.name || user.email,
          user_email: userProfile?.email || user.email,
          user_role: userProfile?.role || "guest",
          action_type: "session_end",
          page_url: currentPathRef.current,
          page_title: "Oturum Kapatma",
          platform: Capacitor.getPlatform(),
          is_native: Capacitor.isNativePlatform(),
          session_id: sessionId.current,
          session_start: sessionStartRef.current,
          session_end: new Date().toISOString(),
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
