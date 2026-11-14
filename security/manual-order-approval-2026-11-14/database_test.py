"""Local synthetic PostgreSQL only; no environment credentials or production writes."""
import os,pathlib,subprocess,tempfile,concurrent.futures,json
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='manual-approval-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*a):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*a],capture_output=True,text=True,check=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
 pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55453 -k {tmp}','-l',tmp+'/log','start')
 def q(sql):return subprocess.run([BIN+'psql','-h',tmp,'-p','55453','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
 def ok(sql):
  r=q(sql);assert not r.returncode,r.stderr;return r.stdout.strip()
 def deny(sql):assert q(sql).returncode,sql
 try:
  ok("CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;CREATE FUNCTION is_admin_user() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.admin',true),'false')='true'$$;CREATE TABLE auth.users(id uuid,email text);CREATE TABLE orders(id uuid PRIMARY KEY,customer_email text,status text,payment_method text,payment_status text,deleted_at timestamptz,invoice_sent boolean,invoice_number text,payment_transaction_id text,subscription_reference_code text,amount numeric);CREATE TABLE specialists(id uuid PRIMARY KEY,user_id uuid,email text,is_active boolean);CREATE TABLE bank_transfer_verifications(order_id uuid,specialist_id uuid,amount numeric,statement_checked boolean);CREATE TABLE bank_legacy_paid_orders(order_id uuid);CREATE TABLE payment_receipts(order_id uuid);GRANT USAGE ON SCHEMA auth TO anon,authenticated;GRANT ALL ON orders,specialists TO authenticated;")
  ok(ROOT.joinpath('release.sql').read_text())
  ok("CREATE TRIGGER activation BEFORE INSERT OR UPDATE ON specialists FOR EACH ROW EXECUTE FUNCTION require_activation_evidence();CREATE TABLE effects(kind text);CREATE FUNCTION paid_effect() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN INSERT INTO effects VALUES('invoice'),('paid_month'),('commission'),('email');RETURN NEW;END$$;CREATE TRIGGER paid AFTER UPDATE ON orders FOR EACH ROW WHEN(NEW.status='approved') EXECUTE FUNCTION paid_effect();")
  oid='11111111-1111-4111-8111-111111111111';sid='22222222-2222-4222-8222-222222222222';uid='33333333-3333-4333-8333-333333333333'
  ok(f"INSERT INTO auth.users VALUES('{uid}','owner@example.invalid');INSERT INTO specialists VALUES('{sid}','{uid}','owner@example.invalid',false);INSERT INTO orders VALUES('{oid}','owner@example.invalid','pending','bank_transfer','pending',null,false,null,null,null,4000);")
  admin=f"SET ROLE authenticated;SET test.uid='{uid}';SET test.admin='true';"
  call=f"SELECT set_manual_order_approval('{oid}','approve','Manual commercial permission');"
  for role in ['anon','authenticated','service_role']:
   deny(f"SET ROLE {role};{call}")
  deny(admin+f"SELECT set_manual_order_approval('{oid}','approve','x');")
  deny(f"SET ROLE authenticated;INSERT INTO order_manual_approvals(order_id,specialist_id,approved_by,reason)VALUES('{oid}','{sid}','{uid}','forged');")
  deny(f"SET ROLE authenticated;UPDATE specialists SET is_active=true WHERE id='{sid}';")
  before=ok(f"SELECT row_to_json(o) FROM orders o WHERE id='{oid}';")
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool: results=list(pool.map(lambda _:json.loads(ok(admin+call).splitlines()[-1]),range(20)))
  assert sum(not r['duplicate'] for r in results)==1
  assert ok(f"SELECT is_active FROM specialists WHERE id='{sid}'")=='t'
  assert ok('SELECT count(*) FROM effects')=='0'
  assert before==ok(f"SELECT row_to_json(o) FROM orders o WHERE id='{oid}';")
  assert ok('SELECT count(*) FROM order_manual_approval_events')=='1'
  ok(admin+f"SELECT set_manual_order_approval('{oid}','pending','Return to awaiting transfer');")
  assert ok('SELECT active FROM order_manual_approvals')=='f'
  assert ok(f"SELECT is_active FROM specialists WHERE id='{sid}'")=='t'
  assert before==ok(f"SELECT row_to_json(o) FROM orders o WHERE id='{oid}';")
  assert json.loads(ok(admin+f"SELECT set_manual_order_approval('{oid}','pending','Repeated pending request');").splitlines()[-1])['duplicate']
  ok(f"INSERT INTO bank_transfer_verifications VALUES('{oid}','{sid}',4000,true);UPDATE orders SET status='approved',payment_status='paid' WHERE id='{oid}';")
  assert ok('SELECT count(*) FROM effects')=='4'
  deny(admin+call)
  print('PASS: admin-only, forged permission rejected, activation gate, 20 concurrent -> 1 approval/19 duplicates, unchanged order, no invoice/paid-month/commission/email, pending retains profile, real bank approval preserved')
 finally:pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')