"""Local synthetic legacy-compatibility test, never connects to production."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).parent
BIN = Path(shutil.which('initdb')).parent
with tempfile.TemporaryDirectory(prefix='role-static-') as tmp:
    os.chmod(tmp, 0o777)
    def pg(*args):
        return subprocess.run(['setpriv', '--reuid=1000', '--regid=1000', '--clear-groups', *map(str, args)], check=True, capture_output=True, text=True)
    pg(BIN / 'initdb', '-D', tmp + '/data', '-U', 'postgres')
    pg(BIN / 'pg_ctl', '-D', tmp + '/data', '-o', f'-p 55443 -k {tmp} -c listen_addresses=', '-l', tmp + '/log', 'start')
    def query(sql):
        return subprocess.run([str(BIN / 'psql'), '-h', tmp, '-p', '55443', '-U', 'postgres', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', sql], check=True, capture_output=True, text=True).stdout.strip()
    try:
        query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; CREATE TABLE public.user_profiles(user_id uuid, role text); INSERT INTO public.user_profiles VALUES ('11111111-1111-4111-8111-111111111111','specialist'), ('22222222-2222-4222-8222-222222222222','admin');")
        query(ROOT.joinpath('candidate.sql').read_text())
        assert query('SET ROLE anon; SELECT public.get_current_user_role()') == 'user'
        assert query("SET ROLE authenticated; SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; SELECT public.get_current_user_role()") == 'specialist'
        assert query("SET ROLE authenticated; SET request.jwt.claim.sub='22222222-2222-4222-8222-222222222222'; SELECT public.get_current_user_role()") == 'admin'
        assert query("SET ROLE authenticated; SET request.jwt.claim.sub='33333333-3333-4333-8333-333333333333'; SELECT public.get_current_user_role()") == 'user'
        assert query("SELECT has_table_privilege('authenticated','public.user_profiles','SELECT')") == 'f'
        print('PASS: anonymous fallback, own specialist, own admin, missing profile, no direct profile grant (5 checks)')
    finally:
        pg(BIN / 'pg_ctl', '-D', tmp + '/data', 'stop', '-m', 'immediate')