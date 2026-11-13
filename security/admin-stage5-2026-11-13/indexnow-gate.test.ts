import { test, expect } from 'bun:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = readFileSync('supabase/functions/notify-search-engines/index.ts', 'utf8').replace(/^import .*\n/gm, '');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
test.each([null, 'specialist', 'staff'])('IndexNow denies %s before data or external call', async role => {
  let handler: (r: Request) => Promise<Response> = async () => new Response();
  let calls = 0;
  new Function('Deno', 'verifyAdminOrCron', 'createClient', 'fetch', js)(
    { serve: (h: typeof handler) => { handler = h; }, env: { get: () => 'synthetic' } },
    async (_r: Request, allowed: string[]) => role && allowed.includes(role) ? { ok: true } : { ok: false, status: role ? 403 : 401, error: 'Denied' },
    () => { calls++; throw new Error('Unexpected database access'); },
    () => { calls++; throw new Error('Unexpected external access'); }
  );
  const response = await handler(new Request('https://example.invalid', { method: 'POST', body: JSON.stringify({ urls: ['https://example.invalid'] }) }));
  expect(response.status).toBe(role ? 403 : 401);
  expect(calls).toBe(0);
});