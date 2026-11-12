"""Build an offline minimal fixture from an explicit list, not historical migrations.
No database connection, no source rewriting, no generated supabase/migrations file.
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).parent
SOURCES = [
    HERE / 'bootstrap/base.sql',
    ROOT / 'security/priority-2026-11-12/consent-draft.sql',
    HERE.parent / 'consent/withdrawal.sql',
    HERE.parent / 'test/schema.sql',
    HERE.parent / 'test/abuse.sql',
    HERE / 'bootstrap/appointment.sql',
]
DENIED = re.compile(r'https?://|postgres(?:ql)?://|irnfwewabogveofwemvg|\b(?:net\.|cron\.|http\.|dblink|postgres_fdw|vault\.|supabase_functions\.)|eyJ[A-Za-z0-9_-]{25,}', re.I)


def assemble():
    chunks = []; manifest = []
    for path in SOURCES:
        text = path.read_text()
        if DENIED.search(text):
            raise ValueError('unsafe bootstrap source: ' + path.name)
        # Candidate files contain independent transaction envelopes; compose one atomic fixture.
        text = re.sub(r'^\s*(?:BEGIN|COMMIT);\s*$', '', text, flags=re.M)
        manifest.append({'source': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        chunks.append(text)
    sql = 'BEGIN;\n' + '\n'.join(chunks) + '\nCOMMIT;\n'
    (HERE / 'bootstrap/fixture.generated.sql').write_text(sql)
    (HERE / 'bootstrap/manifest.json').write_text(json.dumps({'scope':'minimal_synthetic_fixture_not_production_clone','sources':manifest,'sha256':hashlib.sha256(sql.encode()).hexdigest()}, indent=2))
    return sql


if __name__ == '__main__':
    assemble()
    print('Minimal offline fixture assembled; no database request.')