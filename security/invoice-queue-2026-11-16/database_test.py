"""Local synthetic predicate tests; never connects to production."""
import os
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).parent
BIN = '/nix/store/wm063nf09jrvk2kxa3hp7dncy5qjxjy0-postgresql-17.11/bin/'
MIGRATION = ROOT.parents[1] / 'supabase/migrations/20261116072813_8ceac769-3aeb-44e8-a018-2eb0370831db.sql'
with tempfile.TemporaryDirectory(prefix='invoice-queue-') as tmp:
    os.chmod(tmp, 0o777)
    def pg(*args):
        subprocess.run(['setpriv', '--reuid=1000', '--regid=1000', '--clear-groups', *args], check=True, capture_output=True)
    pg(BIN+'initdb', '-D', tmp+'/data', '-U', 'postgres')
    pg(BIN+'pg_ctl', '-D', tmp+'/data', '-o', f'-p 55453 -k {tmp}', '-l', tmp+'/log', 'start')
    def query(sql):
        return subprocess.run([BIN+'psql', '-h', tmp, '-p', '55453', '-U', 'postgres', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', sql], check=True, capture_output=True, text=True).stdout.strip()
    try:
        query('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;')
        query(MIGRATION.read_text().split('DO $$')[0])
        results = query(ROOT.joinpath('guard_test.sql').read_text()).splitlines()
        assert len(results) == 7, results
        assert all(row.endswith('|t') for row in results), results
        print('\n'.join(results))
    finally:
        pg(BIN+'pg_ctl', '-D', tmp+'/data', '-m', 'immediate', 'stop')