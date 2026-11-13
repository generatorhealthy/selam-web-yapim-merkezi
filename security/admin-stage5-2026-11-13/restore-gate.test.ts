import { test, expect } from 'bun:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = readFileSync('supabase/functions/restore-deleted-user/index.ts', 'utf8').replace(/^import .*;\n/gm, '');
const javascript = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
async function execute(role: string | null) {
  let handler: (req: Request) => Promise<Response> = async () => new Response('', { status: 500 });
  let providerCalls = 0;
  const factory = new Function('serve', 'verifyAdminOrCron', 'createClient', 'Deno', javascript);
  factory((callback: typeof handler) => { handler = callback; }, async (_req: Request, roles: string[]) => role && roles.includes(role) ? { ok: true } : { ok: false, status: role ? 403 : 401, error: 'Denied' }, () => ({ auth: { admin: { createUser: async () => { providerCalls++; return { data: { user: { id: 'synthetic' } }, error: null }; } } } }), { env: { get: () => 'synthetic-only' } });
  const response = await handler(new Request('https://example.invalid', { method: 'POST', body: JSON.stringify({ user_id: 'synthetic', email: 'synthetic@example.invalid' }) }));
  return { response, providerCalls };
}
test.each([null, 'specialist', 'staff', 'muhasebe', 'legal'])('account credential restoration denied for %s before Auth write', async role => {
  const { response, providerCalls } = await execute(role);
  expect(response.status).toBe(role ? 403 : 401);
  expect(providerCalls).toBe(0);
});
test('approved admin path remains functional under injected synthetic Auth', async () => {
  const { response, providerCalls } = await execute('admin');
  expect(response.status).toBe(200);
  expect(providerCalls).toBe(1);
});