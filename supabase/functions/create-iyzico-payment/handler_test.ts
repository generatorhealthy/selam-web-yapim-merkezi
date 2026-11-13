// Real handler sources, real HTTP/DB adapters; all network and SDK state synthetic.
import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import ts from "npm:typescript@5.8.3";
import * as checkout from "../_shared/iyzicoCheckout.ts";
import { supabaseDbPort } from "../_shared/iyzicoDb.ts";

const ID = "11111111-1111-4111-8111-111111111111";
const SUB = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CUST = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PLAN = "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652";
async function fixture(merchant = "") {
  const order = { id: ID, status: "pending", amount: 4000, package_type: "ozel-firsat", customer_email: "synthetic@example.invalid",
    is_first_order: true, payment_method: "credit_card", deleted_at: null, created_at: new Date().toISOString() };
  const sessions: any[] = [];
  const calls = { initialize: 0, retrieve: 0, activation: 0, invoice: 0, notification: 0 };
  const sdk = {
    from(table: string) {
      let action = "read", payload: any, predicates: ((v: any) => boolean)[] = [];
      const query: any = {
        select() { return query; }, limit() { return query; }, order() { return query; },
        eq(k: string, v: any) { predicates.push((x) => x[k] === v); return query; },
        is(k: string, v: any) { predicates.push((x) => x[k] === v); return query; },
        not(k: string, _: string, v: any) { predicates.push((x) => x[k] !== v); return query; },
        gte() { return query; }, ilike() { return query; }, in() { return query; },
        insert(v: any) { action = "insert"; payload = v; return query; },
        update(v: any) { action = "update"; payload = v; return query; },
        async maybeSingle() { const r = await run(); return { ...r, data: r.data[0] ?? null }; },
        then(resolve: any, reject: any) { return run().then(resolve, reject); },
      };
      async function run() {
        const rows = table === "orders" ? [order] : table === "payment_checkout_sessions" ? sessions : [];
        if (action === "insert") { const row = { ...payload, id: crypto.randomUUID(), iyzico_token: null, status: "initializing", created_at: new Date().toISOString() }; rows.push(row); return { data: [row], error: null }; }
        const filtered = rows.filter((x) => predicates.every((p) => p(x)));
        if (action === "update") filtered.forEach((x) => Object.assign(x, payload));
        return { data: filtered, error: null };
      }
      return query;
    },
    async rpc(_: string, args: any) {
      if (order.status === "approved") return { data: { outcome: "duplicate" }, error: null };
      assertEquals(args.p_order_id, ID); assertEquals(args.p_amount, 4000);
      order.status = "approved"; calls.activation++; calls.invoice++; calls.notification++;
      Object.assign(sessions[0], { status: "settled", subscription_reference_code: SUB });
      return { data: { outcome: "applied" }, error: null };
    },
  };
  const http: typeof fetch = async (url, init) => {
    const path = String(url);
    let result: any = { status: "success", data: { items: [] } };
    if (path.includes("checkoutform/initialize")) {
      calls.initialize++; const body = JSON.parse(String(init?.body));
      assertEquals(body.pricingPlanReferenceCode, PLAN);
      result = { status: "success", token: "synthetic-token-123", conversationId: body.conversationId, checkoutFormContent: "<div>synthetic</div>" };
    } else if (path.includes("checkoutform/")) {
      calls.retrieve++; result = { status: "success", data: { referenceCode: SUB, customerReferenceCode: CUST, pricingPlanReferenceCode: PLAN } };
    } else if (path.includes(`/subscriptions/${SUB}`)) result = { status: "success", data: { referenceCode: SUB, customerReferenceCode: CUST, pricingPlanReferenceCode: PLAN, subscriptionStatus: "ACTIVE",
      orders: [{ referenceCode: "charge-123", price: 4000, currencyCode: "TRY", orderStatus: "SUCCESS", paymentAttempts: [{ paymentStatus: "SUCCESS", createdDate: Date.now() - 1000 }] }] } };
    return new Response(JSON.stringify(result));
  };
  const handlers: Record<string, (req: Request) => Promise<Response>> = {};
  for (const name of ["create-iyzico-payment", "iyzico-payment-callback", "auto-approve-iyzico-orders"]) {
    const source = (await Deno.readTextFile(new URL(`../${name}/index.ts`, import.meta.url))).replace(/^import[\s\S]*?;\s*$/gm, "");
    const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
    const bindings: Record<string, any> = { ...checkout, supabaseDbPort, serve: (handler: any) => handlers[name] = handler,
      createClient: () => sdk, safeLog: () => {}, fetch: http, console: { log() {}, error() {} },
      verifyAdminOrCron: async () => ({ ok: true }),
      iyzicoHttpPort: (a: string, b: string, c: string) => checkout.iyzicoHttpPort(a, b, c, http),
      Deno: { env: { get: (key: string) => key === "IYZICO_MERCHANT_ID" ? merchant : key === "IYZIPAY_URI" ? "https://synthetic.invalid" : "synthetic-value" } } };
    new Function(...Object.keys(bindings), js)(...Object.values(bindings));
  }
  async function invoke(name: string, body: any, headers: Record<string, string> = {}) {
    const handler = handlers[name]; if (!handler) throw new Error("handler missing");
    return handler(new Request("https://synthetic.invalid", { method: "POST", headers, body: JSON.stringify(body) }));
  }
  return { invoke, calls, order };
}
const input = { orderId: ID, customerData: { email: "synthetic@example.invalid" } };
Deno.test("real initialize handler: missing/invalid ID never contacts provider", async () => {
  const w = await fixture();
  assertEquals((await w.invoke("create-iyzico-payment", {})).status, 400);
  assertEquals((await w.invoke("create-iyzico-payment", { orderId: "wrong" })).status, 400);
  assertEquals(w.calls.initialize, 0);
});
Deno.test("real guest initialize + 20 callback handlers: single activation/invoice/notice", async () => {
  const w = await fixture(); assertEquals((await w.invoke("create-iyzico-payment", input)).status, 200);
  await Promise.all(Array.from({ length: 20 }, () => w.invoke("iyzico-payment-callback", { token: "synthetic-token-123" })));
  assertEquals(w.calls.activation, 1); assertEquals(w.calls.invoice, 1); assertEquals(w.calls.notification, 1);
});
Deno.test("real callback: unknown token and fabricated success do not activate", async () => {
  const w = await fixture(); await w.invoke("iyzico-payment-callback", { token: "wrong-token-123" });
  await w.invoke("iyzico-payment-callback", { status: "success" });
  assertEquals(w.calls.retrieve, 0); assertEquals(w.calls.activation, 0);
});
Deno.test("real cron handler settles token after browser closure", async () => {
  const w = await fixture(); await w.invoke("create-iyzico-payment", input);
  await w.invoke("auto-approve-iyzico-orders", {});
  assertEquals(w.calls.retrieve, 1); assertEquals(w.calls.activation, 1);
});
Deno.test("real webhook: configured merchant rejects missing and bad V3 signatures", async () => {
  const w = await fixture("synthetic-merchant");
  for (const signature of ["", "bad"]) {
    const r = await w.invoke("iyzico-payment-callback", { iyziEventType: "subscription.order.success", subscriptionReferenceCode: SUB }, { "x-iyz-signature-v3": signature });
    assertEquals((await r.json()).reason, "signature");
  }
  assertEquals(w.calls.activation, 0);
});
Deno.test("real webhook: without merchant only provider evidence can activate", async () => {
  const w = await fixture(); await w.invoke("iyzico-payment-callback", { iyziEventType: "subscription.order.success", status: "success" });
  assertEquals(w.calls.activation, 0);
});