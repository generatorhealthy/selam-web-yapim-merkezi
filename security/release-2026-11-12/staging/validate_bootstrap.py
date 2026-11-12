"""Run only against the existing synthetic local socket, never managed PG env."""
import concurrent.futures
import os
import subprocess
from pathlib import Path
from assemble_bootstrap import assemble

SOCKET = '/tmp/kvkk-priority-pg'
DATABASE = 'branch_safe_fixture_20261112'
ENV = {k: v for k, v in os.environ.items() if not k.startswith('PG')}


def sql(query, ok=True, database=DATABASE):
    result = subprocess.run(['psql', '-h', SOCKET, '-p', '55439', '-U', 'postgres', '-d', database, '-X', '-v', 'ON_ERROR_STOP=1', '-Atc', query], env=ENV, capture_output=True, text=True)
    if ok and result.returncode:
        raise AssertionError(result.stderr)
    if not ok and not result.returncode:
        raise AssertionError('expected rejection')
    return result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ''


def main():
    if not Path(SOCKET).is_dir():
        raise SystemExit('Local fixture unavailable; no cloud fallback')
    if sql(f"SELECT count(*) FROM pg_database WHERE datname='{DATABASE}'", database='postgres') != '0':
        raise SystemExit('Existing fixture database refused; no reset or deletion')
    sql(f'CREATE DATABASE {DATABASE}', database='postgres')
    sql("CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; GRANT USAGE ON SCHEMA public,auth TO service_role,anon,authenticated;")
    sql(assemble())
    assert sql("SELECT count(*) FROM pg_extension WHERE extname IN ('pg_net','pg_cron','http','dblink','postgres_fdw')") == '0'
    assert sql("SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgname<>'verified_consent_append_only'") == '0'
    assert sql('SELECT (SELECT count(*) FROM appointments)+(SELECT count(*) FROM test_results)+(SELECT count(*) FROM user_consent_logs)+(SELECT count(*) FROM simulated_deliveries)') == '0'
    print('PASS clean startup: no external extensions, network triggers, imported records or queue')
    ids = [f'00000000-0000-4000-8000-{n:012d}' for n in range(1, 9)]
    specialist, other, user, test, question, consent, appointment, withdrawal = ids
    sql(f"INSERT INTO specialists VALUES('{specialist}','{specialist}','specialist@example.invalid',true),('{other}','{other}','other@example.invalid',true); INSERT INTO tests VALUES('{test}','{specialist}',true); INSERT INTO test_questions VALUES('{question}','{test}','multiple_choice','[\"yes\",\"no\"]',true,1); INSERT INTO verified_consent_documents VALUES('health_test','synthetic-v1','synthetic document','unused',true),('health_appointment','synthetic-v1','synthetic document','unused',true);")
    sql(f"SET ROLE anon;SELECT record_verified_consent('{user}','{consent}','health_test','grant','synthetic-v1')", False)
    sql(f"SET ROLE service_role;SELECT record_verified_consent('{user}','{consent}','health_test','grant','synthetic-v1')")
    op = sql(f"SET ROLE service_role;SELECT prepare_test_submission('{test}','{specialist}','{user}','{'a'*64}',false)")
    commit = f"SET ROLE service_role;SELECT commit_test_submission('{op}','{'a'*64}','{user}','Synthetic','person@example.invalid','{{\"{question}\":\"yes\"}}')"
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
        results = list(pool.map(lambda _: sql(commit), range(20)))
    assert len(set(results)) == 1
    assert sql('SELECT count(*) FROM test_results') == '1'
    assert sql('SELECT count(*) FROM test_result_outbox') == '1'
    print('PASS verified consent -> 20 concurrent test submissions -> one result/outbox')
    assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{specialist}';SELECT count(*) FROM test_results") == '1'
    assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{other}';SELECT count(*) FROM test_results") == '0'
    sql('SET ROLE anon;SELECT * FROM test_results', False)
    assert sql("SELECT results->>'interpretation' FROM test_results") == 'specialist_review_required'
    print('PASS owner readback, unrelated specialist/anonymous rejection, no clinical score')
    sql(f"SET ROLE service_role;SELECT withdraw_verified_consent('{user}','{withdrawal}','health_test')")
    sql(commit, False)
    sql("UPDATE user_consent_logs SET accepted=false", False)
    sql("DELETE FROM user_consent_logs", False)
    assert sql('SELECT count(*) FROM test_results') == '1'
    print('PASS withdrawal blocks subsequent health submission; append-only events/result retained')
    sql(f"SET ROLE service_role;SELECT fixture_create_appointment('{appointment}','{specialist}','{user}',true,'synthetic health','synthetic topic')", False)
    sql(f"SET ROLE service_role;SELECT fixture_create_appointment('{appointment}','{specialist}','{user}',false,'must be stripped','must be stripped')")
    assert sql('SELECT notes IS NULL AND consultation_topic IS NULL FROM appointments') == 't'
    assert sql('SELECT count(*) FROM simulated_deliveries') == '1'
    assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{specialist}';SELECT count(*) FROM appointments") == '1'
    assert sql(f"SET ROLE authenticated;SET request.jwt.claim.sub='{other}';SELECT count(*) FROM appointments") == '0'
    print('PASS general appointment strips health fields; health without scoped consent denied; notice stays local')
    print('5 local SQL groups passed; not hosted Supabase or UI E2E')


if __name__ == '__main__':
    main()