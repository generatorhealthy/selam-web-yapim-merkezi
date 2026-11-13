"""Exact production candidate, isolated PostgreSQL, no external transport."""
import os, pathlib, subprocess, tempfile
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='two-sale-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*args): return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],capture_output=True,text=True,check=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
 pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55442 -k {tmp}','-l',tmp+'/log','start')
 def q(sql): return subprocess.run([BIN+'psql','-h',tmp,'-p','55442','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
 def ok(sql):
  r=q(sql); assert r.returncode==0,r.stderr; return r.stdout.strip()
 def reject(sql,code):
  r=q(sql); assert r.returncode!=0 and code in r.stderr,r.stderr
 try:
  ok("""CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('role',true)$$;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
  CREATE FUNCTION is_admin_or_staff_user() RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.staff',true)='true'$$;
  CREATE TABLE orders(id uuid default gen_random_uuid(),package_type text,amount numeric,package_name text,
  payment_method text default 'bank_transfer',is_first_order boolean default true,subscription_month int default 1,
  parent_order_id uuid,customer_email text default 'new@example.invalid',status text default 'pending',deleted_at timestamptz);
  GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role; GRANT ALL ON orders TO anon,authenticated,service_role;
  INSERT INTO orders(id,package_type,amount,status,customer_email) VALUES('11111111-1111-4111-8111-111111111111','premium',2398,'approved','old@example.invalid');""")
  baseline=ok("SELECT md5(row_to_json(o)::text) FROM orders o")
  ok(ROOT.joinpath('guard.sql').read_text())
  ok('CREATE TRIGGER guard_confirmed_offer_price BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION guard_confirmed_offer_price()')
  count=0
  for role in ['anon','authenticated','service_role']:
   for key,amount in [('ozel-firsat',4000),('kayit-linki',5000)]:
    ok(f"SET ROLE {role}; INSERT INTO orders(package_type,amount) VALUES('{key}',{amount})"); count+=1
    for bad in [0,1,1000,2398,2499,2998,3000,3600,amount-1,amount+1,4000 if amount==5000 else 5000]:
     reject(f"SET ROLE {role}; INSERT INTO orders(package_type,amount) VALUES('{key}',{bad})",'offer_price_mismatch'); count+=1
    assert ok(f"SET ROLE {role}; INSERT INTO orders(package_type,amount) VALUES('{key}',NULL) RETURNING amount").splitlines()[0]==str(amount); count+=1
   for key in ['basic','premium','campaign','campaign-premium','professional','special-offer','discounted','full','constructor']:
    reject(f"SET ROLE {role}; INSERT INTO orders(package_type,amount) VALUES('{key}',4000)",'new_sale_package_not_allowed'); count+=1
   reject(f"SET ROLE {role}; INSERT INTO orders(package_type,amount,payment_method) VALUES('ozel-firsat',4000,'credit_card')",'new_sale_bank_transfer_only'); count+=1
  for role in ['anon','authenticated']:
   reject(f"SET ROLE {role}; INSERT INTO orders(package_type,amount,is_first_order,subscription_month,customer_email) VALUES('premium',2398,false,2,'old@example.invalid')",'renewal_server_evidence_required'); count+=1
  for prefix in ['SET ROLE service_role;', "SET ROLE authenticated; SET test.uid='22222222-2222-4222-8222-222222222222'; SET test.staff='true';", 'RESET ROLE;']:
   ok(prefix+"INSERT INTO orders(package_type,amount,is_first_order,subscription_month,customer_email) VALUES('premium',2398,false,2,'old@example.invalid')"); count+=1
   reject(prefix+"INSERT INTO orders(package_type,amount,is_first_order,subscription_month) VALUES('premium',2398,false,2)",'renewal_server_evidence_required'); count+=1
   reject(prefix+"INSERT INTO orders(package_type,amount) VALUES('premium',2398)",'new_sale_package_not_allowed'); count+=1
  assert ok("SELECT md5(row_to_json(o)::text) FROM orders o WHERE id='11111111-1111-4111-8111-111111111111'")==baseline; count+=1
  ok("UPDATE orders SET status='approved' WHERE package_type='premium' AND is_first_order=false"); count+=1
  print(f'PASS {count} exact SQL new-sale/role/renewal/historical preservation checks')
 finally: pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')
