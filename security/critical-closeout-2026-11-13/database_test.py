"""Synthetic, local PostgreSQL only. Never connects to production."""
import os,pathlib,subprocess,tempfile,concurrent.futures
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='delivery-safe-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*args):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],check=True,capture_output=True,text=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
 pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55449 -k {tmp}','-l',tmp+'/log','start')
 def q(sql):return subprocess.run([BIN+'psql','-h',tmp,'-p','55449','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
 def ok(sql):
  r=q(sql);assert not r.returncode,r.stderr;return r.stdout.strip()
 try:
  ok("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE appointments(id uuid PRIMARY KEY); CREATE FUNCTION is_admin_user() RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.admin',true)='true'$$; CREATE TABLE form_contents(form_type text,content text); GRANT SELECT ON form_contents TO anon,authenticated; ALTER TABLE form_contents ENABLE ROW LEVEL SECURITY; CREATE POLICY \"Anyone can read form contents\" ON form_contents FOR SELECT TO anon,authenticated USING(true);")
  migrations=pathlib.Path('supabase/migrations')
  ok(migrations.joinpath('20261113173901_7abdd579-297c-4201-815c-37302feb5d29.sql').read_text())
  latest=sorted(migrations.glob('20261113*.sql'))[-1]
  sql=latest.read_text();assert 'ALTER POLICY "Anyone can read form contents"' in sql
  ok(sql)
  id='11111111-1111-4111-8111-111111111111'
  ok(f"INSERT INTO appointments VALUES('{id}'); INSERT INTO form_contents VALUES('pre_info','public template'),('private','synthetic private');")
  for role in ['anon','authenticated']:
   r=q(f"SET ROLE {role}; INSERT INTO appointment_delivery_claims(appointment_id,channel) VALUES('{id}','patient_confirmation_email');")
   assert r.returncode and 'permission denied' in r.stderr
   assert ok(f"SET ROLE {role}; SET test.admin='false'; SELECT count(*) FROM form_contents;")=='1'
  assert ok("SET ROLE authenticated; SET test.admin='true'; SELECT count(*) FROM form_contents;")=='2'
  def claim(_):return q(f"SET ROLE service_role; INSERT INTO appointment_delivery_claims(appointment_id,channel) VALUES('{id}','patient_confirmation_email') ON CONFLICT DO NOTHING RETURNING appointment_id;").stdout.strip()
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:results=list(pool.map(claim,range(20)))
  assert sum(bool(x) for x in results)==1,results
  assert ok('SELECT count(*) FROM appointment_delivery_claims')=='1'
  print('Local database: 20 simultaneous claims -> 1 acquired, 19 duplicates; anonymous/authenticated writes denied; public template/admin private reads passed')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')