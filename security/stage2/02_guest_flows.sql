-- Aşama 2 / B — MİSAFİR YAZIMLARI (randevu ve test)
-- Gereksinim: "authenticated WITH CHECK (true)" kalmayacak; istemci rastgele satır yazamayacak.
-- Bu dosya YALNIZCA yeni politika tanımlarını ve misafir akışlarının mevcut gövdelerini
-- koruyarak daraltılmasını içerir. Uygulama kodu değişikliği GEREKTİRMEZ.
--
-- Korunan gövdeler (kod tabanından doğrulandı):
--   misafir randevu: specialist_id + ad/e-posta/telefon + tarih/saat/tür + not -> status 'pending'
--   uzman randevusu: created_by_specialist = true, status 'pending' veya 'confirmed'
--   hasta iptali:    { status: 'cancelled' }
--   misafir testi:   test_id + specialist_id + ad + e-posta (telefon da olabilir) + answers/results

-- ===========================================================================
-- 1) appointments
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- Misafir randevusu: yalnızca kamuya açık bir uzmana, bekleyen durumda,
-- sahte uzman/kullanıcı kimliği ve yönetici alanları yazılamaz.
CREATE POLICY "Guests can book appointments" ON public.appointments
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending'::text
  AND created_by_specialist = false
  AND patient_user_id IS NULL
  AND specialist_id IS NOT NULL
  AND public.is_public_specialist(specialist_id)
  AND length(trim(patient_name)) BETWEEN 2 AND 120
  AND patient_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'::text
  AND patient_phone ~ '^[0-9+() -]{7,20}$'::text
  AND appointment_type IN ('online'::text, 'face-to-face'::text)
  AND coalesce(octet_length(notes), 0) <= 4000
  AND coalesce(octet_length(consultation_topic), 0) <= 400
);

-- Uzman kendi adına randevu ekleyebilir; sahiplik sunucuda specialists.user_id ile doğrulanır.
CREATE POLICY "Specialists can create their own appointments" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (
  created_by_specialist = true
  AND status IN ('pending'::text, 'confirmed'::text)
  AND specialist_id IS NOT NULL
  AND specialist_id IN (
    SELECT s.id FROM public.specialists s WHERE s.user_id = (SELECT auth.uid())
  )
  AND length(trim(patient_name)) BETWEEN 1 AND 120
  AND patient_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'::text
  AND patient_phone ~ '^[0-9+() -]{7,20}$'::text
  AND appointment_type IN ('online'::text, 'face-to-face'::text)
  AND coalesce(octet_length(notes), 0) <= 4000
  AND coalesce(octet_length(consultation_topic), 0) <= 400
);

-- Hasta iptali: yeni satır da "cancelled" olmak zorunda (eskiden WITH CHECK yoktu).
DROP POLICY IF EXISTS "Patients cancel own appointments" ON public.appointments;
CREATE POLICY "Patients cancel own appointments" ON public.appointments
FOR UPDATE TO authenticated
USING (patient_user_id = (SELECT auth.uid()))
WITH CHECK (
  status = 'cancelled'::text
  AND patient_user_id = (SELECT auth.uid())
);

-- RLS sütun kısıtlamaz: hastanın kendi satırında yalnızca durum değişebilir.
CREATE OR REPLACE FUNCTION public.appointments_patient_cancel_only()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_admin_user() OR public.is_admin_or_staff_user() THEN
    RETURN NEW;
  END IF;
  IF OLD.patient_user_id IS DISTINCT FROM v_uid THEN
    RETURN NEW;
  END IF;
  IF OLD.specialist_id IN (SELECT s.id FROM public.specialists s WHERE s.user_id = v_uid) THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'cancelled'::text THEN
    RAISE EXCEPTION 'hasta yalnızca randevuyu iptal edebilir';
  END IF;
  IF to_jsonb(NEW) - 'status'::text - 'updated_at'::text
     IS DISTINCT FROM to_jsonb(OLD) - 'status'::text - 'updated_at'::text THEN
    RAISE EXCEPTION 'hasta durumu dışında hiçbir alanı değiştiremez';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS appointments_patient_cancel_only ON public.appointments;
CREATE TRIGGER appointments_patient_cancel_only
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_patient_cancel_only();

-- ===========================================================================
-- 2) test_results
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can insert test results" ON public.test_results;

-- Misafir test gönderimi: gerçekten yayında bir teste, o testin uzmanına,
-- sınırlı boyutta ve kullanıcı bağlamı yazmadan.
CREATE POLICY "Visitors can submit test results" ON public.test_results
FOR INSERT TO anon, authenticated
WITH CHECK (
  public.is_public_test(test_id)
  AND specialist_id IS NOT NULL
  AND (
    specialist_id IN (SELECT t.specialist_id FROM public.tests t WHERE t.id = test_results.test_id)
    OR NOT EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_results.test_id AND t.specialist_id IS NOT NULL
    )
  )
  AND length(trim(patient_name)) BETWEEN 2 AND 120
  AND patient_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'::text
  AND status IN ('pending'::text, 'completed'::text)
  AND jsonb_typeof(answers) = 'object'::text
  AND jsonb_typeof(results) = 'object'::text
  AND coalesce(octet_length(answers::text), 0) <= 200000
  AND coalesce(octet_length(results::text), 0) <= 200000
  AND patient_user_id IS NULL
);

-- test_results üzerinde tarayıcı UPDATE akışı bulunmadı; bu yüzden UPDATE politikası
-- eklenmez (yok = reddedilir). Mevcut okuma/silme politikaları olduğu gibi kalır.
