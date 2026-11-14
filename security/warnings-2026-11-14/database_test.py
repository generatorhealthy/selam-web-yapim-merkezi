"""Only local synthetic PostgreSQL; no production/env DB connection or migration replay."""
import os,pathlib,subprocess,tempfile,concurrent.futures
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='warning-guards-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*a):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*a],capture_output=True,text=True,check=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
 pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55451 -k {tmp}','-l',tmp+'/log','start')
 def q(sql):return subprocess.run([BIN+'psql','-h',tmp,'-p','55451','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
 def ok(sql):
  r=q(sql);assert not r.returncode,r.stderr;return r.stdout.strip()
 def deny(sql):assert q(sql).returncode,sql
 try:
  ok("CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth TO anon,authenticated;CREATE FUNCTION public.is_admin_or_staff_user() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.admin',true),'false')='true'$$;CREATE TABLE specialists(id uuid,user_id uuid);CREATE TABLE appointments(id uuid PRIMARY KEY,specialist_id uuid,status text,created_by_specialist boolean,patient_user_id uuid);GRANT ALL ON appointments TO anon,authenticated,service_role;CREATE TABLE support_tickets(id uuid PRIMARY KEY,created_at timestamptz DEFAULT now());")
  ok(ROOT.joinpath('candidates/guards.sql').read_text())
  spec='11111111-1111-4111-8111-111111111111';owner='22222222-2222-4222-8222-222222222222';other='33333333-3333-4333-8333-333333333333'
  ok(f"INSERT INTO specialists VALUES('{spec}','{owner}');INSERT INTO appointments VALUES('{spec}','{spec}','confirmed',true,null);INSERT INTO support_tickets VALUES('{spec}',now());")
  for role in ['anon','authenticated']:
   for status in ['confirmed','approved','completed','cancelled']:
    deny(f"SET ROLE {role};INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','{status}',false,null);")
   deny(f"SET ROLE {role};INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','pending',true,null);")
   deny(f"SET ROLE {role};INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','pending',false,'{other}');")
   ok(f"SET ROLE {role};INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','pending',false,null);")
  ok(f"SET ROLE authenticated;SET test.uid='{owner}';INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','confirmed',true,null);")
  deny(f"SET ROLE authenticated;SET test.uid='{other}';INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','confirmed',true,null);")
  ok(f"SET ROLE authenticated;SET test.uid='{other}';SET test.admin='true';INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','confirmed',true,null);")
  ok(f"SET ROLE service_role;INSERT INTO appointments VALUES(gen_random_uuid(),'{spec}','confirmed',true,null);")
  assert ok(f"SELECT status FROM appointments WHERE id='{spec}'")=='confirmed'
  for role in ['anon','authenticated']:
   for table in ['support_notification_claims','lead_session_authority','panel_sms_claims']:deny(f'SET ROLE {role};SELECT * FROM {table};')
  def claim(_):return ok(f"SET ROLE service_role;INSERT INTO support_notification_claims(ticket_id)VALUES('{spec}')ON CONFLICT DO NOTHING RETURNING ticket_id;")
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:results=list(pool.map(claim,range(20)))
  assert sum(bool(x) for x in results)==1
  def smsclaim(_):return ok(f"SET ROLE service_role;INSERT INTO panel_sms_claims(request_id,user_id,specialist_id,payload_hash)VALUES('{spec}','{owner}','{spec}','synthetic')ON CONFLICT DO NOTHING RETURNING request_id;")
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:results=list(pool.map(smsclaim,range(20)))
  assert sum(bool(x) for x in results)==1
  ok("CREATE SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;CREATE TABLE lead_attribution(anonymous_session_id text UNIQUE,user_id uuid,first_touch jsonb,last_touch jsonb,is_test boolean,last_visit_at timestamptz);CREATE TABLE analytics_events(event_id text UNIQUE,user_id uuid,anonymous_session_id text,event_name text,event_properties jsonb,utm_source text,utm_campaign text,utm_content text,meta_campaign_id text,meta_adset_id text,meta_ad_id text,fbc text,fbp text,is_test boolean);")
  ok(ROOT.joinpath('candidates/lead-authority.sql').read_text())
  sid='ls_'+spec;token='a'*64
  ok(f"INSERT INTO lead_session_authority VALUES('{sid}',encode(extensions.digest('{token}','sha256'),'hex'),now()+interval '1 day');INSERT INTO lead_attribution VALUES('legacy',null,'{{}}','{{\"preserved\":true}}',false,now());")
  for role in ['anon','authenticated']:
   deny(f"SET ROLE {role};SELECT track_lead_event('legacy','registration_started');")
   deny(f"SET ROLE {role};SELECT track_verified_lead_event('{sid}','{token}',null,'registration_started','one');")
  deny(f"SET ROLE service_role;SELECT track_verified_lead_event('{sid}','forged',null,'registration_started','one');")
  ok(f"SET ROLE service_role;SELECT track_verified_lead_event('{sid}','{token}','{owner}','registration_started','one');")
  deny(f"SET ROLE service_role;SELECT track_verified_lead_event('{sid}','{token}','{other}','registration_started','two');")
  assert ok("SELECT last_touch->>'preserved' FROM lead_attribution WHERE anonymous_session_id='legacy'")=='true'
  assert ok("SELECT count(*) FROM analytics_events")=='1'
  ok(f"UPDATE lead_session_authority SET expires_at=now()-interval '1 second' WHERE session_id='{sid}';")
  deny(f"SET ROLE service_role;SELECT track_verified_lead_event('{sid}','{token}','{owner}','registration_started','three');")
  print('PASS: 36 local SQL checks; 20 support + 20 SMS claims -> one each; unauthorized confirmation/identity rejected; owning specialist/admin/service preserved; old rows untouched; lead token/owner/expiry enforced')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')
