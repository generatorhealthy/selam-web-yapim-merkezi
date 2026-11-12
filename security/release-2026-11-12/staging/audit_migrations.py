"""Offline inventory; never executes SQL and never exports SQL literals or credentials.
Install pglast into a temporary Python path, not application dependencies.
"""
import argparse
import csv
import hashlib
import json
import re
from pathlib import Path
from pglast import parse_sql

PRODUCTION = 'irnfwewabogveofwemvg'
CATEGORIES = {
    'schema': 'Şema ve tablo', 'access': 'RLS ve erişim',
    'data': 'Veri ekleme/değiştirme', 'external': 'Dış hizmet çağrısı',
    'automation': 'Otomatik görev/tetikleyici', 'connection': 'Gizli anahtar/canlı bağlantı',
    'review': 'Diğer/manuel inceleme',
}
PATTERNS = {
    'production_ref': re.compile(PRODUCTION, re.I),
    'network_or_webhook': re.compile(r'\b(?:net\.http_\w+|http\.(?:http|http_post|http_get)|http_post|http_get|supabase_functions\.http_request|dblink\w*|postgres_fdw)\b|\bhttps?://|webhook', re.I),
    'cron': re.compile(r'\bcron\.(?:schedule\w*|alter_job|unschedule)\b', re.I),
    'provider': re.compile(r'verimor|brevo|waha|whatsapp|iyzico|birfatura|send[_-](?:sms|email|appointment|test)|invoice|payment|subscription|meta.capi', re.I),
    'credential_or_connection': re.compile(r'\b(?:authorization|bearer|api[_-]?key|service_role_key|access_token|cron[_-]?secret|webhook[_-]?secret|vault\.(?:create_secret|update_secret|decrypted_secrets))\b|eyJ[A-Za-z0-9_-]{25,}|https?://|postgres(?:ql)?://', re.I),
    'body_data_write': re.compile(r'\b(?:INSERT\s+INTO|UPDATE\s+[\w".]|DELETE\s+FROM|COPY\s+[\w".]|TRUNCATE\b)', re.I),
}


def classify(node_type, text):
    # Multiple categories are intentional: a trigger function can write and send HTTP.
    tags = set()
    if node_type in {'CreateStmt', 'IndexStmt', 'CreateSchemaStmt', 'CreateEnumStmt', 'CreateSeqStmt', 'ViewStmt', 'AlterTableStmt', 'CreateExtensionStmt', 'CreateFunctionStmt', 'CompositeTypeStmt', 'AlterEnumStmt', 'DropStmt'}:
        tags.add('schema')
    if node_type in {'GrantStmt', 'GrantRoleStmt', 'CreatePolicyStmt', 'AlterPolicyStmt', 'AlterOwnerStmt'} or re.search(r'\b(?:ROW LEVEL SECURITY|SECURITY DEFINER|REVOKE|GRANT)\b', text, re.I):
        tags.add('access')
    if node_type in {'InsertStmt', 'UpdateStmt', 'DeleteStmt', 'CopyStmt', 'TruncateStmt', 'CreateTableAsStmt'} or PATTERNS['body_data_write'].search(text):
        tags.add('data')
    signals = [name for name, pattern in PATTERNS.items() if pattern.search(text)]
    if 'network_or_webhook' in signals or ('provider' in signals and node_type in {'SelectStmt', 'CreateFunctionStmt', 'CreateTrigStmt'}):
        tags.add('external')
    if node_type == 'CreateTrigStmt' or 'cron' in signals or re.search(r'\bRETURNS\s+TRIGGER\b', text, re.I):
        tags.add('automation')
    if 'production_ref' in signals or 'credential_or_connection' in signals:
        tags.add('connection')
    if not tags:
        tags.add('review')
    execution = 'definition_body_not_invoked_here' if node_type == 'CreateFunctionStmt' else 'top_level_or_indirect'
    return sorted(tags), signals, execution


def analyze(path, base):
    raw = path.read_bytes()
    text = raw.decode('utf-8')
    entry = {'file': str(path.relative_to(base)), 'sha256': hashlib.sha256(raw).hexdigest(), 'statements': [], 'parse_ok': True}
    try:
        nodes = parse_sql(text)
    except Exception:
        # Parser error text can contain secrets: export only its class, never its message.
        entry['parse_ok'] = False
        tags, signals, _ = classify('Unparsed', text)
        entry.update(categories=sorted(set(tags + ['review'])), signals=signals, approval='blocked_parse_error')
        return entry
    for i, node in enumerate(nodes):
        start = node.stmt_location
        end = start + node.stmt_len if node.stmt_len else len(text)
        segment = text[start:end]
        tags, signals, execution = classify(type(node.stmt).__name__, segment)
        entry['statements'].append({'ordinal': i + 1, 'line': text[:start].count('\n') + 1, 'node': type(node.stmt).__name__, 'categories': tags, 'signals': signals, 'execution': execution})
    entry['categories'] = sorted({tag for s in entry['statements'] for tag in s['categories']})
    entry['signals'] = sorted({tag for s in entry['statements'] for tag in s['signals']})
    entry['approval'] = 'blocked_risk' if set(entry['categories']) & {'external', 'automation', 'connection', 'data'} else 'manual_review_not_auto_approved'
    return entry


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path.cwd())
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    files = sorted((args.root / 'supabase/migrations').glob('*.sql'))
    rows = [analyze(p, args.root) for p in files]
    summary = {'files': len(rows), 'parsed': sum(r['parse_ok'] for r in rows), 'parse_errors': sum(not r['parse_ok'] for r in rows), 'statements': sum(len(r['statements']) for r in rows), 'categories': {tag: sum(tag in r['categories'] for r in rows) for tag in CATEGORIES}, 'auto_approved': 0}
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'inventory.json').write_text(json.dumps({'summary': summary, 'files': rows}, ensure_ascii=False, indent=2))
    with (args.output / 'files.csv').open('w', newline='') as f:
        writer = csv.writer(f); writer.writerow(['file', 'sha256', 'parse_ok', 'categories', 'signals', 'approval'])
        for r in rows:
            writer.writerow([r['file'], r['sha256'], r['parse_ok'], '|'.join(r['categories']), '|'.join(r['signals']), r['approval']])
    with (args.output / 'statements.csv').open('w', newline='') as f:
        writer = csv.writer(f); writer.writerow(['file', 'ordinal', 'line', 'node', 'categories', 'signals', 'execution'])
        for r in rows:
            for s in r['statements']:
                writer.writerow([r['file'], s['ordinal'], s['line'], s['node'], '|'.join(s['categories']), '|'.join(s['signals']), s['execution']])
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()