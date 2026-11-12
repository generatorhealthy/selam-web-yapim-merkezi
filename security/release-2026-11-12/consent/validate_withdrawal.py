"""Dedicated synthetic DB. Includes preceding append-only consent SQL and legacy rows."""
import subprocess,concurrent.futures
from pathlib import Path
root=Path(__file__).parent
def sql(q,ok=True):
 p=subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','consent_release','-X','-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
 if ok and p.returncode:raise AssertionError(p.stderr)
 if not ok and not p.returncode:raise AssertionError('unexpected success')
 return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
sql("CREATE TABLE user_consent_logs(id uuid PRIMARY KEY,user_id uuid,consent_type text,consent_version text,document_hash text,accepted boolean,accepted_at timestamptz,source text,ip_address text,metadata jsonb);INSERT INTO user_consent_logs(id,consent_type,accepted) SELECT gen_random_uuid(),'synthetic-legacy',false FROM generate_series(1,57);")
baseline=sql("SELECT md5(string_agg(to_jsonb(t)::text,'' ORDER BY id)) FROM user_consent_logs t")
sql((root.parents[1]/'priority-2026-11-12/consent-draft.sql').read_text())
sql((root/'withdrawal.sql').read_text())
u='00000000-0000-4000-8000-000000000001';grant='00000000-0000-4000-8000-000000000002';withdraw='00000000-0000-4000-8000-000000000003'
sql("INSERT INTO verified_consent_documents VALUES('health_test','synthetic-v1','synthetic text','unused',true)")
sql(f"SET ROLE service_role;SELECT record_verified_consent('{u}','{grant}','health_test','grant','synthetic-v1')")
sql("UPDATE verified_consent_documents SET published=false")
query=f"SET ROLE service_role;SELECT withdraw_verified_consent('{u}','{withdraw}','health_test')"
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:events=list(ex.map(lambda _:sql(query),range(20)))
assert len(set(events))==1
assert sql('SELECT count(*) FROM user_consent_logs')=='59'
assert sql("SELECT action FROM verified_consent_current")=='withdraw'
assert sql("SELECT md5(string_agg(to_jsonb(t)::text,'' ORDER BY id)) FROM user_consent_logs t WHERE consent_type='synthetic-legacy'")==baseline
print('PASS 20 concurrent withdrawals -> one append-only event after document unpublished; 57 synthetic legacy rows unchanged')
sql(query.replace('service_role','anon'),False)
sql('UPDATE user_consent_logs SET accepted=true',False)
sql('DELETE FROM user_consent_logs',False)
print('PASS anonymous withdrawal, UPDATE and DELETE denied')