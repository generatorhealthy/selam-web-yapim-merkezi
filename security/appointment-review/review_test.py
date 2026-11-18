"""Minimal synthetic PostgreSQL. No production variables, records or delivery."""
import concurrent.futures, os, pathlib, subprocess, tempfile
ROOT = pathlib.Path(__file__).parent
with tempfile.TemporaryDirectory(prefix='appointment-review-') as tmp:
    os.chmod(tmp, 0o777)
    def pg(*args):
        return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args], check=True, capture_output=True, text=True)
    pg('initdb','-D',tmp+'/data','-U','postgres')
    pg('pg_ctl','-D',tmp+'/data','-o',f'-p 55442 -k {tmp} -c max_connections=50 -c wal_level=logical','-l',tmp+'/log','start')
    def q(sql, ok=True):
        result = subprocess.run(['psql','-h',tmp,'-p','55442','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
        if ok: assert result.returncode == 0, result.stderr
        return result
    def value(sql): return q(sql).stdout.strip()
    admin = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    owner = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    patient = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    record = '11111111-1111-4111-8111-111111111111'
    identity = lambda user: f"SET ROLE authenticated; SET request.jwt.claim.sub='{user}';"
    try:
        q(f"""
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
        CREATE SCHEMA auth; CREATE SCHEMA extensions; CREATE SCHEMA net;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
        CREATE FUNCTION public.is_admin_user() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(auth.uid()='{admin}'::uuid,false) $$;
        CREATE FUNCTION public.is_admin_or_staff_user() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.is_admin_user() $$;
        CREATE FUNCTION extensions.digest(text,text) RETURNS bytea LANGUAGE sql AS $$ SELECT decode(md5($1),'hex') $$;
        CREATE TABLE public.appointments(id uuid PRIMARY KEY, specialist_id uuid,patient_user_id uuid,patient_name text,patient_email text,patient_phone text,appointment_date date,appointment_time time,appointment_type text,notes text,status text DEFAULT 'pending',created_by_specialist boolean DEFAULT false);
        GRANT SELECT,INSERT,UPDATE,DELETE ON public.appointments TO authenticated,anon;
        GRANT USAGE ON SCHEMA auth TO authenticated,anon;
        ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
        CREATE POLICY original_select ON public.appointments FOR SELECT USING(public.is_admin_user() OR specialist_id=auth.uid() OR patient_user_id=auth.uid());
        CREATE POLICY original_update ON public.appointments FOR UPDATE USING(public.is_admin_user() OR specialist_id=auth.uid() OR patient_user_id=auth.uid());
        CREATE POLICY original_delete ON public.appointments FOR DELETE USING(public.is_admin_user() OR specialist_id=auth.uid());
        CREATE POLICY original_insert ON public.appointments FOR INSERT WITH CHECK(true);
        CREATE TABLE specialists(id uuid PRIMARY KEY,name text,email text,phone text,user_id uuid);
        INSERT INTO specialists VALUES('{owner}','Synthetic','owner@example.invalid','05550000000','{owner}');
        CREATE TABLE appointment_notification_authority(appointment_id uuid PRIMARY KEY,token_hash text,expires_at timestamptz);
        CREATE TABLE net.requests(body jsonb);
        CREATE FUNCTION net.http_post(url text,headers jsonb,body jsonb) RETURNS bigint LANGUAGE plpgsql AS $$ BEGIN INSERT INTO net.requests VALUES(body); RETURN 1; END $$;
        CREATE FUNCTION send_appointment_notification_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $fn$
        DECLARE specialist_data RECORD; notification_token text;
        BEGIN
          SELECT * INTO specialist_data FROM specialists WHERE id=NEW.specialist_id;
          IF TG_OP = 'INSERT' THEN
            notification_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
            INSERT INTO appointment_notification_authority VALUES(NEW.id,encode(extensions.digest(notification_token,'sha256'),'hex'),now()+interval '24 hours');
            PERFORM net.http_post(url:='https://example.invalid',headers:='{{}}',body:=jsonb_build_object(
              'appointmentId', NEW.id, 'notificationToken', notification_token,
              'patientName', NEW.patient_name,
              'notes', NEW.notes));
          END IF;
          RETURN NEW;
        END;
        $fn$;
        CREATE FUNCTION notify_specialist_new_appointment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $fn$
        BEGIN
          PERFORM net.http_post(url:='https://example.invalid',headers:='{{}}',body:=jsonb_build_object('push', NEW.id));
          RETURN NEW;
        END;
        $fn$;
        CREATE TRIGGER send_appointment_notification_email_trigger AFTER INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION send_appointment_notification_email();
        CREATE TRIGGER trg_notify_new_appointment AFTER INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION notify_specialist_new_appointment();
        CREATE PUBLICATION supabase_realtime;
        INSERT INTO appointments(id,specialist_id,status) VALUES('22222222-2222-4222-8222-222222222222','{owner}','pending');
        TRUNCATE net.requests;
        """)
        q(ROOT.joinpath('review.sql').read_text())
        assert value("SELECT NOT admin_review_required AND admin_released_at IS NULL AND status='pending' FROM appointments WHERE id='22222222-2222-4222-8222-222222222222'") == 't'
        print('PASS historical pending appointment unchanged')
        q(f"INSERT INTO appointments(id,specialist_id,patient_user_id,status,notes) VALUES('{record}','{owner}','{patient}','confirmed','synthetic clinical text')")
        assert value(f"SELECT admin_review_required AND admin_released_at IS NULL AND status='pending' FROM appointments WHERE id='{record}'") == 't'
        assert value('SELECT count(*) FROM net.requests') == '0'
        assert value('SELECT count(*) FROM appointment_notification_authority WHERE appointment_id=\''+record+'\'') == '0'
        print('PASS public booking pending: no push/email/SMS/WA or capability')
        assert value(identity(owner)+f"SELECT count(*) FROM appointments WHERE id='{record}'") == '0'
        assert value(identity(patient)+f"SELECT count(*) FROM appointments WHERE id='{record}'") == '1'
        assert value(identity(admin)+f"SELECT count(*) FROM appointments WHERE id='{record}'") == '1'
        print('PASS pending row hidden from specialist, visible to patient and admin')
        q(identity(owner)+f"UPDATE appointments SET status='confirmed' WHERE id='{record}'")
        assert value(f"SELECT status FROM appointments WHERE id='{record}'") == 'pending'
        result=q(identity(patient)+f"UPDATE appointments SET status='confirmed' WHERE id='{record}'",False)
        assert result.returncode and 'appointment_review_admin_required' in result.stderr
        result=q(identity(admin)+f"UPDATE appointments SET admin_released_at=now() WHERE id='{record}'",False)
        assert result.returncode and 'appointment_review_fields_immutable' in result.stderr
        print('PASS specialist cannot self-approve; patient and caller release spoof blocked')
        def approve(_): return q(identity(admin)+f"UPDATE appointments SET status='confirmed' WHERE id='{record}' AND status='pending'",False)
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
            results=list(pool.map(approve,range(20)))
        assert all(r.returncode==0 for r in results)
        assert value(f"SELECT admin_released_at IS NOT NULL AND admin_released_by='{admin}'::uuid FROM appointments WHERE id='{record}'") == 't'
        assert value('SELECT count(*) FROM net.requests') == '2'
        assert value(f"SELECT count(*) FROM appointment_notification_authority WHERE appointment_id='{record}'") == '1'
        assert value("SELECT count(*) FROM net.requests WHERE body ? 'notes' OR body ? 'patientName'") == '0'
        assert value(identity(owner)+f"SELECT count(*) FROM appointments WHERE id='{record}'") == '1'
        print('PASS 20 concurrent admin approvals: one release, one email capability, one push, no health payload')
        q(identity(admin)+f"UPDATE appointments SET status='confirmed' WHERE id='{record}'")
        assert value('SELECT count(*) FROM net.requests') == '2'
        print('PASS repeated approval never repeats notifications')
        q(f"INSERT INTO appointments(id,specialist_id,status,created_by_specialist) VALUES('33333333-3333-4333-8333-333333333333','{owner}','pending',true)")
        assert value("SELECT NOT admin_review_required FROM appointments WHERE id='33333333-3333-4333-8333-333333333333'") == 't'
        assert value('SELECT count(*) FROM net.requests') == '4'
        print('PASS specialist-created appointment keeps current behavior')
        q(f"INSERT INTO appointments(id,specialist_id,status) VALUES('44444444-4444-4444-8444-444444444444','{owner}','pending')")
        q(identity(admin)+"UPDATE appointments SET status='cancelled' WHERE id='44444444-4444-4444-8444-444444444444'")
        assert value('SELECT count(*) FROM net.requests') == '4'
        print('PASS rejected site request never reaches specialist notifications')
        assert value("SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='appointments'") == '1'
        print('PASS realtime enabled only behind specialist visibility policy')
    finally:
        pg('pg_ctl','-D',tmp+'/data','stop','-m','immediate')