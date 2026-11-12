"""Existing LOCAL synthetic DB only. No production env fallback, no provider calls."""
from pathlib import Path
import subprocess,os,concurrent.futures
env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
cmd=['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','test_release','-X','-v','ON_ERROR_STOP=1','-Atc']
def sql(q):
 r=subprocess.run(cmd+[q],env=env,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr)
 return r.stdout.strip()
rid='66666666-6666-4666-8666-666666666601'
sid='00000000-0000-4000-8000-000000000002'
try:
 sql('ALTER TABLE public.test_results ADD COLUMN created_at timestamptz DEFAULT now();')
 sql(Path(__file__).with_name('direct-claim.sql').read_text())
 sql(f"INSERT INTO public.test_results(id,test_id,specialist_id,patient_name,patient_email,answers,results,created_at) SELECT '{rid}',id,'{sid}','Synthetic','synthetic@example.invalid','{{}}','{{}}',now() FROM public.tests WHERE specialist_id='{sid}' LIMIT 1;")
 user=sql(f"SELECT user_id FROM public.specialists WHERE id='{sid}'")
 if not user:raise RuntimeError('fixture owner missing')
 with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
  outcomes=list(pool.map(lambda _:sql(f"SET ROLE service_role; SELECT public.claim_test_email_delivery('{rid}','{user}');"),range(20)))
 assert sum(x.endswith('t') for x in outcomes)==1,outcomes
 sql(f"SET ROLE service_role; UPDATE public.test_email_delivery_claims SET status='unknown' WHERE result_id='{rid}';")
 assert sql(f"SET ROLE service_role; SELECT public.claim_test_email_delivery('{rid}','{user}');").endswith('f')
 assert sql("SELECT has_function_privilege('anon','public.claim_test_email_delivery(uuid,uuid)','EXECUTE') OR has_function_privilege('authenticated','public.claim_test_email_delivery(uuid,uuid)','EXECUTE');")=='f'
 try:sql(f"SET ROLE service_role; SELECT public.claim_test_email_delivery('{rid}','99999999-9999-4999-8999-999999999999');")
 except RuntimeError:pass
 else:raise RuntimeError('unrelated user accepted')
 assert sql(f"SELECT count(*) FROM public.test_results WHERE id='{rid}'")=='1'
 print('PASS: 20 real PG connections one claim; unknown not retried; anon/auth RPC denied; unrelated rejected; result preserved')
finally:
 sql(f"DROP FUNCTION IF EXISTS public.claim_test_email_delivery(uuid,uuid); DROP TABLE IF EXISTS public.test_email_delivery_claims; DELETE FROM public.test_results WHERE id='{rid}'; ALTER TABLE public.test_results DROP COLUMN IF EXISTS created_at;")