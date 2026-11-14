import os,pathlib,subprocess,tempfile,concurrent.futures,json
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='publication-test-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*a):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*a],capture_output=True,text=True,check=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres');pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55454 -k {tmp}','-l',tmp+'/log','start')
 def q(sql):return subprocess.run([BIN+'psql','-h',tmp,'-p','55454','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
 def ok(sql):
  r=q(sql);assert not r.returncode,r.stderr;return r.stdout.strip()
 def deny(sql):assert q(sql).returncode,sql
 try:
  ok("CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('role',true)$$;CREATE FUNCTION is_admin_user() RETURNS boolean LANGUAGE sql AS $$SELECT false$$;CREATE TABLE auth.users(id uuid,email text);CREATE TABLE user_profiles(user_id uuid,role text,is_approved boolean);CREATE TABLE specialists(id uuid PRIMARY KEY,user_id uuid,email text,is_active boolean);CREATE TABLE orders(id uuid,status text,customer_email text,payment_method text,deleted_at timestamptz,amount numeric);CREATE TABLE bank_transfer_verifications(order_id uuid,specialist_id uuid,amount numeric,statement_checked boolean);CREATE TABLE bank_legacy_paid_orders(order_id uuid);CREATE TABLE order_manual_approvals(order_id uuid,specialist_id uuid,active boolean);GRANT ALL ON specialists TO authenticated;")
  ok(ROOT.joinpath('release.sql').read_text())
  ok('CREATE TRIGGER activation BEFORE UPDATE ON specialists FOR EACH ROW EXECUTE FUNCTION require_activation_evidence();')
  sid='11111111-1111-4111-8111-111111111111';uid='22222222-2222-4222-8222-222222222222';aid='33333333-3333-4333-8333-333333333333'
  ok(f"INSERT INTO auth.users VALUES('{uid}','synthetic@example.invalid');INSERT INTO user_profiles VALUES('{aid}','admin',true);INSERT INTO specialists VALUES('{sid}','{uid}','synthetic@example.invalid',false);INSERT INTO orders VALUES('{sid}','pending','synthetic@example.invalid','bank_transfer',null,4000);")
  call=f"SELECT set_specialist_publication_server('{sid}',true,'Explicit administrator permission','{aid}');"
  for role in ['anon','authenticated']:deny(f'SET ROLE {role};'+call)
  deny(f"SET ROLE service_role;SELECT set_specialist_publication_server('{sid}',true,'Forged actor','{uid}');")
  deny(f"SET ROLE authenticated;UPDATE specialists SET is_active=true WHERE id='{sid}';")
  before=ok('SELECT row_to_json(o) FROM orders o;')
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:result=list(pool.map(lambda _:json.loads(ok('SET ROLE service_role;'+call).splitlines()[-1]),range(20)))
  assert sum(not r['duplicate'] for r in result)==1
  assert ok('SELECT is_active FROM specialists')=='t'
  assert ok('SELECT count(*) FROM specialist_publication_events')=='1'
  assert ok('SELECT row_to_json(o) FROM orders o;')==before
  ok(f"SET ROLE service_role;SELECT set_specialist_publication_server('{sid}',false,'Administrator deactivation','{aid}');")
  assert ok('SELECT is_active FROM specialists')=='f'
  assert ok('SELECT row_to_json(o) FROM orders o;')==before
  print('PASS: admin-only, forged actor denied, direct activation denied, 20 concurrent -> 1/19, pending order unchanged, deactivate preserved')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')