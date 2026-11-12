-- AŞAMA 2 (sağlık verisi) — ONAY BEKLİYOR, çalıştırılmadı.
-- Veri silmez/değiştirmez; yalnızca erişim kurallarını daraltır.

-- 1) Danışan e-postası artık kimlik sayılmaz: yalnızca kendi kullanıcı kimliğine bağlı kayıtlar.
--    Etki: patient_user_id'si boş, yalnızca e-postayla eşleşen 3 randevu danışan panelinde görünmez
--    (kayıtlar silinmez; uzman/yönetici görmeye devam eder). Test sonuçlarında etkilenen kayıt yok.
DROP POLICY IF EXISTS "Patients view own test results" ON public.test_results;
CREATE POLICY "Patients view own test results" ON public.test_results
  FOR SELECT TO authenticated USING (patient_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;
CREATE POLICY "Patients view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (patient_user_id = (SELECT auth.uid()));

-- 2) Danışan randevusunda yalnızca iptal: başka sütun değişirse reddedilir.
CREATE OR REPLACE FUNCTION public.enforce_patient_cancel_only()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND OLD.patient_user_id = auth.uid()
     AND NOT EXISTS (SELECT 1 FROM specialists s WHERE s.id = OLD.specialist_id AND s.user_id = auth.uid())
     AND NOT public.is_admin_or_staff_user() THEN
    IF NEW.status IS DISTINCT FROM 'cancelled'
       OR (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at') THEN
      RAISE EXCEPTION 'Danışan yalnızca randevusunu iptal edebilir';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_patient_cancel_only ON public.appointments;
CREATE TRIGGER trg_patient_cancel_only BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_patient_cancel_only();

-- GERİ ALMA:
-- DROP TRIGGER trg_patient_cancel_only ON public.appointments; DROP FUNCTION public.enforce_patient_cancel_only();
-- DROP POLICY "Patients view own test results" ON public.test_results;
-- CREATE POLICY "Patients view own test results" ON public.test_results FOR SELECT TO authenticated
--   USING ((auth.uid() = patient_user_id) OR (patient_email = (SELECT email FROM patient_profiles WHERE user_id = auth.uid() LIMIT 1)));
-- DROP POLICY "Patients view own appointments" ON public.appointments;
-- CREATE POLICY "Patients view own appointments" ON public.appointments FOR SELECT TO authenticated
--   USING ((patient_user_id = (SELECT auth.uid())) OR (patient_email = (SELECT p.email FROM patient_profiles p WHERE p.user_id = (SELECT auth.uid()) LIMIT 1)));
-- (Yedek tabloların personel erişimi bu dosyada değişmez; ayrı karar.)
