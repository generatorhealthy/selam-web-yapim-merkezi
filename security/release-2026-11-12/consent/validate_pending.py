"""Run after validate_withdrawal.py on synthetic consent_release only."""
import subprocess,concurrent.futures
from pathlib import Path
def sql(q,ok=True):
 p=subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','consent_release','-X','-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
 if ok and p.returncode:raise AssertionError(p.stderr)
 if not ok and not p.returncode:raise AssertionError('unexpected success')
 return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
sql(Path(__file__).with_name('pending.sql').read_text())
sql('UPDATE verified_consent_documents SET published=true')
created=sql("SET ROLE service_role;SELECT prepare_pending_consents('"+'a'*64+"','"+'b'*64+"','{\"health_test\":false}')")
assert sql(f"SELECT choices->>'health_test' FROM pending_consent_receipts WHERE id='{created}'")=='false'
sql("SET ROLE service_role;SELECT prepare_pending_consents('"+'a'*64+"','"+'b'*64+"','{\"admin\":true}')",False)
print('PASS server prepare selects published version, preserves decline and rejects unknown purpose')
r='00000000-0000-4000-8000-000000000100';u='00000000-0000-4000-8000-000000000101'
sql(f"INSERT INTO pending_consent_receipts(id,email_hash,capability_hash,choices,versions) VALUES('{r}','email','proof','{{\"health_test\":false}}','{{\"health_test\":\"synthetic-v1\"}}')")
query=f"SET ROLE service_role;SELECT finalize_pending_consents('{r}','proof','{u}','email')"
sql(query.replace("'proof'","'wrong'"),False);sql(query.replace("'email'","'other'"),False)
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:results=list(ex.map(lambda _:sql(query),range(20)))
assert set(results)=={'t'}
assert sql(f"SELECT count(*) FROM user_consent_logs WHERE user_id='{u}'")=='1'
assert sql(f"SELECT accepted FROM user_consent_logs WHERE user_id='{u}'")=='f'
assert sql(f"SELECT consumed_by='{u}' FROM pending_consent_receipts WHERE id='{r}'")=='t'
sql(query.replace('service_role','anon'),False)
print('PASS pending receipt wrong proof/email denied; 20 finalizations -> one declined event and atomic consumption; anon denied')