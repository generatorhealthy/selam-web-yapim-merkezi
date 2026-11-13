"""Actual contact SQL with synthetic local auth.users; no SMS transport."""
import os,pathlib,subprocess,tempfile,concurrent.futures
ROOT=pathlib.Path(__file__).parent; BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='contact-safe-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*a):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*a],check=True,capture_output=True,text=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres');pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55444 -k {tmp}','-l',tmp+'/log','start')
 def q(s):return subprocess.run([BIN+'psql','-h',tmp,'-p','55444','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',s],capture_output=True,text=True)
 def ok(s):
  r=q(s);assert not r.returncode,r.stderr;return r.stdout.strip()
 def reject(s,code):
  r=q(s);assert r.returncode and code in r.stderr,r.stderr
 u='11111111-1111-4111-8111-111111111111';s='22222222-2222-4222-8222-222222222222';other='33333333-3333-4333-8333-333333333333'
 prep=f"SELECT prepare_patient_contact('{u}','{s}',repeat('a',64))";consume=f"SELECT consume_patient_contact('{u}',repeat('a',64))"
 try:
  ok("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('role',true)$$; CREATE TABLE auth.users(id uuid,phone text,phone_confirmed_at timestamptz); CREATE TABLE specialists(id uuid PRIMARY KEY,slug text,name text,specialty text,is_active boolean);")
  ok(f"INSERT INTO auth.users VALUES('{u}','905451234567',NULL),('{other}','905451234567',NULL); INSERT INTO specialists VALUES('{s}','synthetic','Uzman','Psikolog',true)")
  ok(ROOT.joinpath('contact.sql').read_text())
  for role in ['anon','authenticated']:reject(f'SET ROLE {role};'+prep,'permission denied')
  reject('SET ROLE service_role;'+prep,'verified_phone_and_specialist_required')
  ok(f"UPDATE auth.users SET phone_confirmed_at=now() WHERE id='{u}'")
  ok('SET ROLE service_role;'+prep)
  reject('SET ROLE service_role;'+prep,'contact_already_requested')
  reject('SET ROLE service_role;'+f"SELECT consume_patient_contact('{other}',repeat('a',64))",'contact_proof_invalid_or_used')
  reject('SET ROLE service_role;'+f"SELECT prepare_patient_contact('{other}','{s}',repeat('b',64))",'verified_phone_and_specialist_required')
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:res=list(pool.map(lambda _:q('SET ROLE service_role;'+consume),range(20)))
  assert sum(x.returncode==0 for x in res)==1
  assert sum('contact_proof_invalid_or_used' in x.stderr for x in res)==19
  assert ok('SELECT count(*) FROM patient_contact_claims WHERE consumed_at IS NOT NULL')=='1'
  reject('SET ROLE service_role;'+prep,'contact_already_requested')
  ok(f"INSERT INTO specialists VALUES('{other}','synthetic-two','Uzman 2','Psikolog',true)")
  ok('SET ROLE service_role;'+f"SELECT prepare_patient_contact('{u}','{other}',repeat('c',64))")
  ok(f"UPDATE patient_contact_claims SET expires_at=now()-interval '1 second' WHERE specialist_id='{other}'")
  reject('SET ROLE service_role;'+f"SELECT consume_patient_contact('{u}',repeat('c',64))",'contact_proof_invalid_or_used')
  print('PASS contact actual SQL: 5-minute expiry, verified phone ownership, cross-user deny, no stolen-phone budget, persistent single send, 20 requests=1/19')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')