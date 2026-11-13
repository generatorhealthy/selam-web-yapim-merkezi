import { test, expect } from 'bun:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
function harness(role = 'admin', authenticated = true) {
  let handler: (r: Request) => Promise<Response>;
  let effects = 0;
  const q: any = { select: () => q, eq: () => q,
    maybeSingle: async () => ({ data: { role, is_approved: true } }) };
  const client = { auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'synthetic' } : null }, error: null }) },
    from: (name: string) => { if (name !== 'user_profiles') effects++; return q; } };
  const js = ts.transpileModule(readFileSync('supabase/functions/charge-cancellation-fee/index.ts','utf8').replace(/^import .*\n/gm,''),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  new Function('serve','createClient','corsHeaders','Deno','fetch','console',js)(
    (h: typeof handler) => { handler = h; }, () => client, { 'Access-Control-Allow-Origin': '*' },
    { env: { get: () => 'synthetic' } }, () => { effects++; throw Error('provider forbidden'); }, { error() {} });
  return { call: () => handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer synthetic'},
    body: JSON.stringify({action:'charge',feeId:'forged',subscriptionReferenceCode:'other-subscription',amount:1})})),
    effects: () => effects };
}
test('cayma endpoint 20 eşzamanlı istekte yanlış aboneliği veya tekrar tahsilatı başlatamaz', async () => {
  const h=harness(); const responses=await Promise.all(Array.from({length:20},()=>h.call()));
  expect(responses.map(r=>r.status)).toEqual(Array(20).fill(409)); expect(h.effects()).toBe(0);
});
test('yetkisiz cayma çağrısında tahsilat yok', async () => {
  const h=harness('specialist'); expect((await h.call()).status).toBe(403); expect(h.effects()).toBe(0);
});
test('geçersiz oturumda tahsilat yok', async () => {
  const h=harness('admin',false); expect((await h.call()).status).toBe(401); expect(h.effects()).toBe(0);
});