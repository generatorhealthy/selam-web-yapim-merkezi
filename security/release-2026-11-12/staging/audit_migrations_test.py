import tempfile
import unittest
from pathlib import Path
from audit_migrations import analyze, classify


class AuditTests(unittest.TestCase):
    def test_schema_does_not_auto_approve(self):
        tags, _, _ = classify('CreateStmt', 'CREATE TABLE public.demo(id uuid)')
        self.assertEqual(tags, ['schema'])

    def test_cron_http_production_is_blocked(self):
        tags, signals, _ = classify('SelectStmt', "SELECT cron.schedule('x','* * * * *',$$SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co')$$)")
        self.assertTrue({'automation', 'external', 'connection'} <= set(tags))
        self.assertIn('production_ref', signals)

    def test_function_body_is_not_misrepresented_as_already_sent(self):
        tags, _, mode = classify('CreateFunctionStmt', 'CREATE FUNCTION f() RETURNS void AS $$BEGIN INSERT INTO demo VALUES(1); END$$ LANGUAGE plpgsql')
        self.assertIn('data', tags)
        self.assertEqual(mode, 'definition_body_not_invoked_here')

    def test_literal_semicolon_does_not_split_statements(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); p = root / 'a.sql'
            p.write_text("CREATE TABLE public.a(x text); INSERT INTO public.a VALUES('one;two');")
            result = analyze(p, root)
            self.assertEqual(len(result['statements']), 2)
            self.assertEqual(result['approval'], 'blocked_risk')

    def test_invalid_sql_is_blocked_without_leaking_parser_message(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); p = root / 'a.sql'; p.write_text('BROKEN bearer private_value')
            result = analyze(p, root)
            self.assertFalse(result['parse_ok'])
            self.assertEqual(result['approval'], 'blocked_parse_error')
            self.assertNotIn('private_value', str(result))


if __name__ == '__main__':
    unittest.main()