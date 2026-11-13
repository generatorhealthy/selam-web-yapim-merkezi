"""Synthetic local PostgreSQL only: no application/provider or production variables."""
import concurrent.futures, json, os, pathlib, subprocess, tempfile
ROOT = pathlib.Path(__file__).parent
with tempfile.TemporaryDirectory(prefix='appointment-guards-') as tmp:
    os.chmod(tmp, 0o777)
    def pg(*args):
        return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],check=True,capture_output=True,text=True)
    pg('initdb','-D',tmp+'/data','-U','postgres')
    pg('pg_ctl','-D',tmp+'/data','-o',f'-p 55437 -k {tmp} -c max_connections=60','-l',tmp+'/log','start')
    cmd=['psql','-h',tmp,'-p','55437','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1']
    def query(s, ok=True):
        r=subprocess.run(cmd+['-c',s],capture_output=True,text=True)
        if ok: assert r.returncode==0,r.stderr
        return r
    def insert(phone='5550000000', email='one@example.invalid', time='10:00', date='2099-01-01', status='pending', role='anon', extra=''):
        return f"SET request.jwt.claims='{json.dumps({'role':role})}'; INSERT INTO appointments(specialist_id,patient_phone,patient_email,appointment_date,appointment_time,status{',created_at' if extra else ''}) VALUES('11111111-1111-4111-8111-111111111111','{phone}','{email}','{date}','{time}','{status}'{','+extra if extra else ''});"
    def reject(label,s,reason):
        r=query(s,False); assert r.returncode and reason in r.stderr,(label,r.stderr)
        print('PASS',label)
    try:
        query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE TABLE specialists(id uuid primary key,available_time_slots jsonb); CREATE TABLE appointments(id uuid primary key default gen_random_uuid(),specialist_id uuid,patient_phone text,patient_email text,appointment_date date,appointment_time time,status text,created_at timestamptz default now()); CREATE UNIQUE INDEX confirmed ON appointments(specialist_id,appointment_date,appointment_time) WHERE status='confirmed'; INSERT INTO specialists VALUES('11111111-1111-4111-8111-111111111111', '{\"default\":[\"10:00\",\"11:00\"],\"dates\":{\"2099-01-02\":[],\"2099-01-03\":[\"11:00\"]}}');")
        query(ROOT.joinpath('guard.sql').read_text())
        reject('dated closed day',insert(date='2099-01-02'),'appointment_slot_unavailable')
        reject('default closed hour',insert(time='12:00'),'appointment_slot_unavailable')
        reject('dated override replaces defaults',insert(date='2099-01-03'),'appointment_slot_unavailable')
        reject('past Istanbul time',insert(date='2000-01-01'),'appointment_slot_in_past')
        reject('seconds cannot bypass slot',insert(time='10:00:01'),'appointment_slot_unavailable')
        query(insert(status='cancelled',role='service_role'))
        query(insert(status='confirmed',phone='5550000001',role='service_role'))
        reject('confirmed slot taken',insert(phone='5550000002'),'appointment_slot_taken')
        print('PASS cancelled appointment does not close slot')
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
            results=list(ex.map(lambda i:query(insert(phone=f'555{i:07d}',email=f'{i}@example.invalid',date='2099-02-01',status='confirmed'),False),range(20)))
        assert sum(r.returncode==0 for r in results)==1
        assert query("SELECT count(*) FROM appointments WHERE appointment_date='2099-02-01' AND status='confirmed'").stdout.strip()=='1'
        print('PASS 20 concurrent confirmed: 1 accepted, 19 rejected, 1 confirmed row')
        # All clients have the same forged proxy header: unused by the guard.
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
            results=list(ex.map(lambda i:query("SET request.headers='{\"x-forwarded-for\":\"203.0.113.1\"}';"+insert(phone=f'556{i:07d}',email=f'house{i}@example.invalid',date='2099-03-01'),False),range(20)))
        assert all(r.returncode==0 for r in results)
        print('PASS same IP 20 different contacts: 20 accepted')
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
            results=list(ex.map(lambda i:query(insert(phone='5570000000',email='burst@example.invalid',date=f'2099-04-{i+1:02d}'),False),range(20)))
        assert sum(r.returncode==0 for r in results)==6
        assert all(r.returncode==0 or 'appointment_retry_later' in r.stderr for r in results)
        print('PASS 20 same contact burst: 6 accepted, 14 delayed')
        query("UPDATE appointments SET created_at=now()-interval '11 minutes' WHERE patient_email='burst@example.invalid'")
        query(insert(phone='5570000000',email='burst@example.invalid',date='2099-05-01'))
        print('PASS legitimate later date after window accepted')
        for i in range(13): query(insert(phone='5570000000',email='burst@example.invalid',date=f'2099-06-{i+1:02d}',role='service_role'))
        reject('hour cap independent of IP',insert(phone='5570000000',email='burst@example.invalid',date='2099-07-01'),'appointment_retry_later')
        reject('client cannot backdate to bypass window',insert(phone='5570000000',email='burst@example.invalid',date='2099-07-02',extra="'2000-01-01'"),'appointment_retry_later')
        query("UPDATE appointments SET status='cancelled' WHERE appointment_date='2099-02-01'")
        query("UPDATE specialists SET available_time_slots='{\"default\":[\"11:00\"],\"dates\":{}}'")
        reject('panel default change applied on server',insert(date='2099-08-01'),'appointment_slot_unavailable')
        query("UPDATE specialists SET available_time_slots='[]'")
        query(insert(date='2099-08-02'))
        print('PASS legacy empty array matches UI fallback')
        assert query("SELECT has_function_privilege('anon','guard_anonymous_appointment_burst()','execute')").stdout.strip()=='f'
        print('PASS guard cannot be invoked by anon')
    finally: pg('pg_ctl','-D',tmp+'/data','stop','-m','immediate')