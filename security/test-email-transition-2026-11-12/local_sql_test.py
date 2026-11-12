"""Existing synthetic local PG only. No new database, no historical migrations, all writes roll back."""
import os
import subprocess

ENV = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
QUERY = """
BEGIN;
DO $$
DECLARE before_count bigint; item record; rid uuid := '11111111-1111-4111-8111-111111111153';
BEGIN
 SELECT count(*) INTO before_count FROM public.test_results;
 INSERT INTO public.test_results(id,patient_name,patient_email,answers,results)
 VALUES(rid,'Synthetic only','person@example.invalid','{"q":"synthetic health"}','{}');
 INSERT INTO public.test_result_outbox(result_id) VALUES(rid);
 EXECUTE 'SET LOCAL ROLE service_role';
 SELECT * INTO item FROM public.claim_test_result_notice();
 IF item.result_id IS DISTINCT FROM rid THEN RAISE EXCEPTION 'unexpected fixture claim'; END IF;
 IF public.finish_test_result_notice(rid,'22222222-2222-4222-8222-222222222222','sent',NULL) THEN
  RAISE EXCEPTION 'wrong attempt accepted';
 END IF;
 IF NOT public.finish_test_result_notice(rid,item.attempt_id,'unknown',NULL) THEN RAISE EXCEPTION 'finish failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.claim_test_result_notice()) THEN RAISE EXCEPTION 'unknown retried'; END IF;
 EXECUTE 'RESET ROLE';
 IF (SELECT count(*) FROM public.test_results) <> before_count+1 THEN RAISE EXCEPTION 'result lost'; END IF;
 IF has_function_privilege('anon','public.claim_test_result_notice()','EXECUTE') OR
    has_function_privilege('authenticated','public.claim_test_result_notice()','EXECUTE') THEN
  RAISE EXCEPTION 'client can execute worker RPC';
 END IF;
 RAISE NOTICE 'PASS local SQL: attempt binding, unknown not retried, result retained, client RPC denied';
END $$;
ROLLBACK;
"""
result = subprocess.run(['psql', '-h', '/tmp/kvkk-priority-pg', '-p', '55439', '-U', 'postgres',
                         '-d', 'test_release', '-X', '-v', 'ON_ERROR_STOP=1', '-c', QUERY],
                        env=ENV, capture_output=True, text=True)
if result.returncode:
    raise SystemExit(result.stderr)
print(result.stdout.strip())
print(result.stderr.strip())
print('Existing synthetic fixture only; transaction rolled back; no provider or production requests.')