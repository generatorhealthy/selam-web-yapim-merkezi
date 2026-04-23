
CREATE OR REPLACE FUNCTION public.notify_specialist_new_test_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_phone text;
  v_test_title text;
  v_specialist_name text;
  v_sms_message text;
BEGIN
  IF NEW.specialist_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Uzman bilgisini al
  SELECT user_id, phone, name
    INTO v_user_id, v_phone, v_specialist_name
  FROM public.specialists
  WHERE id = NEW.specialist_id;

  -- Test başlığı
  SELECT title INTO v_test_title FROM public.tests WHERE id = NEW.test_id;
  v_test_title := COALESCE(v_test_title, 'Test');

  -- 1) Push bildirimi (uygulama içi)
  IF v_user_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
      body := jsonb_build_object(
        'user_ids', jsonb_build_array(v_user_id),
        'title', 'Yeni Test Sonucu',
        'body', COALESCE(NEW.patient_name, 'Bir danışan') || ' "' || v_test_title || '" testini tamamladı',
        'data', jsonb_build_object('type','test_result','url','/doktor-paneli','id', NEW.id::text)
      )
    );
  END IF;

  -- 2) SMS bildirimi (uzman telefonuna)
  IF v_phone IS NOT NULL AND length(trim(v_phone)) > 0 THEN
    v_sms_message := 'Doktorumol: ' || COALESCE(NEW.patient_name, 'Bir danisan') ||
                     ' "' || v_test_title || '" testini tamamladi. Detaylar icin panelinize giris yapin.';
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-sms-via-static-proxy',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
      body := jsonb_build_object(
        'phone', v_phone,
        'message', v_sms_message
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_specialist_new_test_result error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_specialist_new_test_result ON public.test_results;
CREATE TRIGGER trg_notify_specialist_new_test_result
AFTER INSERT ON public.test_results
FOR EACH ROW
EXECUTE FUNCTION public.notify_specialist_new_test_result();
