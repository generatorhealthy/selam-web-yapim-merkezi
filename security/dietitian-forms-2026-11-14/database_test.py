"""Synthetic local PostgreSQL only. Never read production configuration."""
import concurrent.futures
import os
from pathlib import Path
import subprocess
import tempfile
import shutil

ROOT=Path(__file__).parent
initdb=shutil.which('initdb')
if not initdb:
    raise RuntimeError('Local PostgreSQL unavailable; never fall back to production.')
BIN=str(Path(initdb).resolve().parent)+'/'
with tempfile.TemporaryDirectory(prefix='dietitian-local-') as tmp:
    os.chmod(tmp,0o777)
    def pg(*args):
        return subprocess.run(['setpriv','--reuid=1000','--regid=1000','--clear-groups',*args],check=True,capture_output=True,text=True)
    pg(BIN+'initdb','-D',tmp+'/data','-U','postgres')
    pg(BIN+'pg_ctl','-D',tmp+'/data','-o',f'-p 55457 -k {tmp}','-l',tmp+'/log','start')
    def run(sql):
        return subprocess.run([BIN+'psql','-h',tmp,'-p','55457','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1','-c',sql],capture_output=True,text=True)
    def ok(sql):
        r=run(sql);assert r.returncode==0,r.stderr;return r.stdout.strip()
    try:
        ok('CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE specialists(id uuid PRIMARY KEY,name text,specialty text);CREATE TABLE tests(id uuid PRIMARY KEY,title text,description text,content text,category text,specialty_area text,status text,is_active boolean,specialist_id uuid);CREATE TABLE test_questions(id uuid PRIMARY KEY,test_id uuid,question_text text,question_type text,options jsonb,step_number integer,is_required boolean);CREATE TABLE specialist_tests(id uuid PRIMARY KEY,specialist_id uuid,test_id uuid,is_enabled boolean);')
        ok((ROOT/'assignment-schema.sql').read_text())
        ok((ROOT/'seed-drafts.sql').read_text());ok((ROOT/'seed-drafts.sql').read_text())
        assert ok('SELECT count(*) FROM tests')=='15'
        assert ok('SELECT count(*) FROM test_questions')=='60'
        sid='11111111-1111-4111-8111-111111111111'
        other='22222222-2222-4222-8222-222222222222'
        ok(f"INSERT INTO specialists VALUES('{sid}','Synthetic Dietitian','Diyetisyen'),('{other}','Other','Psikolog')")
        assert ok('SELECT count(*) FROM tests WHERE specialist_id IS NOT NULL')=='0'
        for role in ['anon','authenticated']:
            assert run(f"SET ROLE {role};SELECT attach_dietitian_intake_forms_v1('{sid}');").returncode!=0
        # Approval simulated ONLY inside the isolated fixture.
        ok("UPDATE tests SET status='approved',is_active=true WHERE specialist_id IS NULL")
        def attach(_):return ok(f"SELECT attach_dietitian_intake_forms_v1('{sid}');")
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
            results=list(pool.map(attach,range(20)))
        assert results.count('15')==1 and results.count('0')==19,results
        assert ok(f"SELECT count(*) FROM tests WHERE specialist_id='{sid}'")=='15'
        assert ok(f"SELECT count(*) FROM test_questions q JOIN tests t ON q.test_id=t.id WHERE t.specialist_id='{sid}'")=='60'
        assert ok(f"SELECT count(*) FROM specialist_tests WHERE specialist_id='{sid}'")=='15'
        assert ok(f"SELECT attach_dietitian_intake_forms_v1('{other}')")=='0'
        nextid='33333333-3333-4333-8333-333333333333'
        ok(f"INSERT INTO specialists VALUES('{nextid}','New Dietitian','Diyetisyen')")
        assert ok(f"SELECT count(*) FROM tests WHERE specialist_id='{nextid}'")=='15'
        assert ok('SELECT count(*) FROM test_questions WHERE is_required')=='0'
        assert ok('SELECT count(*) FROM tests WHERE specialist_id IS NULL')=='15'
        print('PASS: 15 templates/60 questions; draft gate; unauthorized calls denied;20 parallel assignments=1 addition/19 repeats;new dietitian auto-links;other specialty untouched.')
    finally:
        pg(BIN+'pg_ctl','-D',tmp+'/data','stop','-m','immediate')