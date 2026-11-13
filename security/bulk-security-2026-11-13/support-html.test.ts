import { test, expect } from "bun:test";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { escapeHtml } from "../../supabase/functions/_shared/escapeHtml";
test("actual support email escapes each caller-controlled HTML field", async () => {
  let handler: (req: Request) => Promise<Response> = async () => new Response();
  let body: any;
  const source = readFileSync("supabase/functions/send-support-response/index.ts", "utf8").replace(/^import .*\n/gm, "");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  new Function("serve", "verifyAdminOrCron", "createClient", "Deno", "fetch", "escapeHtml", "console", js)(
    (cb: typeof handler) => { handler = cb; }, async () => ({ ok: true }), () => ({ from: () => ({ insert: async () => ({}) }) }),
    { env: { get: () => "synthetic" } }, async (_url: unknown, init: RequestInit) => { body = JSON.parse(String(init.body)); return new Response('{"messageId":"synthetic"}'); }, escapeHtml, { log() {}, error() {} });
  const payload = '<img src=x onerror="alert(1)">';
  const response = await handler(new Request("https://example.invalid", { method: "POST", body: JSON.stringify({
    ticketId: payload, specialistEmail: "synthetic@example.invalid", specialistName: payload, ticketTitle: payload, adminResponse: payload + '\nİçerik', status: '" onclick="alert(1)',
  }) }));
  expect(response.status).toBe(200);
  expect(body.htmlContent.includes(payload)).toBe(false);
  expect(body.htmlContent.includes(escapeHtml(payload))).toBe(true);
  expect(body.htmlContent.includes('status-" onclick=')).toBe(false);
  expect(body.htmlContent.includes('<br>İçerik')).toBe(true);
  expect(body.sender.email).toBe("info@doktorumol.com.tr");
});