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
  q("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; CREATE TABLE user_profiles(user_id uuid,role text,is_approved bool); CREATE FUNCTION is_admin_user() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=auth.uid() AND role='admin' AND is_approved)$$; CREATE TABLE database_backups(id bigint,backup_timestamp timestamptz,tables_backed_up text[],backup_status text); CREATE TABLE synthetic_table(id int); INSERT INTO synthetic_table VALUES(1);")
  q(pathlib.Path('security/bulk-security-2026-11-13/restore-current.sql').read_text())
  q("REVOKE ALL ON FUNCTION restore_from_backup(bigint,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION restore_from_backup(bigint,text) TO authenticated,service_role; GRANT USAGE ON SCHEMA auth TO authenticated;")
  for role in ['user','specialist','staff','admin']:
   uid={'user':'11111111-1111-4111-8111-111111111111','specialist':'22222222-2222-4222-8222-222222222222','staff':'33333333-3333-4333-8333-333333333333','admin':'44444444-4444-4444-8444-444444444444'}[role]
   q(f"INSERT INTO user_profiles VALUES('{uid}','{role}',true)")
   r=q(f"SET ROLE authenticated; SET request.jwt.claim.sub='{uid}'; SELECT restore_from_backup(-1,'synthetic_table');",False)
   assert r.returncode
   assert ('Backup not found' if role=='admin' else 'admin role required') in r.stderr,(role,r.stderr)
  assert q("SET ROLE anon; SELECT restore_from_backup(-1,'synthetic_table');",False).returncode
  assert q("SELECT count(*) FROM synthetic_table").stdout.strip()=='1'
  print('PASS 5 actual restore authority checks; authorized admin reaches missing-backup validation; no restore executed')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')
