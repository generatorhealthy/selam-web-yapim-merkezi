import os, pathlib, subprocess, tempfile, glob, concurrent.futures, json
ROOT=pathlib.Path(__file__).parent
BIN=str(pathlib.Path(glob.glob('/nix/store/*postgresql*/bin/initdb')[0]).parent)+'/'
with tempfile.TemporaryDirectory(prefix='reels-synthetic-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*a): return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*a],capture_output=True,text=True,check=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres');pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55458 -k {tmp}','-l',tmp+'/log','start')
 def q(sql):return subprocess.run([BIN+'psql','-h',tmp,'-p','55458','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
 def ok(sql):
  r=q(sql);assert r.returncode==0,r.stderr;return r.stdout.strip()
 def deny(sql):assert q(sql).returncode!=0,sql
 uid='11111111-1111-4111-8111-111111111111';sid='22222222-2222-4222-8222-222222222222'
 try:
  ok("CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE SCHEMA storage;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;CREATE FUNCTION is_admin_user() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('synthetic.admin',true),'false')='true'$$;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE TABLE user_profiles(user_id uuid,role text,is_approved boolean);CREATE TABLE specialists(id uuid PRIMARY KEY,user_id uuid,email text,name text,profile_picture text,slug text,is_active boolean);CREATE TABLE orders(id uuid PRIMARY KEY,customer_email text,status text,deleted_at timestamptz);CREATE TABLE storage.objects(id uuid);ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;ALTER TABLE orders ENABLE ROW LEVEL SECURITY;ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;GRANT ALL ON specialists,orders,user_profiles,storage.objects TO authenticated;GRANT USAGE ON SCHEMA auth,storage TO authenticated;CREATE POLICY broad_specialists ON specialists FOR ALL TO authenticated USING(true) WITH CHECK(true);CREATE POLICY broad_orders ON orders FOR ALL TO authenticated USING(true) WITH CHECK(true);CREATE POLICY broad_profiles ON user_profiles FOR ALL TO authenticated USING(true) WITH CHECK(true);CREATE POLICY broad_storage ON storage.objects FOR ALL TO authenticated USING(true) WITH CHECK(true);")
  ok('ALTER TABLE specialists ADD specialty text;');ok(ROOT.joinpath('access.sql').read_text());ok(ROOT.joinpath('content.sql').read_text())
  ok(f"INSERT INTO auth.users VALUES('{uid}');INSERT INTO reels_team_members(user_id) VALUES('{uid}');INSERT INTO user_profiles VALUES('{uid}','user',false);INSERT INTO specialists VALUES('{sid}','{uid}','test@example.invalid','Synthetic Person',null,'synthetic-person',false,'Psikolog');INSERT INTO orders VALUES('{sid}','test@example.invalid','pending',null);")
  team=f"SET ROLE authenticated;SET request.jwt.claim.sub='{uid}';"
  assert ok(team+'SELECT has_reels_team_access();')=='t'
  for table in ['specialists','orders','storage.objects']:assert ok(team+f'SELECT count(*) FROM {table};')=='0'
  assert ok(team+"WITH x AS (UPDATE user_profiles SET role='admin' RETURNING *) SELECT count(*) FROM x;")=='0'
  deny(team+f"INSERT INTO reels_team_members(user_id) VALUES('{sid}');")
  deny(team+'SELECT reels_sync_jobs(false);');deny(team+'SELECT reels_claim_notice();')
  assert ok('SET ROLE service_role;SELECT reels_sync_jobs(false);')=='0'
  ok(f"UPDATE specialists SET is_active=true WHERE id='{sid}';")
  assert ok('SET ROLE service_role;SELECT reels_sync_jobs(false);')=='1'
  assert ok('SET ROLE service_role;SELECT reels_sync_jobs(false);')=='0'
  deny(team+f"SELECT reels_list_jobs_server('{uid}');")
  rows=json.loads(ok(f"SET ROLE service_role;SELECT reels_list_jobs_server('{uid}');"));assert len(rows)==1 and rows[0]['name']=='Synthetic Person'
  assert 'email' not in rows[0] and 'phone' not in rows[0]
  assert ok(team+'SELECT count(*) FROM reels_videos;')=='0'
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
   results=list(pool.map(lambda _:ok('SET ROLE service_role;SELECT reels_claim_notice();'),range(20)))
  assert sum(bool(r) for r in results)==1,results
  assert ok('SELECT notice_status FROM reels_jobs;')=='unknown'
  assert ok('SELECT status FROM orders;')=='pending'
  assert ok('SET ROLE service_role;SELECT reels_claim_notice();')==''
  ok(f"UPDATE reels_team_members SET active=false WHERE user_id='{uid}';")
  deny(f"SET ROLE service_role;SELECT reels_list_jobs_server('{uid}');")
  print('PASS: pending+active only, minimized list, table/storage isolation, role escalation denied, 20 parallel -> 1 claim, no unknown retry, payment unchanged, revocation')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')