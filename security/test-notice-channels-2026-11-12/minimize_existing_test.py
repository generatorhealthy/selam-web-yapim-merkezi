"""Rollback-only existing synthetic PostgreSQL; fake transport, no external calls."""
import os
import subprocess
from pathlib import Path

root = Path(__file__).parent
env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
fixture = r"""
BEGIN;
ALTER TABLE public.specialists ADD COLUMN phone text, ADD COLUMN name text;
ALTER TABLE public.tests ADD COLUMN title text;
CREATE SCHEMA IF NOT EXISTS net;
CREATE TABLE public.c_synthetic_messages(body jsonb);
CREATE OR REPLACE FUNCTION net.http_post(url text,headers jsonb,body jsonb) RETURNS bigint
LANGUAGE plpgsql AS $$ BEGIN
 IF headers->>'x-cron-secret'<>'synthetic' THEN RAISE EXCEPTION 'transport changed'; END IF;
 INSERT INTO public.c_synthetic_messages VALUES(body); RETURN 1;
END $$;
CREATE OR REPLACE FUNCTION public.notify_specialist_new_test_result() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE
 v_user_id uuid;
 v_phone text;
  v_test_title text;
 v_specialist_name text;
 v_sms_message text;
BEGIN
 IF NEW.specialist_id IS NULL THEN RETURN NEW; END IF;
 SELECT user_id,phone,name INTO v_user_id,v_phone,v_specialist_name FROM public.specialists WHERE id=NEW.specialist_id;
  -- Test başlığı
  SELECT title INTO v_test_title FROM public.tests WHERE id = NEW.test_id;
  v_test_title := COALESCE(v_test_title, 'Test');
 IF v_user_id IS NOT NULL THEN
 PERFORM net.http_post(url:='https://transport.invalid/push',headers:='{"x-cron-secret":"synthetic"}',body:=jsonb_build_object(
 'user_ids',jsonb_build_array(v_user_id),'title','Yeni Test Sonucu',
 'body',COALESCE(NEW.patient_name, 'Bir danışan') || ' "' || v_test_title || '" testini tamamladı',
 'data',jsonb_build_object('type','test_result','url','/doktor-paneli','id', NEW.id::text)));
 END IF;
 IF v_phone IS NOT NULL AND length(trim(v_phone))>0 THEN
 v_sms_message := 'Doktorumol: ' || COALESCE(NEW.patient_name, 'Bir danisan') ||
 ' "' || v_test_title || '" testini tamamladi. Detaylar icin panelinize giris yapin.';
 PERFORM net.http_post(url:='https://transport.invalid/sms',headers:='{"x-cron-secret":"synthetic"}',body:=jsonb_build_object('phone',v_phone,'message',v_sms_message));
 END IF;
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN
 RAISE WARNING 'notify_specialist_new_test_result error: %', SQLERRM;
 RETURN NEW;
END;
$function$;
"""
checks = r"""
DO $$
DECLARE n bigint; t uuid; s uuid; msg record;
 notice text:='Doktorum Ol hesabınızda değerlendirmenizi bekleyen yeni bir kayıt bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.';
BEGIN
 SELECT id INTO s FROM public.specialists WHERE id='00000000-0000-4000-8000-000000000002';
 UPDATE public.specialists SET user_id='00000000-0000-4000-8000-000000000005',phone='synthetic-phone' WHERE id=s;
 SELECT id INTO t FROM public.tests LIMIT 1;
 SELECT count(*) INTO n FROM public.test_results;
 INSERT INTO public.test_results(test_id,specialist_id,patient_name,patient_email,answers,results)
 VALUES(t,s,'SENSITIVE_PERSON','SENSITIVE_EMAIL','{"SENSITIVE_ANSWER":1}','{"SENSITIVE_SCORE":99}');
 IF (SELECT count(*) FROM public.c_synthetic_messages)<>2 THEN RAISE EXCEPTION 'channels missing'; END IF;
 FOR msg IN SELECT body FROM public.c_synthetic_messages LOOP
  IF msg.body::text LIKE '%SENSITIVE%' THEN RAISE EXCEPTION 'health leaked'; END IF;
  IF msg.body ? 'message' THEN
   IF msg.body->>'message'<>notice OR msg.body->>'phone'<>'synthetic-phone' OR jsonb_object_length(msg.body)<>2 THEN RAISE EXCEPTION 'SMS payload'; END IF;
  ELSE
   IF msg.body->>'body'<>notice OR msg.body->'data'<>'{"url":"/doktor-paneli"}'::jsonb
     OR msg.body->'user_ids'<>'["00000000-0000-4000-8000-000000000005"]'::jsonb THEN RAISE EXCEPTION 'push payload'; END IF;
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM public.test_results)<>n+1 THEN RAISE EXCEPTION 'result lost'; END IF;
END $$;
CREATE OR REPLACE FUNCTION net.http_post(url text,headers jsonb,body jsonb) RETURNS bigint
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic provider failure'; END $$;
DO $$ DECLARE n bigint; t uuid; s uuid; BEGIN
 SELECT count(*) INTO n FROM public.test_results;
 SELECT id INTO t FROM public.tests LIMIT 1;
 SELECT id INTO s FROM public.specialists LIMIT 1;
 INSERT INTO public.test_results(test_id,specialist_id,patient_name,patient_email,answers,results)
 VALUES(t,s,'Synthetic','synthetic@example.invalid','{}','{}');
 IF (SELECT count(*) FROM public.test_results)<>n+1 THEN RAISE EXCEPTION 'provider failure lost result'; END IF;
 RAISE NOTICE 'PASS C: exact generic payloads, registered recipients, two channels, legacy INSERT survives provider failure';
END $$;
ROLLBACK;
"""
# jsonb_object_length is not built into PG; count keys instead.
checks = checks.replace('jsonb_object_length(msg.body)', '(SELECT count(*) FROM jsonb_object_keys(msg.body))')
sql = fixture + (root/'minimize-existing.sql').read_text() + r"""
CREATE TRIGGER trg_notify_specialist_new_test_result AFTER INSERT ON public.test_results
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_test_result();
""" + checks
result = subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','test_release','-X','-v','ON_ERROR_STOP=1','-c',sql],env=env,capture_output=True,text=True)
if result.returncode:
 raise SystemExit(result.stderr)
print(result.stderr.strip())
print('All synthetic mutations rolled back; no live or provider connection.')