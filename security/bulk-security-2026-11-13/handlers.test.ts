import { test, expect } from "bun:test";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { authorizeBirfaturaPull } from "../../supabase/functions/_shared/birfaturaPullAuth";

function invoice(secret?: string) {
  let handler: (req: Request) => Promise<Response> = async () => new Response(null, { status: 500 });
  let reads = 0;
  const query: any = { select: () => query, gte: () => query, lte: () => query, in: () => query, eq: () => query,
    order: () => query, limit: async () => ({ data: [], error: null }) };
  const js = ts.transpileModule(readFileSync("supabase/functions/birfatura-orders/index.ts", "utf8").replace(/^import .*\n/gm, ""), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  new Function("serve", "createClient", "authorizeBirfaturaPull", "Deno", "console", js)(
    (cb: typeof handler) => { handler = cb; }, () => ({ from: () => { reads++; return query; } }), authorizeBirfaturaPull,
    { env: { get: (name: string) => name === "BIRFATURA_API_TOKEN" ? secret : "synthetic" } }, { log() {}, error() {}, warn() {} });
  return { call: handler, reads: () => reads };
}
test("actual invoice handler rejects absent secret before database read", async () => {
  const w = invoice(); expect((await w.call(new Request("https://example.invalid"))).status).toBe(503); expect(w.reads()).toBe(0);
});
test("actual invoice handler rejects anonymous and forged callers before database read", async () => {
  const w = invoice("synthetic");
  for (const token of ["", "forged"]) expect((await w.call(new Request("https://example.invalid", { headers: { token } }))).status).toBe(401);
  expect(w.reads()).toBe(0);
});
test("actual existing invoice pull works with matching provider credential", async () => {
  const w = invoice("synthetic"); const response = await w.call(new Request("https://example.invalid", { headers: { apipassword: "synthetic" } }));
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ Orders: [] }); expect(w.reads()).toBe(1);
});
test.each([null, "specialist", "staff", "admin"])("actual Brevo handler role %s is checked before external access", async role => {
  let handler: (req: Request) => Promise<Response> = async () => new Response(null, { status: 500 }); let calls = 0;
  const js = ts.transpileModule(readFileSync("supabase/functions/sync-brevo-email-history/index.ts", "utf8").replace(/^import .*\n/gm, ""), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  new Function("serve", "verifyAdminOrCron", "createClient", "Deno", "fetch", "console", js)(
    (cb: typeof handler) => { handler = cb; }, async (_req: Request, roles: string[]) => role && roles.includes(role) ? { ok: true } : { ok: false, status: role ? 403 : 401, error: "Denied" },
    () => ({}), { env: { get: () => "synthetic" } }, async () => { calls++; return new Response(JSON.stringify({ events: [] })); }, { log() {}, error() {} });
  expect((await handler(new Request("https://example.invalid"))).status).toBe(role === "admin" ? 200 : role ? 403 : 401);
  expect(calls).toBe(role === "admin" ? 1 : 0);
});