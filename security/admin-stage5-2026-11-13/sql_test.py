"""Only synthetic local PostgreSQL; no live connection variables or provider calls."""
import concurrent.futures,json,os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='admin-stage5-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*args):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],check=True,capture_output=True,text=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
 pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55439 -k {tmp} -c max_connections=60','-l',tmp+'/log','start')
 cmd=[BIN+'psql','-h',tmp,'-p','55439','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1']
 def q(s,ok=True):
  r=subprocess.run(cmd+['-c',s],capture_output=True,text=True)
  if ok:assert r.returncode==0,r.stderr
  return r
 try:
  q('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting(\'request.jwt.claim.sub\',true),\'\')::uuid $$; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT current_setting(\'request.jwt.claims\',true)::jsonb $$; CREATE TABLE admin_login_attempts(email text,attempt_count int,is_blocked bool,blocked_until timestamptz,last_attempt_at timestamptz);')
  q(ROOT.joinpath('login.sql').read_text())
  reset='''CREATE FUNCTION reset_admin_login_attempts(p_email text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF auth.uid() IS NULL OR lower(coalesce(auth.jwt()->>'email','')) <> lower(trim(p_email)) THEN RAISE EXCEPTION 'Yetkisiz'; END IF; UPDATE admin_login_attempts SET attempt_count=0,is_blocked=false,blocked_until=NULL,last_attempt_at=now() WHERE email=lower(trim(p_email)); END; $$; REVOKE EXECUTE ON FUNCTION reset_admin_login_attempts(text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION reset_admin_login_attempts(text) TO authenticated;'''
  q(reset)
  q("INSERT INTO admin_login_attempts VALUES('victim@example.invalid',3,true,now()+interval '3 hours',now()),('owner@example.invalid',3,true,now()+interval '3 hours',now());")
  for role in ['anon','authenticated']:
   r=q(f"SET ROLE {role}; SELECT consume_admin_login_challenge(repeat('a',64),now()+interval '5 minutes');",False);assert r.returncode
   assert q(f"SET ROLE {role}; SELECT is_blocked FROM check_admin_login_block('victim@example.invalid');").stdout.strip()=='f'
   assert q(f"SET ROLE {role}; SELECT record_failed_admin_login('victim@example.invalid');",False).returncode
  print('PASS anon/auth cannot consume claims or manufacture account locks; constant lookup')
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
   results=list(ex.map(lambda i:q("SET ROLE service_role; SELECT consume_admin_login_challenge(repeat('a',64),now()+interval '5 minutes');").stdout.strip(),range(20)))
  assert results.count('t')==1 and results.count('f')==19,results
  assert q('SELECT count(*) FROM admin_login_challenge_claims').stdout.strip()=='1'
  print('PASS 20 concurrent nonce claims: 1 accepted/19 rejected')
  assert q("SELECT attempt_count FROM admin_login_attempts WHERE email='victim@example.invalid'").stdout.strip()=='3'
  assert q("SET ROLE authenticated; SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; SET request.jwt.claims='{\"email\":\"owner@example.invalid\"}'; SELECT reset_admin_login_attempts('victim@example.invalid');",False).returncode
  assert q("SET ROLE anon; SELECT reset_admin_login_attempts('owner@example.invalid');",False).returncode
  q("SET ROLE authenticated; SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; SET request.jwt.claims='{\"email\":\"owner@example.invalid\"}'; SELECT reset_admin_login_attempts('OWNER@example.invalid');")
  assert q("SELECT attempt_count FROM admin_login_attempts WHERE email='owner@example.invalid'").stdout.strip()=='0'
  print('PASS verified owner recovery only; victim unchanged')
  assert q("SET ROLE service_role; SELECT consume_admin_login_challenge(repeat('b',64),now()-interval '1 second');").stdout.strip()=='f'
  assert q("SET ROLE service_role; SELECT consume_admin_login_challenge('bad',now()+interval '5 minutes');").stdout.strip()=='f'
  print('PASS expired and malformed receipt rejected')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')
