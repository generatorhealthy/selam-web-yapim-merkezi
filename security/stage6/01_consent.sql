-- TASLAK — BU DOSYAYI TOPLU ÇALIŞTIRMAYIN. 12.11.2026 kontrollü geçişte yalnız
-- okuma daraltması ve UPDATE/DELETE yetki kaldırma ayrı migration ile uygulandı.
-- INSERT kapatma mobil gerçek oturumlu sunucu geçişi doğrulanana kadar BEKLER.
-- Test/randevu sütunları bu adımın kapsamında değildir, uygulanmadı.
-- Eski kayıtlar silinmez/değiştirilmez.
-- 1) İstemciden doğrudan yazma kapanır; kayıt yalnız record-consent işlevi (service_role) ile yazılır.
DROP POLICY IF EXISTS "Anyone can insert consent logs" ON public.user_consent_logs;
REVOKE INSERT ON public.user_consent_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.user_consent_logs TO service_role;
-- 2) Sahte e-postayla başkasının kaydını görme kapanır (yalnız user_id).
DROP POLICY IF EXISTS "Users can view their own consent logs" ON public.user_consent_logs;
CREATE POLICY "Users can view their own consent logs" ON public.user_consent_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- 3) Ek alanlar: işlem kimliği, amaç, geri çekme (yeni satır olarak; eski satır değişmez)
ALTER TABLE public.user_consent_logs
  ADD COLUMN IF NOT EXISTS transaction_id uuid,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS action text NOT NULL DEFAULT 'grant'; -- 'grant' | 'withdraw' | 'disclosure_shown'
-- 4) Test sonucu / randevu ile bağ (yalnız yeni kayıtlarda dolar)
ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS consent_log_id uuid;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS consent_log_id uuid;
