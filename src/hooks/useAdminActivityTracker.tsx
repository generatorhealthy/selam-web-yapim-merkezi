import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const PAGE_TITLES: Record<string, string> = {
  "/divan_paneli/dashboard": "Ana Panel",
  "/divan_paneli/users": "Kullanıcı Yönetimi",
  "/divan_paneli/users/create": "Kullanıcı Oluştur",
  "/divan_paneli/specialists": "Uzman Yönetimi",
  "/divan_paneli/specialists/add": "Uzman Ekle",
  "/divan_paneli/orders": "Sipariş Yönetimi",
  "/divan_paneli/orders/new": "Yeni Sipariş",
  "/divan_paneli/customers": "Müşteri Yönetimi",
  "/divan_paneli/appointments": "Randevu Yönetimi",
  "/divan_paneli/blog": "Blog Yönetimi",
  "/divan_paneli/reviews": "Yorum Yönetimi",
  "/divan_paneli/client-referrals": "Danışan Yönlendirme",
  "/divan_paneli/client-calendar": "Danışan Takvimi",
  "/divan_paneli/contracts": "Sözleşmeler",
  "/divan_paneli/legal-proceedings": "Hukuki İşlemler",
  "/divan_paneli/legal-evidence": "Hukuki Kanıtlar",
  "/divan_paneli/call-reports": "Görüşme Raporları",
  "/divan_paneli/sms-management": "SMS Hizmeti",
  "/divan_paneli/pbx-management": "Santral Hizmeti",
  "/divan_paneli/log-management": "Log Kayıtları",
  "/divan_paneli/sitemap": "Sitemap Yönetimi",
  "/divan_paneli/image-converter": "WebP Dönüştürücü",
  "/divan_paneli/social-media": "Sosyal Medya",
  "/divan_paneli/accounting": "Muhasebe Birimi",
  "/divan_paneli/database-backup": "Veritabanı Yedekleme",
  "/divan_paneli/packages": "Paket Yönetimi",
  "/divan_paneli/tests": "Test Yönetimi",
  "/divan_paneli/support-tickets": "Destek Bölümü",
  "/divan_paneli/success-statistics": "Başarı İstatistikleri",
  "/divan_paneli/employee-salaries": "Çalışan Maaşları",
  "/divan_paneli/iyzico-payments": "İyzico Ödemeleri",
  "/divan_paneli/cancellation-fees": "Cayma Bedelleri",
  "/divan_paneli/specialist-applications": "Uzman Başvuruları",
  "/divan_paneli/staff-attendance": "Çalışma Saatleri",
  "/divan_paneli/pre-info-form": "Ön Bilgilendirme Formu",
  "/divan_paneli/admin-activity-logs": "Aktivite Logları",
};

export const useAdminActivityTracker = () => {
  const location = useLocation();
  const { userProfile } = useUserRole();
  const sessionStartRef = useRef<string | null>(null);
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    if (!['admin', 'staff', 'legal', 'muhasebe'].includes(userProfile.role)) return;
    if (!location.pathname.startsWith('/divan_paneli')) return;
    if (location.pathname === lastLoggedPath.current) return;

    lastLoggedPath.current = location.pathname;

    const logActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!sessionStartRef.current) {
        sessionStartRef.current = new Date().toISOString();
      }

      const pageTitle = PAGE_TITLES[location.pathname] || location.pathname.split('/').pop() || 'Bilinmeyen';

      await supabase.from('admin_activity_logs').insert({
        user_id: user.id,
        user_name: userProfile.name || user.email,
        user_email: userProfile.email || user.email,
        user_role: userProfile.role,
        action_type: 'page_view',
        page_url: location.pathname,
        page_title: pageTitle,
        session_start: sessionStartRef.current,
        user_agent: navigator.userAgent,
      });
    };

    logActivity();
  }, [location.pathname, userProfile]);

  // Log session end on unmount
  useEffect(() => {
    return () => {
      if (sessionStartRef.current && userProfile) {
        // Fire and forget
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('admin_activity_logs').insert({
              user_id: user.id,
              user_name: userProfile.name || user.email,
              user_email: userProfile.email || user.email,
              user_role: userProfile.role,
              action_type: 'session_end',
              page_url: location.pathname,
              page_title: 'Oturum Kapatma',
              session_start: sessionStartRef.current,
              session_end: new Date().toISOString(),
            });
          }
        });
      }
    };
  }, []);
};
