"""Canonical ownership regression against the running app; no production writes."""
import asyncio
import json
import subprocess
import unittest
from pathlib import Path
from playwright.async_api import async_playwright


def prerender(html, url):
    # Execute the actual production helper, not a separate imitation.
    source = Path('scripts/prerender-blog.mjs').read_text()
    helper = source[source.index('function setMeta('):source.index('// #root')]
    script = "const esc = s => String(s);\n" + helper
    script += '\nconst [html,url] = JSON.parse(require("fs").readFileSync(0,"utf8"));'
    script += '\nprocess.stdout.write(setMeta(html,{title:"SEO test",description:"SEO test",url}));'
    return subprocess.check_output(['node', '-e', script], input=json.dumps([html, url]).encode()).decode()


class CanonicalOwnership(unittest.TestCase):
    def test_home_canonical_is_adopted_and_removed_on_navigation(self):
        asyncio.run(self.check())

    async def check(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(viewport={'width': 1280, 'height': 1800})

            async def document(route):
                response = await route.fetch()
                body = prerender(await response.text(), 'https://doktorumol.com.tr/')
                await route.fulfill(response=response, body=body)

            await page.route('http://localhost:8080/', document)
            await page.goto('http://localhost:8080/', wait_until='domcontentloaded')
            await page.get_by_role('heading', level=1).wait_for()
            await page.wait_for_timeout(1000)
            await page.wait_for_function('window.__dkoMarkStarted !== undefined')

            async def canonical(expected):
                await page.wait_for_function(
                    '(url) => { const tags = [...document.querySelectorAll("link[rel=canonical]")]; return tags.length === 1 && tags[0].href === url; }',
                    arg=expected, timeout=10000)
                self.assertEqual(await page.locator('link[rel=canonical]').evaluate_all('(xs)=>xs.map(x=>x.href)'), [expected])

            await canonical('https://doktorumol.com.tr/')
            await page.get_by_role('link', name='Uzmanlar', exact=True).first.click()
            await page.wait_for_url('**/uzmanlar')
            await canonical('https://doktorumol.com.tr/uzmanlar')
            await page.go_back()
            await canonical('https://doktorumol.com.tr/')
            Path('/tmp/browser/seo-home').mkdir(parents=True, exist_ok=True)
            await page.screenshot(path='/tmp/browser/seo-home/canonical-fixed.png')
            await browser.close()


if __name__ == '__main__':
    unittest.main()