DO $migration$
DECLARE source text; updated text;
BEGIN
 source := pg_get_functiondef('public.notify_specialist_new_test_result()'::regprocedure);
 IF position('COALESCE(NEW.patient_name, ''Bir danışan'') || '' "'' || v_test_title || ''" testini tamamladı''' in source)=0
 OR position('''id'', NEW.id::text' in source)=0
 OR position('v_sms_message := ''Doktorumol: '' || COALESCE(NEW.patient_name, ''Bir danisan'')' in source)=0 THEN
  RAISE EXCEPTION 'C production definition mismatch';
 END IF;
 updated := replace(source,
  'COALESCE(NEW.patient_name, ''Bir danışan'') || '' "'' || v_test_title || ''" testini tamamladı''',
  '''Doktorum Ol hesabınızda değerlendirmenizi bekleyen yeni bir kayıt bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.''');
 updated := replace(updated, '''Yeni Test Sonucu''', '''Yeni değerlendirme bildirimi''');
 updated := replace(updated, ',''id'', NEW.id::text', '');
 updated := regexp_replace(updated,
  'v_sms_message := ''Doktorumol: ''[\s\S]*?Detaylar icin panelinize giris yapin.'';',
  'v_sms_message := ''Doktorum Ol hesabınızda değerlendirmenizi bekleyen yeni bir kayıt bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.'';');
 updated := regexp_replace(updated,
  '  -- Test başlığı[\s\S]*?v_test_title := COALESCE\(v_test_title, ''Test''\);', '');
 updated := replace(updated, '  v_test_title text;', '');
 updated := replace(updated, 'jsonb_build_object(''type'',''test_result'',''url'',''/doktor-paneli'')',
  'jsonb_build_object(''url'',''/doktor-paneli'')');
 updated := replace(updated, 'RAISE WARNING ''notify_specialist_new_test_result error: %'', SQLERRM;',
  'RAISE WARNING ''test_notice_dispatch_failed'';');
 IF updated=source OR updated ~ 'patient_name|patient_email|NEW\.id|v_test_title|NEW\.answers|NEW\.results' THEN
  RAISE EXCEPTION 'C minimization incomplete';
 END IF;
 EXECUTE updated;
END $migration$;