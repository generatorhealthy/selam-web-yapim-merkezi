"""After setup approval only: audit an explicit isolated app, never localhost preview 8080.
Requires TEST_APP_ORIGIN and TEST_SUPABASE_ORIGIN, no production env fallback.
Writes host/path-only evidence; never logs query strings, headers, tokens or bodies.
This is browser preflight, not a substitute for server egress enforcement.
"""
import asyncio
import json
import os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright


def origins():
    app = os.environ.get('TEST_APP_ORIGIN', '')
    database = os.environ.get('TEST_SUPABASE_ORIGIN', '')
    a, d = urlparse(app), urlparse(database)
    if a.scheme != 'https' or not a.hostname or a.username or a.password or a.path not in ('', '/') or a.query or a.fragment:
        raise ValueError('Explicit isolated HTTPS app origin required')
    if a.hostname.endswith(('doktorumol.com.tr', 'yenii.lovable.app')) or '27547471-8128-4c80-9069-f0c3832f9ac9' in a.hostname:
        raise ValueError('Production or existing preview refused')
    if d.scheme != 'https' or not d.hostname or not d.hostname.endswith('.supabase.co') or d.hostname == 'irnfwewabogveofwemvg.supabase.co' or d.username or d.password or d.path not in ('', '/') or d.query or d.fragment or d.port:
        raise ValueError('Explicit non-production Supabase origin required')
    return app.rstrip('/'), database.rstrip('/')


async def main():
    app, database = origins()
    evidence = []
    output = Path('/tmp/browser/isolated-preflight'); output.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 1800}, service_workers='block')
        async def route_request(route):
            u = urlparse(route.request.url)
            origin = f'{u.scheme}://{u.netloc}'
            allowed = origin in (app, database)
            evidence.append({'host': u.hostname, 'allowed': allowed})
            await route.continue_() if allowed else await route.abort()
        await context.route('**/*', route_request)
        async def route_socket(route):
            evidence.append({'host':urlparse(route.url).hostname,'allowed':False,'kind':'websocket_disabled'})
            await route.close()
        await context.route_web_socket('**/*', route_socket)
        page = await context.new_page()
        await page.goto(app, wait_until='domcontentloaded')
        await page.screenshot(path=str(output / 'preflight.png'))
        await browser.close()
    (output / 'network.json').write_text(json.dumps(evidence, indent=2))
    if any(not row['allowed'] for row in evidence):
        raise SystemExit('Preflight failed: blocked external attempt detected')
    print('Preflight passed; no off-allowlist browser request. Authenticated E2E still required.')


if __name__ == '__main__':
    asyncio.run(main())