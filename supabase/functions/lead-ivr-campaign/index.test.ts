import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import * as rules from "../_shared/leadIvr.ts";

// Execute the actual entrypoint with synthetic ports: no credentials or network.
function fixture() {
  const filters: unknown[][] = [];
  const writes: unknown[] = [];
  const svc = {
    from(table: string) {
      const result = { data: table === "danisan_basvurulari"
        ? [{ id: "synthetic-lead", phone: "905550000001", therapy_type: "Çift Terapisi" }] : [], error: null };
      const query: any = {};
      for (const method of ["select", "order", "range", "gte", "neq", "not"]) query[method] = () => query;
      query.eq = (...args: unknown[]) => { filters.push([table, ...args]); return query; };
      query.update = (value: unknown) => { writes.push(value); return query; };
      query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
      return query;
    },
  };
  const context: any = createContext({
    ...rules, inCallWindow: () => true, callToken: async () => "synthetic-signature",
    createClient: () => svc, verifyAdminOrCron: async () => ({ ok: true }),
    isBlockedPhone: () => false, IVR_LINES: [], ivrDialPrefix: () => "auto",
    corsHeaders: {}, Response, Request, URL, AbortSignal, Date, console, setTimeout,
    fetch: async () => new Response(JSON.stringify({ success: true, dual_line: true, prefix: "80" })),
    Deno: { env: { get: () => "https://synthetic.invalid" }, serve: (fn: unknown) => { context.handler = fn; } },
  });
  const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8")
    .replace(/^import[\s\S]*?from\s+"[^"]+";\s*/gm, "");
  runInContext(new Bun.Transpiler({ loader: "ts" }).transformSync(source) + "\nglobalThis.dispatchCall = dispatch;", context);
  return { context, filters, writes, svc };
}

for (const status of ["no_answer", "wrong"]) {
  test(`eligible returns count for ${status} without a scope error`, async () => {
    const { context, filters } = fixture();
    const response = await context.handler(new Request("https://synthetic.invalid", {
      method: "POST", body: JSON.stringify({ action: "eligible", status }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ count: 1, dual_line: true });
    expect(filters).toContainEqual(["danisan_basvurulari", "status", status]);
  });
}

test("start rejects an ineligible category before writes", async () => {
  const { context, writes } = fixture();
  const response = await context.handler(new Request("https://synthetic.invalid", {
    method: "POST", body: JSON.stringify({ action: "start", status: "transferred" }),
  }));
  expect(response.status).toBe(400);
  await response.text();
  expect(writes.length).toBe(0);
});

test("start rejects an invalid trial limit before writes", async () => {
  const { context, writes } = fixture();
  const response = await context.handler(new Request("https://synthetic.invalid", {
    method: "POST", body: JSON.stringify({ action: "start", status: "wrong", limit: 0 }),
  }));
  expect(response.status).toBe(400);
  await response.text();
  expect(writes.length).toBe(0);
});

test("dispatch does not depend on HTTP body or action variables", async () => {
  const { context, svc, writes } = fixture();
  expect(await context.dispatchCall(svc, {
    id: "synthetic-call", phone: "905550000001", area_key: "cift",
  }, "auto")).toBe(true);
  expect(writes).toContainEqual({ pbx_call_id: "line:80" });
});