"""Synthetic local PostgreSQL only; never reads credentials or reaches production."""
import subprocess, concurrent.futures
from pathlib import Path
ROOT=Path(__file__).parent
def sql(q, ok=True):
 p=subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','test_release','-X','-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
 if ok and p.returncode: raise AssertionError(p.stderr)
 if not ok and not p.returncode: raise AssertionError('unexpected success')
 return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
sql('''CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
CREATE TABLE specialists(id uuid PRIMARY KEY,user_id uuid,email text,is_active boolean);
CREATE TABLE tests(id uuid PRIMARY KEY,specialist_id uuid,is_active boolean);
CREATE TABLE specialist_tests(test_id uuid,specialist_id uuid,is_enabled boolean);
CREATE TABLE test_questions(id uuid PRIMARY KEY,test_id uuid,question_type text,options jsonb,is_required boolean,step_number int);
CREATE TABLE test_results(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),test_id uuid,specialist_id uuid,patient_user_id uuid,patient_name text,patient_email text,answers jsonb,results jsonb,status text);
CREATE TABLE verified_consent_current(user_id uuid,purpose text,action text,log_id uuid,PRIMARY KEY(user_id,purpose));
CREATE TABLE verified_consent_documents(purpose text,published boolean,version text,document_text text);
GRANT USAGE ON SCHEMA public TO service_role,anon,authenticated;
''')
ids=[f'00000000-0000-4000-8000-{n:012d}' for n in range(1,7)]
t,s,other,q,u,event=ids
sql(f"INSERT INTO specialists VALUES('{s}','{s}','synthetic@example.invalid',true),('{other}','{other}','other@example.invalid',true);INSERT INTO tests VALUES('{t}','{s}',true);INSERT INTO test_questions VALUES('{q}','{t}','multiple_choice','[\"zero\",\"one\"]',true,1);INSERT INTO verified_consent_documents VALUES('health_test',true,'synthetic-v1','synthetic text');INSERT INTO verified_consent_current VALUES('{u}','health_test','grant','{event}');")
sql((ROOT/'schema.sql').read_text())
h='a'*64
def prepare(sid=s,user='NULL',declared='true'):
 return sql(f"SET ROLE service_role;SELECT prepare_test_submission('{t}','{sid}',{user},'{h}',{declared});")
sql(f"SET ROLE anon;SELECT prepare_test_submission('{t}','{s}',NULL,'{h}',true);",False)
sql(f"SET ROLE service_role;SELECT prepare_test_submission('{t}','{other}',NULL,'{h}',true);",False)
print('PASS anonymous RPC denied and unrelated specialist rejected')
op=prepare()
assert sql(f"SELECT guest_document_hash=encode(sha256(convert_to('synthetic text','UTF8')),'hex') FROM test_submission_operations WHERE id='{op}'")=='t'
print('PASS guest declaration stores server-selected document snapshot and hash')
def commit(op=op,hash=h,user='NULL',answer='one'):
 return f"SET ROLE service_role;SELECT commit_test_submission('{op}','{hash}',{user},'synthetic','contact','{{\"{q}\":\"{answer}\"}}');"
sql(commit(hash='b'*64),False)
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex: results=list(ex.map(lambda _:sql(commit()),range(20)))
assert len(set(results))==1
assert sql('SELECT count(*) FROM test_results')=='1'
assert sql('SELECT count(*) FROM test_result_outbox')=='1'
print('PASS 20 concurrent guest submissions -> one result and one durable outbox')
sql(commit(answer='zero'),False)
print('PASS operation replay with changed answers rejected')
sql('SET ROLE authenticated;SELECT * FROM test_submission_operations',False)
sql('SET ROLE anon;SELECT * FROM test_result_outbox',False)
print('PASS operation capability and outbox hidden from clients')
op2=prepare(user=f"'{u}'")
sql(f"UPDATE verified_consent_current SET action='withdraw' WHERE user_id='{u}'")
sql(commit(op=op2,user=f"'{u}'"),False)
assert sql('SELECT count(*) FROM test_results')=='1'
print('PASS consent withdrawal before commit prevents health write')
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex: claims=list(ex.map(lambda _:sql('SET ROLE service_role;SELECT result_id::text||\'|\'||attempt_id::text FROM claim_test_result_notice();'),range(20)))
claims=[x for x in claims if '|' in x];assert len(claims)==1
rid,attempt=claims[0].split('|')
assert sql(f"SET ROLE service_role;SELECT finish_test_result_notice('{rid}','{other}','sent',NULL)")=='f'
assert sql(f"SET ROLE service_role;SELECT finish_test_result_notice('{rid}','{attempt}','unknown',NULL)")=='t'
assert sql('SET ROLE service_role;SELECT count(*) FROM claim_test_result_notice()')=='0'
assert sql('SELECT count(*) FROM test_results')=='1'
print('PASS one worker claim; wrong attempt denied; unknown delivery not retried; saved result retained')
sql('INSERT INTO test_result_outbox VALUES(gen_random_uuid())',False)
print('PASS outbox cannot reference nonexistent result')
sql((ROOT/'PANEL_ACCESS.sql').read_text())
assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{s}';SELECT count(*) FROM test_results")=='1'
assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{other}';SELECT count(*) FROM test_results")=='0'
print('PASS related specialist reads saved details; unrelated specialist sees zero results')
assert sql("SELECT results->>'maxPossibleScore' FROM test_results")=='1'
assert sql("SELECT results->>'scorePercentage' FROM test_results")=='100'
assert sql("SELECT results ? 'riskLevel' FROM test_results")=='f'
print('PASS option-count maximum and server score consistent; no invented clinical risk')
sql((ROOT/'abuse.sql').read_text())
assert sql("SET ROLE service_role;SELECT consume_test_prepare_budget('"+'b'*64+"','"+'c'*64+"')")=='f'
sql('INSERT INTO test_prepare_limits VALUES(true,3,3600)')
assert sql("SET ROLE service_role;SELECT consume_test_prepare_budget('"+'b'*64+"','"+'c'*64+"')")=='t'
assert sql("SET ROLE service_role;SELECT consume_test_prepare_budget('"+'b'*64+"','"+'c'*64+"')")=='f'
def quota(n):return sql("SET ROLE service_role;SELECT consume_test_prepare_budget('"+'b'*64+"','"+f'{n:064x}'+"')")
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:budgets=list(ex.map(quota,range(20)))
assert budgets.count('t')==2
print('PASS disabled quota fails closed, CAPTCHA proof one-use, 20 concurrent requests obey configured synthetic quota=3')