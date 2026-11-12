-- AŞAMA 4 — ONAY BEKLİYOR, çalıştırılmadı. Kayıt silmez/değiştirmez.
-- Sıra: önce yeni send-appointment-notification yayınlanır (eski tetikleyiciyle de uyumlu:
-- gövdedeki alanları yok sayar, her şeyi randevu kaydından okur). Sonra bu SQL.
-- Amaç: tetikleyici artık yalnız randevu kimliğini yollar; not, telefon, e-posta
-- veritabanının HTTP istek kuyruğuna (net._http_request) hiç yazılmaz.
CREATE OR REPLACE FUNCTION public.send_appointment_notification_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_hdr jsonb;
BEGIN
  IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
  -- Mevcut tetikleyicideki yetki başlığı aynen korunur (uygulama sırasında mevcut tanımdan kopyalanır).
  v_hdr := '__MEVCUT_BASLIK__'::jsonb;
  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-appointment-notification',
    headers := v_hdr,
    body := jsonb_build_object('appointmentId', NEW.id)
  );
  -- Uzmanın oluşturduğu bekleyen randevuda danışana SMS: davranış aynen korunur (not içermez).
  IF NEW.created_by_specialist = true AND NEW.status = 'pending' THEN
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-sms-via-static-proxy',
      headers := v_hdr,
      body := jsonb_build_object('phone', NEW.patient_phone, 'message', format(
        'Merhaba %s, %s ile %s tarihinde saat %s''da %s randevunuz mevcuttur. Detaylar için: doktorumol.com.tr',
        NEW.patient_name, (SELECT name FROM specialists WHERE id = NEW.specialist_id),
        TO_CHAR(NEW.appointment_date::date, 'DD.MM.YYYY'), NEW.appointment_time,
        CASE WHEN NEW.appointment_type = 'online' THEN 'online'
             WHEN NEW.appointment_type = 'face-to-face' THEN 'yüz yüze' ELSE NEW.appointment_type END)));
  END IF;
  RETURN NEW;
END $fn$;
-- GERİ ALMA: uygulama öncesi pg_get_functiondef ile alınan mevcut tanım security/stage4/rollback.sql'e yazılır ve aynen çalıştırılır.
