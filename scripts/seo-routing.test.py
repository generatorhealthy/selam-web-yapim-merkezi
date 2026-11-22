"""Real Apache routing regression; generated public files, no customer mutations.
Run: nix shell nixpkgs#apacheHttpd -c python3 scripts/seo-routing.test.py
"""
import json
import os
import pwd
import grp
from pathlib import Path
import shutil
import socket
import http.client
import subprocess
import tempfile
import time
import unittest
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

import requests

ROOT = Path(__file__).resolve().parents[1]


class PublicRouting(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='dko-seo-', dir='/tmp')
        cls.stage = Path(cls.temp.name)
        cls.web = cls.stage / 'dist'
        shutil.copytree(ROOT / 'public', cls.web)
        os.symlink(ROOT / 'src', cls.stage / 'src')
        # Invoke the actual prerender against a tiny entry fixture, not a build.
        assets = cls.web / 'assets'
        assets.mkdir(exist_ok=True)
        (assets / 'app-fixture.js').write_text('window.__seoFixture=true;')
        (assets / 'fixture.css').write_text('body{margin:0}')
        html = (ROOT / 'index.html').read_text().replace(
            '<script type="module" src="/src/main.tsx"></script>',
            '<script type="module" crossorigin src="/assets/app-fixture.js"></script>\n'
            '<link rel="stylesheet" crossorigin href="/assets/fixture.css">')
        (cls.web / 'index.html').write_text(html)
        subprocess.run(['node', str(ROOT / 'scripts/prerender-blog.mjs')], cwd=cls.stage, check=True, timeout=180)
        subprocess.run(['python3', str(ROOT / 'scripts/verify-seo-release.py'), str(cls.web)], check=True)
        # Keep this release for browser checks without polluting project output.
        target = Path('/tmp/seo-routing/generated')
        shutil.rmtree(target, ignore_errors=True)
        shutil.copytree(cls.web, target)
        binary = shutil.which('httpd')
        if not binary:
            raise RuntimeError('Run with nix shell nixpkgs#apacheHttpd')
        modules = Path(binary).resolve().parent.parent / 'modules'
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            cls.port = sock.getsockname()[1]
        conf = cls.stage / 'httpd.conf'
        account = next(p for p in pwd.getpwall() if p.pw_uid >= 1000 and p.pw_uid < 65534)
        group = grp.getgrgid(account.pw_gid).gr_name
        loads = '\n'.join(f'LoadModule {name}_module "{modules}/mod_{name}.so"'
                          for name in ['mpm_event', 'authz_core', 'authz_host', 'unixd', 'dir', 'mime', 'rewrite', 'headers', 'env', 'setenvif', 'expires'])
        conf.write_text(f'''ServerRoot "{cls.stage}"
{loads}
Listen 127.0.0.1:{cls.port}
ServerName localhost
PidFile "{cls.stage}/httpd.pid"
ErrorLog "{cls.stage}/error.log"
User {account.pw_name}
Group {group}
DocumentRoot "{cls.web}"
TypesConfig /dev/null
DirectoryIndex index.html
<Directory "{cls.web}">
AllowOverride All
Require all granted
</Directory>
''')
        os.chmod(cls.stage, 0o755)
        cls.server = subprocess.Popen([binary, '-f', str(conf), '-DFOREGROUND'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        cls.base = f'http://127.0.0.1:{cls.port}'
        for _ in range(60):
            try:
                r = requests.get(cls.base + '/robots.txt', timeout=1)
                if r.status_code == 200:
                    break
                raise RuntimeError((cls.stage / 'error.log').read_text())
            except requests.ConnectionError:
                if cls.server.poll() is not None:
                    raise RuntimeError(cls.server.communicate()[1].decode())
                time.sleep(.1)
        else:
            raise RuntimeError('Apache did not start')

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate()
        cls.server.wait(timeout=10)
        cls.temp.cleanup()

    def get(self, path):
        return requests.get(self.base + path, allow_redirects=False, timeout=10)

    def test_entire_generated_and_previous_sitemap_stays_200(self):
        paths = {urlsplit(e.text).path for e in ET.parse(self.web / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
        previous = Path('/tmp/seo-routing/before-sitemap.xml')
        if previous.exists():
            paths.update(urlsplit(e.text).path for e in ET.parse(previous).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'))
        failures = [(p, self.get(p).status_code) for p in sorted(paths) if self.get(p).status_code != 200]
        self.assertEqual(failures, [])
        print(f'All {len(paths)} sitemap paths return 200 with the actual .htaccess')

    def test_nonexistent_pages_are_real_404(self):
        for path in ['/yok-boyle-bir-sayfa-xyz', '/blog/yok-boyle-bir-sayfa-xyz', '/yazilar/yok-boyle-bir-sayfa-xyz', '/psikolog/nur-seyda-peker', '/uzmanlik/olmayan-brans', '/assets/missing.js', '/missing.txt']:
            with self.subTest(path=path):
                self.assertEqual(self.get(path).status_code, 404)

    def test_categories_redirect_to_relevant_lists(self):
        for path, destination in [('/category/uzman-psikolog/', '/uzmanlar'), ('/category/psikoloji/', '/blog')]:
            r = self.get(path)
            self.assertEqual(r.status_code, 301)
            self.assertEqual(urlsplit(r.headers['Location']).path, destination)

    def test_only_real_legacy_blog_slugs_redirect(self):
        slug = next((self.web / 'blog').glob('*.html')).stem
        for path in [f'/{slug}', f'/yazilar/{slug}']:
            r = self.get(path)
            self.assertEqual(r.status_code, 301)
            self.assertEqual(urlsplit(r.headers['Location']).path, f'/blog/{slug}')

    def test_double_slash_and_queries(self):
        for path, destination in [('//', '/'), ('//uzmanlar', '/uzmanlar'), ('/uzmanlik//psikolog', '/uzmanlik/psikolog')]:
            # requests/urllib3 normalizes leading // before sending; send raw path.
            connection = http.client.HTTPConnection('127.0.0.1', self.port)
            connection.request('GET', path + '?kaynak=test')
            r = connection.getresponse()
            self.assertEqual(r.status, 301)
            self.assertEqual(urlsplit(r.getheader('Location')).path, destination)
            self.assertEqual(urlsplit(r.getheader('Location')).query, 'kaynak=test')
            connection.close()

    def test_workflow_routes_keep_the_spa(self):
        for path in ['/kayit-ol', '/odeme/ozel-firsat', '/checkout', '/odeme-basarili', '/giris-yap', '/sifre-sifirla', '/divan_paneli/siparisler', '/doktor-paneli', '/partner', '/mobile/home', '/randevu-al/psikolog/psk-zerrin-gunduz', '/test/fixture', '/psikolog/psk-zerrin-gunduz/test/fixture']:
            with self.subTest(path=path):
                self.assertEqual(self.get(path).status_code, 200)

    def test_robots_missing_never_redirects_to_blog(self):
        path = self.web / 'robots.txt'
        body = path.read_bytes()
        path.unlink()
        try:
            self.assertEqual(self.get('/robots.txt').status_code, 404)
        finally:
            path.write_bytes(body)

    def test_home_has_one_organization(self):
        import re
        html = self.get('/').text
        blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
        nodes = [n for b in blocks for n in json.loads(b).get('@graph', [])]
        self.assertEqual([n['@id'] for n in nodes if n.get('@type') == 'Organization'], ['https://doktorumol.com.tr/#organization'])
        self.assertFalse(any(n.get('@type') == 'MedicalBusiness' for n in nodes))


if __name__ == '__main__':
    unittest.main()