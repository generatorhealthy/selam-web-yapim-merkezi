"""Existing synthetic PG only; installs candidates inside a rollback-only transaction. No new DB."""
import os,subprocess
from pathlib import Path
root=Path(__file__).parent
env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
schema=(root/'queue.sql').read_text().replace('BEGIN;','').replace('COMMIT;','')
channels=(root.parent/'test-notice-channels-2026-11-12/channels.sql').read_text().replace('BEGIN;','').replace('COMMIT;','')
q='BEGIN;\nALTER ROLE service_role BYPASSRLS;\n'+schema+channels+"""
CREATE TRIGGER trg_notify_specialist_new_test_result AFTER INSERT ON public.test_results
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_test_result();
DO $$
DECLARE rid uuid; rid2 uuid; item record; n bigint;
 t uuid := '00000000-0000-4000-8000-000000000001';
 s uuid := '00000000-0000-4000-8000-000000000002';
 u uuid := '00000000-0000-4000-8000-000000000005';
 op uuid := '55555555-5555-4555-8555-555555555506';
BEGIN
 IF EXISTS(SELECT 1 FROM public.test_notice_queue_v1) THEN RAISE EXCEPTION 'historical backfill'; END IF;
 SELECT count(*) INTO n FROM public.test_results;
 EXECUTE 'SET LOCAL ROLE service_role';
 rid:=public.commit_test_result_v1(op,t,s,u,'Synthetic','person@example.invalid','{}');
 rid2:=public.commit_test_result_v1(op,t,s,u,'Synthetic','person@example.invalid','{}');
 IF rid IS DISTINCT FROM rid2 THEN RAISE EXCEPTION 'duplicate result'; END IF;
 BEGIN
  PERFORM public.commit_test_result_v1(op,t,s,u,'Changed','person@example.invalid','{}');
  RAISE EXCEPTION 'changed replay accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='changed replay accepted' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM public.test_notice_queue_v1 WHERE result_id=rid)<>3 THEN RAISE EXCEPTION 'missing channel: %', (SELECT jsonb_agg(q) FROM public.test_notice_queue_v1 q); END IF;
 SELECT * INTO item FROM public.claim_test_notice_v1('email');
 IF item.result_id IS DISTINCT FROM rid THEN RAISE EXCEPTION 'claim mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM public.claim_test_notice_v1('email')) THEN RAISE EXCEPTION 'second claim'; END IF;
 IF public.finish_test_notice_v1(rid,'email',op,'sent',NULL) THEN RAISE EXCEPTION 'wrong attempt accepted'; END IF;
 IF NOT public.finish_test_notice_v1(rid,'email',item.attempt_id,'unknown',NULL) THEN RAISE EXCEPTION 'finish'; END IF;
 IF EXISTS(SELECT 1 FROM public.claim_test_notice_v1('email')) THEN RAISE EXCEPTION 'unknown retried'; END IF;
 EXECUTE 'RESET ROLE';
 IF (SELECT count(*) FROM public.test_results)<>n+1 THEN RAISE EXCEPTION 'result lost'; END IF;
 IF has_function_privilege('anon','public.claim_test_notice_v1(text)','EXECUTE') THEN RAISE EXCEPTION 'anon worker'; END IF;
 EXECUTE 'SET LOCAL ROLE authenticated';
 PERFORM set_config('request.jwt.claim.sub',s::text,true);
 IF NOT EXISTS(SELECT 1 FROM public.test_results WHERE id=rid) THEN RAISE EXCEPTION 'owner readback'; END IF;
 PERFORM set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
 IF EXISTS(SELECT 1 FROM public.test_results WHERE id=rid) THEN RAISE EXCEPTION 'unrelated readback'; END IF;
 EXECUTE 'RESET ROLE';
 RAISE NOTICE 'PASS candidate SQL: no backfill, one result, replay conflict, three channels, attempt bound, unknown held, owner readback, unrelated denied';
END $$;
ROLLBACK;
"""
r=subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','test_release','-X','-v','ON_ERROR_STOP=1','-c',q],env=env,capture_output=True,text=True)
if r.returncode: raise SystemExit(r.stderr)
print(r.stderr.strip());print('Candidate SQL applied only within existing synthetic fixture transaction; all changes rolled back.')