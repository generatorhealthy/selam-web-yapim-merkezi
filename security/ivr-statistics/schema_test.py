"""Local synthetic PostgreSQL only; never reads production environment."""
from pathlib import Path
import subprocess
from concurrent.futures import ThreadPoolExecutor
HOST, PORT = "127.0.0.1", "55439"
def sql(query, ok=True):
    result = subprocess.run(["psql", "-h", HOST, "-p", PORT, "-U", "lovable", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", query], capture_output=True, text=True)
    if ok and result.returncode:
        raise AssertionError(result.stderr)
    if not ok:
        assert result.returncode != 0, "Expected denial"
    return result.stdout.strip()
sql("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role; CREATE TABLE public.lead_ivr_campaigns(id uuid primary key); CREATE TABLE public.lead_ivr_calls(id uuid primary key, dispatched_at timestamptz); INSERT INTO public.lead_ivr_calls VALUES ('00000000-0000-0000-0000-000000000001',now()-interval '60 seconds');")
sql(Path(__file__).with_name("schema.sql").read_text())
def record(key, kind="answered", offset=20, role="service_role"):
    return sql(f"SET ROLE {role}; SELECT public.record_ivr_telemetry('00000000-0000-0000-0000-000000000001','{key}','{kind}',now()-interval '{offset} seconds','81',NULL);")
with ThreadPoolExecutor(max_workers=20) as pool:
    results = list(pool.map(lambda _: record("same-event"), range(20)))
assert sum(result.endswith("t") for result in results) == 1
assert sql("SELECT count(*) FROM public.lead_ivr_call_events;") == "1"
record("end", "ended", 5)
record("ring", "ringing", 50)
record("digit", "digit_1", 10)
assert sql("SELECT answered_at < ended_at AND ringing_at < answered_at AND digit_at < ended_at FROM public.lead_ivr_telemetry;") == "t"
sql("SET ROLE anon; SELECT * FROM public.lead_ivr_call_events", ok=False)
sql("SET ROLE authenticated; SELECT * FROM public.lead_ivr_telemetry", ok=False)
sql("SET ROLE authenticated; SELECT public.record_ivr_telemetry('00000000-0000-0000-0000-000000000001','forged','answered',now(),'81',NULL)", ok=False)
sql("SET ROLE service_role; SELECT public.record_ivr_telemetry('00000000-0000-0000-0000-000000000001','future','answered',now()+interval '1 hour','81',NULL)", ok=False)
sql("SET ROLE service_role; SELECT public.record_ivr_telemetry('00000000-0000-0000-0000-000000000099','missing','answered',now(),'81',NULL)", ok=False)
print("7 PostgreSQL groups passed; 20 concurrent deliveries: one event; delayed ordering preserved; anon/auth denied")