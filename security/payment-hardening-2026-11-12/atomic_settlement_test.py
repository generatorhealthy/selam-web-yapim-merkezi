"""20 local connections: no providers, real users or production credentials."""
import pathlib,subprocess,concurrent.futures,json
CMD=['psql','-h','/tmp/dko-payment-pg/socket','-p','55441','-U','postgres','-d','postgres','-X','-v','ON_ERROR_STOP=1','-Atc']
def run(q):return subprocess.run(CMD+[q],capture_output=True,text=True)
def sql(q):
 r=run(q);assert r.returncode==0,r.stderr;return r.stdout.strip()
sql('ALTER TABLE public.orders ADD COLUMN amount numeric, ADD COLUMN payment_method text;')
sql(pathlib.Path(__file__).with_name('atomic-settlement.sql').read_text())
oid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
sql(f"INSERT INTO public.orders(id,customer_email,amount) VALUES('{oid}','one@example.invalid',4000)")
def call(charge='charge-1',order=oid,amount=4000,currency='TRY',email='one@example.invalid'):
 return f"SELECT public.commit_verified_payment('{order}','{charge}','sub-1','customer-1','{email}',{amount},'{currency}','2026-11-12T00:00:00Z')"
for label,q in [('wrong owner',call(email='two@example.invalid')),('wrong amount',call(amount=3999)),('wrong currency',call(currency='USD'))]:
 assert run(q).returncode!=0,label;print('PASS',label)
assert run("SET ROLE authenticated; SET request.jwt.claim.role='authenticated'; "+call()).returncode!=0;print('PASS untrusted proof caller')
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:results=list(pool.map(lambda _:sql(call()),range(20)))
actions=[json.loads(r)['action'] for r in results]
assert actions.count('applied')==1 and actions.count('duplicate')==19,actions
assert sql('SELECT count(*) FROM public.payment_settlement_receipts')=='1'
assert sql('SELECT count(*) FROM public.payment_settlement_outbox')=='2'
print('PASS 20 concurrent callbacks: 1 approval, 19 safe duplicates, 1 receipt, 1 invoice intent, 1 notification intent')
assert run(call(order='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')).returncode!=0;print('PASS same charge wrong order')
assert run(call(charge='charge-other')).returncode!=0;print('PASS different charge cannot approve already paid order')