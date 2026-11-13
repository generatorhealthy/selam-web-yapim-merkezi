"""Minimal synthetic PostgreSQL; no historical replay or production/provider connection."""
import os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).parent
BIN='/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
with tempfile.TemporaryDirectory(prefix='appointment-authority-') as tmp:
 os.chmod(tmp,0o777)
 def pg(*args): return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],capture_output=True,text=True,check=True)
 pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
 pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55441 -k {tmp}','-l',tmp+'/log','start')
 def q(sql,ok=True):
  r=subprocess.run([BIN+'psql','-h',tmp,'-p','55441','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
  if ok: assert r.returncode==0,r.stderr
  return r
 try:
  # Hash provider is a synthetic stand-in; production uses extensions.digest.
  q("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA extensions; CREATE FUNCTION extensions.digest(text,text) RETURNS bytea LANGUAGE sql AS $$ SELECT decode(md5($1),'hex') $$; CREATE TABLE appointments(id uuid PRIMARY KEY); CREATE SCHEMA net; CREATE TABLE net.requests(body jsonb); CREATE FUNCTION net.http_post(url text,headers jsonb,body jsonb) RETURNS bigint LANGUAGE plpgsql AS $$ BEGIN INSERT INTO net.requests VALUES(body); RETURN 1; END $$;")
  q("CREATE FUNCTION send_appointment_notification_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE specialist_data RECORD; BEGIN IF TG_OP = 'INSERT' THEN PERFORM net.http_post(url:='https://example.invalid',headers:='{}',body:=jsonb_build_object('appointmentId', NEW.id, 'preserved',true)); END IF; RETURN NEW; END $$; CREATE TRIGGER notify AFTER INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION send_appointment_notification_email();")
  q(ROOT.joinpath('appointment-authority.sql').read_text())
  q("INSERT INTO appointments VALUES('11111111-1111-4111-8111-111111111111')")
  assert q("SELECT count(*) FROM appointment_notification_authority").stdout.strip()=='1'
  assert q("SELECT (body->>'preserved')::boolean AND length(body->>'notificationToken')=64 FROM net.requests").stdout.strip()=='t'
  assert q("SET ROLE anon; SELECT * FROM appointment_notification_authority",False).returncode
  assert q("SET ROLE authenticated; SELECT verify_appointment_notification_authority('11111111-1111-4111-8111-111111111111','forged')",False).returncode
  assert q("SET ROLE service_role; SELECT verify_appointment_notification_authority('11111111-1111-4111-8111-111111111111',(SELECT token_hash FROM appointment_notification_authority))").stdout.strip()=='t'
  assert q("SET ROLE service_role; SELECT verify_appointment_notification_authority('22222222-2222-4222-8222-222222222222',(SELECT token_hash FROM appointment_notification_authority))").stdout.strip()=='f'
  q("UPDATE appointment_notification_authority SET expires_at=now()-interval '1 second'")
  assert q("SET ROLE service_role; SELECT verify_appointment_notification_authority('11111111-1111-4111-8111-111111111111',(SELECT token_hash FROM appointment_notification_authority))").stdout.strip()=='f'
  print('PASS 7 SQL authority/trigger/role/expiry checks; no external transport')
 finally: pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')