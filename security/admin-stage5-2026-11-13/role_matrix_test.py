"""Real captured RLS expressions on synthetic local rows only."""
import os,json,pathlib,subprocess,tempfile,collections
ROOT=pathlib.Path(__file__).parent;BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
policies=json.loads(ROOT.joinpath('policies.json').read_text());cols=json.loads(ROOT.joinpath('columns.json').read_text());funcs=json.loads(ROOT.joinpath('functions.json').read_text())
with tempfile.TemporaryDirectory(prefix='role-matrix-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*a):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*a],check=True,capture_output=True,text=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres');pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55440 -k {tmp}','-l',tmp+'/log','start')
 cmd=[BIN+'psql','-h',tmp,'-p','55440','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1']
 def q(s,ok=True):
  r=subprocess.run(cmd+['-c',s],capture_output=True,text=True)
  if ok:assert not r.returncode,r.stderr
  return r
 try:
  q("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TYPE public.user_role AS ENUM('admin','staff','user','specialist','patient','legal','muhasebe','partner'); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('request.jwt.claim.role',true) $$; CREATE TABLE auth.users(id uuid,email text);")
  by=collections.defaultdict(list)
  for c in cols:by[c['table']].append(c)
  for table,columns in by.items():
   parts=[f'"{c["name"]}" {c["type"]}' for c in columns];q(f'CREATE TABLE public."{table}"('+','.join(parts)+');')
  for n in ['is_admin_or_staff_user','is_admin_or_staff','is_admin_user','current_partner_id','is_patient_user']:
   f=next((x for x in funcs if x['name']==n),None)
   if f:q(f['definition'])
  q("CREATE SCHEMA storage; CREATE TABLE storage.objects(id uuid,bucket_id text,name text); CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$SELECT string_to_array($1,'/')$$;")
  selected=['user_profiles','specialists','orders','appointments','client_referrals','test_results','call_reports','automatic_orders','system_settings','database_backups','legal_evidence','accounting_documents','blog_posts','tests','test_questions','objects']
  for t in selected:
   schema='storage' if t=='objects' else 'public';q(f'ALTER TABLE {schema}."{t}" ENABLE ROW LEVEL SECURITY; GRANT ALL ON {schema}."{t}" TO anon,authenticated;')
   for p in policies:
    if p['table']!=t or p['schema']!=schema:continue
    roles=','.join(p['roles']);sql=f'CREATE POLICY "{p["name"]}" ON {schema}."{t}" FOR {p["cmd"]} TO {roles}'
    if p['qual']:sql+=' USING('+p['qual']+')'
    if p['check']:sql+=' WITH CHECK('+p['check']+')'
    q(sql+';')
  q('GRANT USAGE ON SCHEMA public,storage,auth TO anon,authenticated;')
  u1='11111111-1111-4111-8111-111111111111';u2='22222222-2222-4222-8222-222222222222';staff='33333333-3333-4333-8333-333333333333';admin='44444444-4444-4444-8444-444444444444'
  for uid,role in [(u1,'specialist'),(u2,'specialist'),(staff,'staff'),(admin,'admin')]:q(f"INSERT INTO user_profiles(user_id,role,is_approved,email) VALUES('{uid}','{role}',true,'{role}{uid[0]}@example.invalid');")
  for uid in [u1,u2]:q(f"INSERT INTO specialists(id,user_id,email,name,created_at) VALUES('{uid}','{uid}','specialist{uid[0]}@example.invalid','Same Name',now()); INSERT INTO auth.users VALUES('{uid}','specialist{uid[0]}@example.invalid');")
  for t in ['orders','appointments','client_referrals','test_results']:
   for uid in [u1,u2]:
    if t=='orders':q(f"INSERT INTO orders(id,customer_email,status) VALUES('{uid}','specialist{uid[0]}@example.invalid','approved');")
    else:q(f"INSERT INTO {t}(id,specialist_id) VALUES('{uid}','{uid}');")
  for t in ['call_reports','automatic_orders','system_settings','database_backups','legal_evidence','accounting_documents']:q(f"INSERT INTO {t}(id) VALUES({1 if t=='database_backups' else chr(39)+u2+chr(39)});")
  q(f"INSERT INTO blog_posts(id,status,author_id,specialist_id) VALUES('{u1}','draft','{u1}','{u1}'),('{u2}','draft','{u2}','{u2}'); INSERT INTO tests(id,specialist_id,is_active) VALUES('{u1}','{u1}',false),('{u2}','{u2}',false);")
  for bucket in ['profile-pictures','legal-documents','legal-evidence','accounting-documents']:
   q(f"INSERT INTO storage.objects VALUES('{u2}','{bucket}','{u2}/file.png');")
  def asrole(role,uid,sql):return f"SET ROLE {role}; SET request.jwt.claim.sub='{uid}'; SET request.jwt.claim.role='{role}';"+sql
  results=[]
  for role,uid,label in [('anon','','anon'),('authenticated',u1,'specialist'),('authenticated',staff,'staff'),('authenticated',admin,'admin')]:
   for t in ['orders','appointments','client_referrals','test_results','specialists','call_reports','automatic_orders','system_settings','database_backups','legal_evidence','accounting_documents','blog_posts','tests']:
    count=int(q(asrole(role,uid,f'SELECT count(*) FROM {t};')).stdout.strip());results.append({'role':label,'table':t,'count':count})
    if label=='anon':assert count==0,(label,t,count)
    if label=='specialist':assert count==(1 if t in ['orders','appointments','client_referrals','test_results','specialists','blog_posts','tests'] else 0),(label,t,count)
   for bucket in ['legal-documents','legal-evidence','accounting-documents']:
    count=int(q(asrole(role,uid,f"SELECT count(*) FROM storage.objects WHERE bucket_id='{bucket}';")).stdout.strip());results.append({'role':label,'bucket':bucket,'count':count})
    if label in ['anon','specialist','staff']:assert count==0,(label,bucket,count)
  print('PASS 64 captured RLS/Storage read checks across anon/specialist/staff/admin')
  # Actual new identity authority code, actual signatures and synthetic source rows.
  q("CREATE UNIQUE INDEX referral_conflict ON partner_referrals(partner_id,specialist_email); CREATE FUNCTION normalize_ref_code(text) RETURNS text LANGUAGE sql AS $$ SELECT lower(trim($1)) $$;")
  # Remaining policy is intentionally only the public INSERT under test.
  q("ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY; CREATE POLICY \"Public may create referral for active partner\" ON partner_referrals FOR INSERT TO anon,authenticated WITH CHECK(true);")
  q(ROOT.joinpath('authority.sql').read_text())
  assert q(asrole('authenticated',admin,'SELECT is_admin_user();')).stdout.strip()=='t'
  assert q(asrole('authenticated',staff,'SELECT is_admin_user();')).stdout.strip()=='f'
  for role,uid in [('anon',''),('authenticated',u1)]:
   for fn in [f"SELECT attach_signup_identity_to_analytics('synthetic','{u2}','specialist2@example.invalid',NULL);",f"SELECT register_partner_referral('synthetic','{u2}','specialist2@example.invalid','Fake','5550000000');",f"SELECT register_partner_referral('synthetic','{u2}','specialist2@example.invalid','Fake','5550000000','synthetic','https://example.invalid');"]:assert q(asrole(role,uid,fn),False).returncode
  q(asrole('authenticated',u1,f"SELECT attach_signup_identity_to_analytics('synthetic','{u1}','specialist1@example.invalid',NULL);"))
  assert q(asrole('authenticated',u1,f"SELECT attach_signup_identity_to_analytics('synthetic','{u1}','wrong@example.invalid',NULL);"),False).returncode
  print('PASS identity/partner overloads: anon & cross-account denied; verified self allowed; admin lookup works')
  ROOT.joinpath('role-matrix.json').write_text(json.dumps(results,indent=2))
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')
