"""Run exact candidate trigger on synthetic local rows, with no provider or live credentials."""
import os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='offer-price-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*args): return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],capture_output=True,text=True,check=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
 pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55442 -k {tmp}','-l',tmp+'/log','start')
 def q(sql): return subprocess.run([BIN+'psql','-h',tmp,'-p','55442','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
 try:
  assert q("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('role',true)$$; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$; CREATE FUNCTION is_admin_or_staff_user() RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.staff',true)='true'$$; CREATE TABLE orders(package_type text,amount numeric); GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role; GRANT ALL ON orders TO anon,authenticated,service_role; INSERT INTO orders VALUES('ozel-firsat',1234);").returncode==0
  assert q(ROOT.joinpath('offer-price-guard.sql').read_text()).returncode==0
  for key,amount in [('ozel-firsat',4000),('kayit-linki',5000)]:
   for role in ['anon','authenticated']:
    assert q(f"SET ROLE {role}; INSERT INTO orders VALUES('{key}',{amount});").returncode==0
    for bad in [1,0,-1,amount-1,amount+1,'NULL']:
     assert q(f"SET ROLE {role}; INSERT INTO orders VALUES('{key}',{bad});").returncode!=0,(key,role,bad)
  assert q("SELECT count(*) FROM orders WHERE package_type='ozel-firsat' AND amount=1234").stdout.strip()=='1'
  assert q("SET ROLE service_role; INSERT INTO orders VALUES('ozel-firsat',1234)").returncode==0
  assert q("SET ROLE authenticated; SET test.uid='11111111-1111-4111-8111-111111111111'; SET test.staff='true'; INSERT INTO orders VALUES('ozel-firsat',1234)").returncode==0
  assert q("SET ROLE anon; INSERT INTO orders VALUES('unresolved-legacy',1234)").returncode==0
  print('PASS 32 concrete price/role/legacy preservation checks; unresolved other routes explicitly remain unprotected')
 finally: pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')