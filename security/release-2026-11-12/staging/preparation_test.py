import os
import unittest
from unittest.mock import patch
from browser_preflight import origins
from assemble_bootstrap import DENIED, SOURCES


class PreparationTests(unittest.TestCase):
    def test_no_production_environment_fallback(self):
        with patch.dict(os.environ, {'VITE_SUPABASE_URL':'https://irnfwewabogveofwemvg.supabase.co'}, clear=True):
            with self.assertRaises(ValueError):
                origins()

    def test_existing_preview_is_refused(self):
        with patch.dict(os.environ, {'TEST_APP_ORIGIN':'https://id-preview--27547471-8128-4c80-9069-f0c3832f9ac9.lovable.app','TEST_SUPABASE_ORIGIN':'https://synthetictest.supabase.co'}, clear=True):
            with self.assertRaises(ValueError):
                origins()

    def test_test_app_with_production_database_is_refused(self):
        with patch.dict(os.environ, {'TEST_APP_ORIGIN':'https://synthetic.example.invalid','TEST_SUPABASE_ORIGIN':'https://irnfwewabogveofwemvg.supabase.co'}, clear=True):
            with self.assertRaises(ValueError):
                origins()

    def test_isolated_explicit_origins_are_accepted(self):
        with patch.dict(os.environ, {'TEST_APP_ORIGIN':'https://synthetic.example.invalid','TEST_SUPABASE_ORIGIN':'https://synthetictest.supabase.co'}, clear=True):
            self.assertEqual(origins(), ('https://synthetic.example.invalid','https://synthetictest.supabase.co'))

    def test_sql_bootstrap_refuses_external_services(self):
        for source in ['SELECT cron.schedule()', 'SELECT net.http_post()', 'https://api.brevo.com', 'postgresql://production', 'SELECT vault.create_secret()', 'SELECT dblink()', 'https://irnfwewabogveofwemvg.supabase.co']:
            self.assertIsNotNone(DENIED.search(source))

    def test_explicit_sources_exclude_historical_migration_directory(self):
        self.assertEqual(len(SOURCES), 6)
        self.assertTrue(all('/supabase/migrations/' not in str(p) for p in SOURCES))
        self.assertTrue(all(DENIED.search(p.read_text()) is None for p in SOURCES))


if __name__ == '__main__':
    unittest.main()