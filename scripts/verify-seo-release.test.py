"""Offline regression checks for the live release acceptance contract."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit

spec = importlib.util.spec_from_file_location(
    'seo_release', Path(__file__).with_name('verify-seo-release.py'))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class LiveReleaseAcceptance(unittest.TestCase):
    def response(self, url):
        path = urlsplit(url).path
        redirects = {'/category/uzman-psikolog/': '/uzmanlar',
                     '/category/psikoloji/': '/blog', '//': '/'}
        if path in redirects:
            return 301, redirects[path]
        if path in {'/yok-boyle-bir-sayfa-xyz', '/assets/seo-missing.js', '/seo-missing.txt'}:
            return 404, None
        return 200, None

    def test_content_routes_allow_new_content_between_deploys(self):
        with patch.object(release, 'fetch_status', side_effect=self.response) as fetch:
            release.validate_live([release.SITE + '/blog/existing-post'])
        checked = {urlsplit(call.args[0]).path for call in fetch.call_args_list}
        self.assertTrue({'/blog/yok-boyle-bir-sayfa-xyz', '/psikolog/nur-seyda-peker',
                         '/uzmanlik/yeni-brans', '/blog/existing-post'} <= checked)

    def test_missing_files_and_unknown_routes_still_require_http_404(self):
        for invalid in ['/yok-boyle-bir-sayfa-xyz', '/assets/seo-missing.js', '/seo-missing.txt']:
            def response(url):
                return (200, None) if urlsplit(url).path == invalid else self.response(url)
            with self.subTest(path=invalid), \
                    patch.object(release, 'fetch_status', side_effect=response), \
                    patch.object(release.time, 'sleep'):
                with self.assertRaisesRegex(ValueError, 'expected 404, got 200'):
                    release.validate_live([])

    def test_sitemap_page_failures_still_block_release(self):
        url = release.SITE + '/blog/existing-post'
        with patch.object(release, 'fetch_status', side_effect=lambda target:
                          (404, None) if target == url else self.response(target)), \
                patch.object(release.time, 'sleep'):
            with self.assertRaisesRegex(ValueError, 'expected 200, got 404'):
                release.validate_live([url])


if __name__ == '__main__':
    unittest.main()