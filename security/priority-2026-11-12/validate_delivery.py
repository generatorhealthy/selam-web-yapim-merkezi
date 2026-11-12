"""Real SQL concurrency tests on synthetic local database only."""
import subprocess,concurrent.futures
from pathlib import Path
def sql(q,ok=True):
 p=subprocess.run(['psql','-h','/tmp/kvkk-priority-pg','-p','55439','-U','postgres','-d','priority_test','-X','-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
 if ok and p.returncode:raise AssertionError(p.stderr)
 if not ok and not p.returncode:raise AssertionError('Unexpected permission')
 return p.stdout.strip()
sql(Path(__file__).with_name('delivery-draft.sql').read_text())
id='00000000-0000-4000-8000-000000000010'
q=f"SET ROLE service_role;SELECT public.claim_secure_notice('test','{id}','email');"
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
 results=list(ex.map(lambda _:sql(q).splitlines()[-1],range(20)))
tokens=[v for v in results if v and v!='SET']
assert len(tokens)==1,tokens
print('PASS actual Postgres: 20 parallel connections -> one channel claim')
sql(f"SET ROLE anon;SELECT public.claim_secure_notice('test','{id}','email');",False)
sql(f"SET ROLE authenticated;SELECT * FROM public.secure_notice_deliveries;",False)
print('PASS anon RPC and authenticated table reads denied')
assert sql(f"SET ROLE service_role;SELECT public.finish_secure_notice('test','{id}','email','00000000-0000-4000-8000-000000000099','sent');").endswith('f')
assert sql(f"SET ROLE service_role;SELECT public.finish_secure_notice('test','{id}','email','{tokens[0]}','unknown');").endswith('t')
assert sql(q).endswith('SET') or sql(q).splitlines()[-1]=='SET'
print('PASS wrong worker cannot finish; unknown acceptance blocks retry')
assert sql(f"SET ROLE service_role;SELECT public.claim_secure_notice('contact','{id}','sms');").splitlines()[-1]!='SET'
print('PASS different channel remains independently claimable')