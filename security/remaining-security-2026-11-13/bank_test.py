"""Exact additive SQL, synthetic local PostgreSQL; no remote transport or real rows."""
import os,pathlib,subprocess,tempfile,concurrent.futures
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='bank-safe-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*a):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*a],check=True,capture_output=True,text=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres');pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55443 -k {tmp}','-l',tmp+'/log','start')
 def q(s):return subprocess.run([BIN+'psql','-h',tmp,'-p','55443','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',s],capture_output=True,text=True)
 def ok(s):
  r=q(s);assert not r.returncode,r.stderr;return r.stdout.strip()
 def reject(s,code):
  r=q(s);assert r.returncode and code in r.stderr,r.stderr
 uid='11111111-1111-4111-8111-111111111111';oid='22222222-2222-4222-8222-222222222222';oid2='33333333-3333-4333-8333-333333333333'
 panel_admin="SET ROLE authenticated; SET test.admin='true'; SET test.uid='44444444-4444-4444-8444-444444444444';"
 admin="SET ROLE service_role;"
 def call(order=oid,ref='BANK-REF-123',amount=4000,checked='true',spec=uid):return f"SELECT confirm_bank_transfer_server('44444444-4444-4444-8444-444444444444','{order}','{spec}','{ref}',{amount},{checked})"
 try:
  ok("""CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
  CREATE FUNCTION is_admin_user() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.admin',true),'false')='true'$$;
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('role',true)$$;
  CREATE TABLE user_profiles(user_id uuid,role text,is_approved boolean);
  CREATE TABLE auth.users(id uuid,email text); CREATE TABLE specialists(id uuid PRIMARY KEY,user_id uuid,email text,is_active boolean,registration_source text);
  CREATE TABLE orders(id uuid PRIMARY KEY,customer_email text,package_type text,payment_method text,status text,payment_status text,amount numeric,deleted_at timestamptz,is_first_order boolean,subscription_month int,approved_by uuid,approved_at timestamptz,updated_at timestamptz);
  GRANT ALL ON orders,specialists TO authenticated,service_role; GRANT USAGE ON SCHEMA auth TO authenticated;
  """)
  ok(f"INSERT INTO auth.users VALUES('{uid}','synthetic@example.invalid'); INSERT INTO specialists VALUES('{uid}','{uid}','synthetic@example.invalid',false,'self_registration'); INSERT INTO orders(id,customer_email,payment_method,status,amount,package_type) VALUES('{oid}','synthetic@example.invalid','bank_transfer','pending',4000,'ozel-firsat'),('{oid2}','synthetic@example.invalid','bank_transfer','pending',5000,'kayit-linki');")
  ok(ROOT.joinpath('bank.sql').read_text())
  ok(ROOT.joinpath('bank-server.sql').read_text())
  ok("INSERT INTO user_profiles VALUES('44444444-4444-4444-8444-444444444444','admin',true)")
  # Mirror actual activation side effect, no notification provider.
  ok("CREATE FUNCTION synthetic_activate() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN UPDATE specialists SET is_active=true WHERE email=NEW.customer_email AND NEW.status='approved'; RETURN NEW; END$$; CREATE TRIGGER synthetic_activate AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION synthetic_activate();")
  for label in ['specialist','staff','anonymous']:
   prefix="SET ROLE authenticated; SET test.admin='false'; SET test.uid='11111111-1111-4111-8111-111111111111';" if label!='anonymous' else 'SET ROLE anon;'
   reject(prefix+call(),'permission denied')
  reject(panel_admin+f"UPDATE orders SET status='approved' WHERE id='{oid}'",'verified_bank_transfer_required')
  reject(panel_admin+f"UPDATE orders SET payment_status='paid' WHERE id='{oid}'",'verified_bank_transfer_required')
  reject(panel_admin+f"UPDATE specialists SET is_active=true WHERE id='{uid}'",'paid_order_activation_required')
  reject(panel_admin+f"UPDATE orders SET payment_method='credit_card',status='approved' WHERE id='{oid}'",'bank_order_identity_immutable')
  reject(panel_admin+f"UPDATE orders SET amount=1 WHERE id='{oid}'",'new_sale_terms_immutable')
  reject(admin+call(amount=1),'bank_order_amount_or_status_mismatch')
  reject(admin+call(checked='false'),'bank_statement_confirmation_required')
  reject(admin+call(spec=oid2),'bank_order_identity_mismatch')
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:results=list(pool.map(lambda _:ok(admin+call()),range(20)))
  assert sum('"confirmed"' in x for x in results)==1,results
  assert sum('already_confirmed' in x for x in results)==19
  assert ok('SELECT count(*) FROM bank_transfer_verifications')=='1'
  assert ok(f"SELECT status||':'||payment_status FROM orders WHERE id='{oid}'")=='approved:paid'
  assert ok(f"SELECT is_active FROM specialists WHERE id='{uid}'")=='t'
  reject(admin+call(order=oid2,amount=5000),'bank_reference_already_used')
  assert ok(f"SELECT status FROM orders WHERE id='{oid2}'")=='pending'
  assert 'confirmed' in ok(admin+call(order=oid2,ref='BANK-REF-5000',amount=5000))
  assert ok(f"SELECT amount FROM bank_transfer_verifications WHERE order_id='{oid2}'")=='5000'
  reject(admin+'INSERT INTO bank_transfer_verifications(order_id,specialist_id,bank_reference,amount,verified_by,statement_checked) '+f"VALUES('{oid2}','{uid}','FORGED-123',5000,'{uid}',true)",'permission denied')
  print('PASS bank: 20 concurrent = 1 confirmation/19 duplicates; role, statement, amount, ownership, activation, reference replay, immutable method and pending preservation')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')