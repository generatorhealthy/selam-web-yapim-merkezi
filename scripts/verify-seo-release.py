"""Read-only release acceptance: local generated pages, or actual public HTTP.
Run before publish: python3 scripts/verify-seo-release.py dist
Run after publish: python3 scripts/verify-seo-release.py dist --live
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
import xml.etree.ElementTree as ET

SITE = 'https://doktorumol.com.tr'


def generated_file(directory, path):
    if path == '/':
        return directory / 'pre/home.html'
    if path == '/blog':
        return directory / 'blog.html'
    if re.fullmatch(r'/blog/[A-Za-z0-9_-]+', path):
        return directory / (path.lstrip('/') + '.html')
    return directory / ('pre' + path + '.html')


def validate_local(directory):
    urls = [e.text for e in ET.parse(directory / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    if len(urls) < 50 or len(urls) != len(set(urls)):
        raise ValueError('Incomplete or duplicate sitemap')
    for url in urls:
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != 'doktorumol.com.tr':
            raise ValueError('Unexpected sitemap domain')
        if re.fullmatch(r'/test/[A-Za-z0-9_-]+', parsed.path):
            continue  # Existing test workflow is preserved, not prerendered.
        file = generated_file(directory, parsed.path)
        if not file.is_file():
            raise ValueError(f'Missing public HTML: {parsed.path}')
        html = file.read_text()
        canonicals = re.findall(r'<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"', html)
        if canonicals != [url]:
            raise ValueError(f'Incorrect canonical: {parsed.path}')
        if re.search(r'<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex', html):
            raise ValueError(f'Unexpected noindex: {parsed.path}')
        for asset in re.findall(r'(?:src|href)="(/assets/[^"?]+)', html):
            if not (directory / asset.lstrip('/')).is_file():
                raise ValueError(f'Missing asset: {asset}')
    for file in ['404.html', 'robots.txt', '.htaccess', 'boot.js', 'boot.css']:
        if not (directory / file).is_file():
            raise ValueError(f'Missing release resource: {file}')
    return urls


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch_status(url):
    try:
        with build_opener(NoRedirect).open(Request(url, headers={'User-Agent': 'DoktorumOl-SEO-ReleaseCheck/1.0'}), timeout=30) as response:
            return response.status, response.headers.get('Location')
    except HTTPError as error:
        return error.code, error.headers.get('Location')
    except (URLError, TimeoutError):
        return 0, None


def validate_live(urls):
    checks = [(url, 200, None) for url in urls]
    checks.extend((SITE + path, status, target) for path, status, target in [
        ('/robots.txt', 200, None), ('/sitemap.xml', 200, None),
        ('/yok-boyle-bir-sayfa-xyz', 404, None), ('/blog/yok-boyle-bir-sayfa-xyz', 404, None),
        ('/psikolog/nur-seyda-peker', 404, None), ('/assets/seo-missing.js', 404, None),
        ('/category/uzman-psikolog/', 301, '/uzmanlar'), ('/category/psikoloji/', 301, '/blog'),
        ('//', 301, '/'), ('/kayit-ol', 200, None), ('/giris-yap', 200, None),
        ('/checkout', 200, None), ('/doktor-paneli', 200, None), ('/divan_paneli', 200, None),
    ])
    def check(item):
        url, expected, target = item
        for attempt in range(3):
            status, location = fetch_status(url)
            if status == expected and (target is None or (location and urlsplit(location).path == target)):
                return None
            if attempt < 2:
                time.sleep(2)
        return f'{url}: expected {expected}, got {status}'
    with ThreadPoolExecutor(max_workers=6) as pool:
        failures = [result for result in pool.map(check, checks) if result]
    if failures:
        raise ValueError('\n'.join(failures))
    print(f'Live acceptance passed: {len(checks)} HTTP checks, including all {len(urls)} sitemap URLs')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('--live', action='store_true')
    args = parser.parse_args()
    try:
        urls = validate_local(args.directory)
        print(f'Local release accepted: {len(urls)} sitemap URLs')
        if args.live:
            validate_live(urls)
    except (ValueError, OSError, ET.ParseError) as error:
        print(f'SEO release verification failed: {error}', file=sys.stderr)
        sys.exit(1)