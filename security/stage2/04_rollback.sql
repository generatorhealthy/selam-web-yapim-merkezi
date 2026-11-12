-- Aşama 2 / GERİ ALMA
-- 01, 02 ve 03'ün tamamını tek seferde eski duruma döndürür.
-- Veri kaybı: consent_grants ve legal_documents tabloları silinir (Aşama 2 öncesi
-- bu iki tabloda kayıt yoktu; legal_documents metinleri kod tabanından yeniden yazılabilir).
-- Randevu, sipariş, test, onay ve yedek verilerinde hiçbir silme/güncelleme yapmaz.

-- ---- tetikleyiciler (fonksiyonlara bağımlı, önce bunlar) ----
DROP TRIGGER IF EXISTS appointments_patient_cancel_only ON public.appointments;
DROP TRIGGER IF EXISTS legal_documents_immutable ON public.legal_documents;
DROP TRIGGER IF EXISTS consent_grants_protect ON public.consent_grants;

-- ---- 03'ün politikaları: eski halleriyle yeniden kurulur ----
DROP POLICY IF EXISTS "Admin and staff can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Orders admin update policy" ON public.orders;
CREATE POLICY "Orders admin update policy" ON public.orders
FOR UPDATE TO authenticated
USING (public.is_admin_user() OR public.is_admin_or_staff_user());

CREATE POLICY "Anyone can insert consent logs" ON public.user_consent_logs
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- ---- 02'nin politikaları: eski halleriyle yeniden kurulur ----
DROP POLICY IF EXISTS "Guests can book appointments" ON public.appointments;
DROP POLICY IF EXISTS "Specialists can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients cancel own appointments" ON public.appointments;

CREATE POLICY "Anyone can create appointments" ON public.appointments
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Patients cancel own appointments" ON public.appointments
FOR UPDATE TO authenticated
USING (patient_user_id = (SELECT auth.uid()));

CREATE POLICY "Specialists can update their appointments" ON public.appointments
FOR UPDATE
USING (
  specialist_id IN (SELECT s.id FROM public.specialists s WHERE s.user_id = (SELECT auth.uid()))
  OR (SELECT public.is_admin_user())
);

CREATE POLICY "Specialists and staff can view appointments" ON public.appointments
FOR SELECT
USING (
  specialist_id IN (SELECT s.id FROM public.specialists s WHERE s.user_id = (SELECT auth.uid()))
  OR (SELECT public.is_admin_user())
  OR (SELECT public.is_admin_or_staff_user())
);

CREATE POLICY "Specialists can delete their appointments" ON public.appointments
FOR DELETE
USING (
  specialist_id IN (SELECT s.id FROM public.specialists s WHERE s.user_id = (SELECT auth.uid()))
  OR (SELECT public.is_admin_user())
);

CREATE POLICY "Patients view own appointments" ON public.appointments
FOR SELECT TO authenticated
USING (
  patient_user_id = (SELECT auth.uid())
  OR patient_email = (
    SELECT p.email FROM public.patient_profiles p
    WHERE p.user_id = (SELECT auth.uid())
    LIMIT 1
  )
);

DROP POLICY IF EXISTS "Visitors can submit test results" ON public.test_results;
CREATE POLICY "Anyone can insert test results" ON public.test_results
FOR INSERT
WITH CHECK (true);

-- ---- yeni fonksiyon ve tablolar ----
DROP FUNCTION IF EXISTS public.consume_consent_grant(text, text, uuid);
DROP FUNCTION IF EXISTS public.issue_consent_grant(text, text, uuid, text[], text, text);
DROP FUNCTION IF EXISTS public.is_public_test(uuid);
DROP FUNCTION IF EXISTS public.is_public_specialist(uuid);
DROP FUNCTION IF EXISTS public.consent_sha256(text);
DROP FUNCTION IF EXISTS public.consent_ip_key(text);
DROP FUNCTION IF EXISTS public.consent_email_key(text);
DROP FUNCTION IF EXISTS public.protect_consent_grant_fields();
DROP FUNCTION IF EXISTS public.block_legal_documents_mutation();
DROP FUNCTION IF EXISTS public.appointments_patient_cancel_only();

DROP TABLE IF EXISTS public.consent_grants;
DROP TABLE IF EXISTS public.legal_documents;
