-- Aşama 2 / D — TEST SONUCU E-POSTASINI SUNUCU GÖNDERSİN
-- Kullanıcı kararı: send-test-results-email ucu yalnızca yönetici/personel (veya sunucu içi
-- çağrı) tarafından kullanılabilsin. Bugün o ucu tarayıcıdan misafir test akışı çağırıyor;
-- kapı tek başına uygulanırsa uzman e-postası bir daha gitmez. Bu dosya e-postanın
-- gönderilme yerini tarayıcıdan veritabanına taşır.
--
-- Mevcut notify_specialist_new_test_result tetikleyicisine DOKUNMAZ (içinde gömülü
-- sırlar taşınırken kaybolabilir). Bunun yerine ayrı bir tetikleyici eklenir.
--
-- ÇALIŞTIRMADAN ÖNCE: aşağıdaki <CRON_SECRET> yerini gerçek CRON_SECRET değeriyle değiştirin.
-- Sıra: 05 (bu dosya) -> send-test-results-email kapısının yayınlanması -> tarayıcıdaki
-- üç çağrının kaldırılması (TestTaking.tsx, TestTaker.tsx, MobileTestTaker.tsx).

CREATE OR REPLACE FUNCTION public.notify_specialist_test_result_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.specialist_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-test-results-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := jsonb_build_object('testResultId', NEW.id::text)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Bildirim hatası test gönderimini asla engellememeli.
  RAISE WARNING 'notify_specialist_test_result_email error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_test_result_email ON public.test_results;
CREATE TRIGGER trg_notify_test_result_email
  AFTER INSERT ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_test_result_email();

-- ------------------------- GERİ ALMA -------------------------
-- DROP TRIGGER IF EXISTS trg_notify_test_result_email ON public.test_results;
-- DROP FUNCTION IF EXISTS public.notify_specialist_test_result_email();
