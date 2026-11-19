"""Synthetic local PostgreSQL only. No production connection or SMS calls."""
import os, pathlib, subprocess, tempfile, concurrent.futures
ROOT=pathlib.Path(__file__).parent
with tempfile.TemporaryDirectory(prefix='phone-proof-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*args):return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],check=True,capture_output=True,text=True)
 pg('initdb','-D',tmp+'/data','-U','postgres')
 pg('pg_ctl','-D',tmp+'/data','-o',f'-p 55445 -k {tmp} -c max_connections=50','-l',tmp+'/log','start')
 def q(sql,ok=True):
  r=subprocess.run(['psql','-h',tmp,'-p','55445','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
  if ok:assert r.returncode==0,r.stderr
  return r
 def value(sql):return q(sql).stdout.strip()
 try:
  q("""CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
  CREATE FUNCTION is_admin_or_staff_user() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
  CREATE FUNCTION normalize_phone_digits(text) RETURNS text LANGUAGE sql AS $$ SELECT right(regexp_replace($1,'\\D','','g'),10) $$;
  CREATE TABLE blocked_visitors(full_name text,email text,phone text);
  CREATE TABLE specialists(id uuid,user_id uuid);
  CREATE TABLE appointments(id uuid PRIMARY KEY,specialist_id uuid,patient_name text,patient_email text,patient_phone text,appointment_date date,appointment_time time,appointment_type text,status text,notes text,created_by_specialist boolean,patient_user_id uuid);
  GRANT INSERT ON appointments TO anon,authenticated,service_role;""")
  q(ROOT.joinpath('schema.sql').read_text())
  assert value("SELECT count(*) FROM appointment_phone_release WHERE enabled")=='0'
  q("INSERT INTO appointment_phone_release(enabled) VALUES(true)")
  send=lambda i,phone='905550000000':f"SELECT appointment_phone_send('{i}','{phone}','Synthetic Visitor','visitor@example.invalid','{'a'*64}')"
  cid='11111111-1111-4111-8111-111111111111'
  q(send(cid))
  assert q(send('22222222-2222-4222-8222-222222222222'),False).returncode!=0
  print('PASS resend cooldown atomic')
  for _ in range(5):assert value(f"SELECT appointment_phone_verify('{cid}','{'b'*64}','{'c'*64}')")=='f'
  assert value(f"SELECT appointment_phone_verify('{cid}','{'a'*64}','{'c'*64}')")=='f'
  print('PASS five guesses lock challenge')
  cid2='33333333-3333-4333-8333-333333333333';q(send(cid2,'905550000001'))
  assert value(f"SELECT appointment_phone_verify('{cid2}','{'a'*64}','{'c'*64}')")=='t'
  assert value(f"SELECT appointment_phone_verify('{cid2}','{'a'*64}','{'d'*64}')")=='f'
  print('PASS verification cannot issue another proof')
  import json
  record={'id':'44444444-4444-4444-8444-444444444444','specialist_id':'55555555-5555-4555-8555-555555555555','patient_name':'Synthetic Visitor','patient_email':'visitor@example.invalid','patient_phone':'905550000001','appointment_date':'2099-01-01','appointment_time':'10:00','appointment_type':'online'}
  book=lambda rec:f"SELECT appointment_phone_book('{'c'*64}','{json.dumps(rec)}'::jsonb)"
  wrong={**record,'patient_phone':'905550000002'}
  assert q(book(wrong),False).returncode!=0
  assert value(f"SELECT consumed_at IS NULL FROM appointment_phone_challenges WHERE id='{cid2}'")=='t'
  print('PASS proof bound to phone; failed insert preserves proof')
  assert q("SET ROLE anon; INSERT INTO appointments(id) VALUES(gen_random_uuid())",False).returncode!=0
  assert value("SELECT has_function_privilege('anon','appointment_phone_book(text,jsonb)','execute')")=='f'
  assert value("SELECT has_table_privilege('authenticated','appointment_phone_challenges','select')")=='f'
  print('PASS direct public insert and privileged RPC forbidden; proof table private')
  with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
   outcomes=list(ex.map(lambda _:q(book(record),False),range(20)))
  assert sum(r.returncode==0 for r in outcomes)==1
  assert value('SELECT count(*) FROM appointments')=='1'
  print('PASS 20 concurrent bookings: one proof, one appointment')
  q("INSERT INTO blocked_visitors VALUES('Blocked Visitor','blocked@example.invalid','05550000003')")
  assert q(send('66666666-6666-4666-8666-666666666666','905550000003'),False).returncode!=0
  print('PASS blocked phone cannot spend SMS budget')
 finally:pg('pg_ctl','-D',tmp+'/data','stop','-m','immediate')