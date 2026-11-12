"""Atomic append-only SQL tests, synthetic local database only."""
import subprocess,concurrent.futures
from pathlib import Path
def sql(q,ok=True):
 p=subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','priority_test','-X','-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
 if ok and p.returncode:raise AssertionError(p.stderr)
 if not ok and not p.returncode:raise AssertionError('Unexpected write')
 return p.stdout.strip()
sql('DROP TABLE public.user_consent_logs CASCADE') if sql("SELECT to_regclass('public.user_consent_logs')") else None
sql("CREATE TABLE public.user_consent_logs(id uuid PRIMARY KEY,user_id uuid,consent_type text,consent_version text,document_hash text,accepted boolean,accepted_at timestamptz DEFAULT now(),source text,ip_address text,metadata jsonb);INSERT INTO public.user_consent_logs(id,consent_type,accepted) SELECT gen_random_uuid(),'synthetic-legacy',false FROM generate_series(1,57);")
baseline=sql("SELECT md5(string_agg(to_jsonb(t)::text,'' ORDER BY id)) FROM user_consent_logs t")
sql(Path(__file__).with_name('consent-draft.sql').read_text())
sql("INSERT INTO verified_consent_documents VALUES('health_test','synthetic-v1','synthetic approved text','wrong caller hash',true),('health_appointment','unpublished','draft','',false);")
uid='00000000-0000-4000-8000-000000000001';op='00000000-0000-4000-8000-000000000021'
q=f"SET ROLE service_role;SELECT record_verified_consent('{uid}','{op}','health_test','decline','synthetic-v1');"
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:results=list(ex.map(lambda _:sql(q).splitlines()[-1],range(20)))
assert len(set(results))==1
assert sql('SELECT count(*) FROM user_consent_logs')=='58'
assert sql("SELECT accepted FROM user_consent_logs WHERE source='verified_server'")=='f'
assert sql("SELECT document_hash=encode(sha256(convert_to('synthetic approved text','UTF8')),'hex') FROM user_consent_logs WHERE source='verified_server'")=='t'
print('PASS 20 concurrent real SQL consent calls -> 1 declined event with server SHA-256')
sql(f"SET ROLE service_role;SELECT record_verified_consent('{uid}','{op}','health_test','grant','synthetic-v1');",False)
print('PASS same operation changed action conflicts without modifying history')
for action,num in [('grant',22),('withdraw',23)]:sql(f"SET ROLE service_role;SELECT record_verified_consent('{uid}','00000000-0000-4000-8000-{num:012d}','health_test','{action}','synthetic-v1');")
assert sql('SELECT count(*) FROM user_consent_logs')=='60'
assert sql('SELECT action FROM verified_consent_current')=='withdraw'
print('PASS grant and withdrawal stored separately; current state withdrawn')
sql(f"SET ROLE service_role;SELECT record_verified_consent('{uid}','00000000-0000-4000-8000-000000000024','health_appointment','grant','unpublished');",False)
assert sql("SELECT count(*) FROM verified_consent_current WHERE purpose='health_appointment'")=='0'
print('PASS unpublished document rolls back all state writes')
sql('UPDATE user_consent_logs SET accepted=true',False);sql('DELETE FROM user_consent_logs',False)
assert sql("SELECT md5(string_agg(to_jsonb(t)::text,'' ORDER BY id)) FROM user_consent_logs t WHERE consent_type='synthetic-legacy'")==baseline
sql(f"SET ROLE anon;SELECT record_verified_consent('{uid}','{op}','health_test','decline','synthetic-v1');",False)
print('PASS 57 synthetic historical rows unchanged; UPDATE/DELETE and anon RPC denied')