"""Isolated Postgres integration test, never connects to production."""
import subprocess,time
from pathlib import Path
root=Path(__file__).parent
def sql(q,ok=True):
 p=subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','priority_test','-X','-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
 if ok and p.returncode: raise AssertionError(p.stderr)
 if not ok and not p.returncode: raise AssertionError('Unauthorized operation unexpectedly succeeded')
 return p.stdout.strip()
def file(f): return sql((root/f).read_text())
file('fixture.sql');file('original.sql')
# Prove the original permission gap ONLY with empty/synthetic local tables, rollback all effects.
sql("BEGIN; SET LOCAL ROLE anon; SELECT public.create_full_database_backup(); ROLLBACK;")
assert sql('SELECT count(*) FROM database_backups')=='0'
print('PASS original anonymous execution reproduced locally; zero surviving rows')
file('migration-draft.sql')
sql("SET ROLE anon; SELECT public.create_full_database_backup();",False)
print('PASS anonymous EXECUTE denied')
for uid,label in [('00000000-0000-4000-8000-000000000002','staff'),('00000000-0000-4000-8000-000000000003','unapproved admin'),('00000000-0000-4000-8000-000000000004','ordinary user')]:
 sql(f"BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='{uid}';SELECT public.create_full_database_backup();ROLLBACK;",False)
 print('PASS',label,'denied in DB')
assert sql('SELECT count(*) FROM database_backups')=='0'
sql("BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';SELECT public.create_full_database_backup('manual','00000000-0000-4000-8000-000000000004','synthetic');COMMIT;")
assert sql("SELECT created_by FROM database_backups LIMIT 1")=='00000000-0000-4000-8000-000000000001'
assert sql("SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename ~ '^backup_[0-9]+_'")=='12'
assert sql('SELECT total_records FROM database_backups LIMIT 1')=='12'
print('PASS approved admin creates same 12-table scope; spoofed actor replaced; row counts retained')
# Test inner guard even if another operator accidentally grants anon EXECUTE later.
sql('GRANT EXECUTE ON FUNCTION public.create_full_database_backup(text,uuid,text) TO anon')
sql('SET ROLE anon;SELECT public.create_full_database_backup();',False)
sql('REVOKE EXECUTE ON FUNCTION public.create_full_database_backup(text,uuid,text) FROM anon')
print('PASS inner DB guard rejects anon despite accidental EXECUTE grant')
time.sleep(1.2)
sql("SELECT public.create_full_database_backup('automatic',NULL,'synthetic cron');")
time.sleep(1.2)
sql("SET ROLE service_role;SELECT public.create_full_database_backup('automatic',NULL,'synthetic server');")
print('PASS postgres scheduler and service_role preserved')
assert sql('SELECT count(*) FROM database_backups')=='3'
assert sql("SELECT count(*) FROM pg_class WHERE relname ~ '^backup_[0-9]+_' AND relrowsecurity")=='36'
assert sql("SELECT count(*) FROM pg_class WHERE relname ~ '^backup_[0-9]+_' AND has_table_privilege('authenticated',oid,'SELECT')")=='36'
print('PASS new table RLS and explicit grants valid; source rows unchanged')
file('safe-rollback.sql')
sql('SET ROLE anon;SELECT public.create_full_database_backup();',False)
assert sql('SELECT count(*) FROM database_backups')=='3'
sql('GRANT EXECUTE ON FUNCTION public.create_full_database_backup(text,uuid,text) TO anon')
sql('SET ROLE anon;SELECT public.create_full_database_backup();',False)
sql('REVOKE EXECUTE ON FUNCTION public.create_full_database_backup(text,uuid,text) FROM anon')
print('PASS safe rollback preserves records and both inner gate and anonymous denial')