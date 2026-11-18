import pathlib,tempfile,os,glob,subprocess,concurrent.futures
b=str(pathlib.Path(glob.glob('/nix/store/*postgresql*/bin/initdb')[0]).parent)+'/'
with tempfile.TemporaryDirectory(prefix='profile-video-synthetic-') as t:
 os.chmod(t,0o777)
 def pg(*args):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],check=True,capture_output=True,text=True)
 pg(b+'initdb','-D',t+'/data','-U','postgres');pg(b+'pg_ctl','-D',t+'/data','-o',f'-p 55459 -k {t}','-l',t+'/log','start')
 def q(s):return subprocess.run([b+'psql','-h',t,'-p','55459','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',s],capture_output=True,text=True)
 def ok(s):
  r=q(s);assert r.returncode==0,r.stderr;return r.stdout.strip()
 try:
  ok("CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text);CREATE TABLE specialists(id uuid PRIMARY KEY,user_id uuid,is_active boolean);CREATE FUNCTION reels_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN NEW.updated_at=now();RETURN NEW;END$$;")
  sql=pathlib.Path('/dev-server/supabase/migrations/20261118111511_f2369b28-04c7-4dcf-a90d-b77ec3904506.sql').read_text();ok(sql)
  sid='22222222-2222-4222-8222-222222222222';uid='11111111-1111-4111-8111-111111111111'
  ok(f"INSERT INTO specialists VALUES('{sid}','{uid}',true);")
  call=f"SELECT reserve_profile_video('{uid}','{sid}','video.mp4','video/mp4',100);"
  assert q('SET ROLE authenticated;'+call).returncode!=0
  assert q("SET ROLE service_role;"+call.replace(uid,'33333333-3333-4333-8333-333333333333')).returncode!=0
  with concurrent.futures.ThreadPoolExecutor(max_workers=12) as p:results=list(p.map(lambda _:q('SET ROLE service_role;'+call),range(12)))
  assert sum(r.returncode==0 for r in results)==6
  assert ok('SELECT count(*) FROM specialist_profile_videos;')=='6'
  print('PASS: 12 concurrent uploads -> exactly 6 reservations; nonowner and authenticated direct calls denied')
 finally:pg(b+'pg_ctl','-D',t+'/data','stop','-m','immediate')
