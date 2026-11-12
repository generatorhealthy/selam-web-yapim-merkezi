"""Synthetic fixture only, explicit local socket; never uses production environment variables."""
import subprocess, concurrent.futures
from pathlib import Path
ROOT=Path(__file__).parent
PSQL='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/psql'
def sql(q,ok=True):
 p=subprocess.run([PSQL,'-h','/tmp/health-live-socket','-p','55441','-U','lovable','-d','health_acceptance','-X','-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
 if ok and p.returncode: raise AssertionError(p.stderr)
 if not ok and not p.returncode: raise AssertionError('unexpected success')
 return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
sql('''CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
CREATE TABLE specialists(id uuid PRIMARY KEY,user_id uuid,is_active boolean);
CREATE TABLE tests(id uuid PRIMARY KEY,specialist_id uuid,is_active boolean);
CREATE TABLE specialist_tests(id uuid PRIMARY KEY,test_id uuid,specialist_id uuid,is_enabled boolean);
CREATE TABLE test_questions(id uuid PRIMARY KEY,test_id uuid,question_type text,options jsonb,is_required boolean,step_number int);
CREATE TABLE test_results(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),test_id uuid NOT NULL,specialist_id uuid NOT NULL,patient_user_id uuid,patient_name text NOT NULL,patient_email text NOT NULL,answers jsonb NOT NULL,results jsonb NOT NULL,status text NOT NULL);
GRANT USAGE ON SCHEMA public,auth TO service_role,anon,authenticated;
GRANT INSERT ON test_results TO anon,authenticated;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY legacy_insert ON test_results FOR INSERT WITH CHECK(true);
''')
sql((ROOT/'foundation.sql').read_text())
ids=[f'00000000-0000-4000-8000-{n:012d}' for n in range(1,8)]
t,s,other,q,u,otheruser,docid=ids
sql(f"INSERT INTO specialists VALUES('{s}','{s}',true),('{other}','{other}',true);INSERT INTO tests VALUES('{t}','{s}',true);INSERT INTO test_questions VALUES('{q}','{t}','multiple_choice','[\"zero\",\"one\"]',true,1);")
h='a'*64
def prep(user=u,sid=s,version='test-v1',cap=h):
 return f"SET ROLE service_role;SELECT health_test_prepare('{user}','{t}','{sid}','{cap}','{version}',encode(sha256(convert_to('synthetic disclosure','UTF8')),'hex'),encode(sha256(convert_to('synthetic consent','UTF8')),'hex'));"
sql(prep(),False)
assert sql('SELECT count(*) FROM health_test_operations')=='0'
print('PASS inactive release creates no consent or operation')
sql("INSERT INTO health_test_release VALUES(true,true,now());INSERT INTO health_test_documents(version,disclosure,consent,legal_approved_at,published_at) VALUES('test-v1','synthetic disclosure','synthetic consent',now(),now());")
sql(prep().replace('SET ROLE service_role','SET ROLE anon'),False)
sql(prep().replace(f"'{u}'",'NULL'),False)
sql(prep(sid=other),False)
sql(prep(version='unapproved'),False)
assert sql('SELECT count(*) FROM health_test_consent_events')=='0'
print('PASS anon, guest, wrong specialist and unapproved document rejected atomically')
op=sql(prep())
assert sql(f"SELECT count(*) FROM health_test_consent_events WHERE operation_id='{op}'")=='2'
assert sql(f"SELECT count(DISTINCT recorded_at) FROM health_test_consent_events WHERE operation_id='{op}'")=='1'
assert sql(f"SELECT count(*) FROM health_test_consent_events WHERE operation_id='{op}' AND document_hash=encode(sha256(convert_to(document_text,'UTF8')),'hex')")=='2'
print('PASS disclosure and health grant separate, exact hash, same server transaction time')
def commit(operation=op,user=u,cap=h,answer='one'):
 return f"SET ROLE service_role;SELECT health_test_commit('{user}','{operation}','{cap}','synthetic','synthetic@example.invalid','{{\"{q}\":\"{answer}\"}}');"
sql(commit(user=otheruser),False);sql(commit(cap='b'*64),False)
sql(f"SET ROLE anon;INSERT INTO test_results(test_id,specialist_id,patient_name,patient_email,answers,results,status) VALUES('{t}','{s}','synthetic','contact','{{}}','{{}}','completed');",False)
sql(f"SET ROLE authenticated;INSERT INTO test_results(test_id,specialist_id,patient_name,patient_email,answers,results,status) VALUES('{t}','{s}','synthetic','contact','{{}}','{{}}','completed');",False)
print('PASS old anon/authenticated direct INSERT rejected when release enabled')
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex: results=list(ex.map(lambda _:sql(commit()),range(20)))
assert len(set(results))==1 and sql('SELECT count(*) FROM test_results')=='1'
assert sql('SELECT count(*) FROM health_test_consent_events')=='2'
sql(commit(answer='zero'),False)
print('PASS 20 simultaneous submissions -> one result; changed retry rejected; no duplicate consent')
sql("UPDATE health_test_consent_events SET action='grant'",False)
sql('DELETE FROM health_test_consent_events',False)
sql("UPDATE health_test_documents SET consent='different'",False)
print('PASS evidence and document snapshots immutable')
op2=sql(prep(cap='c'*64))
withdraw=f"SET ROLE service_role;SELECT health_test_withdraw('{u}','{op2}','{'c'*64}');"
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex: list(ex.map(lambda _:sql(withdraw),range(20)))
assert sql(f"SELECT count(*) FROM health_test_consent_events WHERE operation_id='{op2}' AND action='withdraw'")=='1'
sql(commit(operation=op2,cap='c'*64),False)
assert sql('SELECT count(*) FROM test_results')=='1'
print('PASS concurrent withdrawal is once, prevents subsequent health write, retains saved result')
sql('SET ROLE authenticated;SELECT * FROM health_test_operations',False)
sql('SET ROLE anon;SELECT * FROM health_test_consent_events',False)
sql('GRANT SELECT ON test_results TO authenticated;CREATE POLICY owner_read ON test_results FOR SELECT TO authenticated USING(specialist_id IN(SELECT id FROM specialists WHERE user_id=auth.uid()));GRANT SELECT ON specialists TO authenticated;')
assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{s}';SELECT count(*) FROM test_results")=='1'
assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{other}';SELECT count(*) FROM test_results")=='0'
print('PASS capabilities hidden; owning specialist reads result; unrelated specialist denied')
assert sql("SELECT results ?| ARRAY['totalScore','scorePercentage','riskLevel'] FROM test_results")=='f'
print('PASS no fabricated automatic clinical interpretation')
sql('CREATE TABLE ai_call_sessions(id uuid,lead_id uuid,lead_name text,lead_phone text,line_prefix text,channel_id text,status text,outcome text,transferred_specialist_id uuid,transferred_specialist_name text,transferred_extension text,callback_at timestamptz,is_test boolean,started_at timestamptz,ended_at timestamptz,created_at timestamptz,transcript jsonb,error_message text);GRANT SELECT ON ai_call_sessions TO authenticated;')
sql((ROOT/'ai-metadata.sql').read_text())
sql('SET ROLE authenticated;SELECT id,status,started_at FROM ai_call_sessions')
sql('SET ROLE authenticated;SELECT transcript FROM ai_call_sessions',False)
sql('SET ROLE authenticated;SELECT error_message FROM ai_call_sessions',False)
print('PASS AI metadata available; transcript/free-text error unavailable without changing records')