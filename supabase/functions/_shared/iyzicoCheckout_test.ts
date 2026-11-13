// Sentetik portlarla gerçek üretim kodu (iyzicoCheckout.ts). Ağ, gerçek kart, müşteri veya fatura yok.
import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { type DbPort, type IyzicoPort, type OrderRow, type SessionRow, type SettleArgs, planForOrder, settleByToken, settleSubscriptionCharge, startCheckout } from "./iyzicoCheckout.ts";

const PLAN = "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652";
const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const SUB = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", CUST = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const subscription = (price = 4000, status = "SUCCESS") => ({ status: "success", data: { referenceCode: SUB, customerReferenceCode: CUST,
  pricingPlanReferenceCode: PLAN, subscriptionStatus: "ACTIVE", orders: [{ referenceCode: "charge-1", price, currencyCode: "TRY", orderStatus: status,
  paymentAttempts: [{ paymentStatus: status, createdDate: Date.now() - 1000, paymentId: "9001" }] }] } });

function world(o: Partial<OrderRow> = {}) {
  const order: OrderRow = { id: ORDER_ID, status: "pending", deleted_at: null, amount: 4000, package_type: "ozel-firsat", payment_method: "credit_card",
    is_first_order: true, customer_email: "Buyer@Example.invalid", created_at: new Date().toISOString(), subscription_reference_code: null, ...o };
  const orders = new Map<string, OrderRow>([[order.id, order]]);
  const sessions: SessionRow[] = []; const receipts = new Set<string>(); const t = { initialize: 0, retrieve: 0, settle: 0, applied: 0, provider: [] as any[] };
  let lock = Promise.resolve();
  const db: DbPort = {
    readOrder: async (id) => orders.get(id) ?? null,
    readSessionByOrder: async (id) => sessions.find((s) => s.order_id === id) ?? null,
    readSessionByToken: async (tok) => sessions.find((s) => s.iyzico_token === tok) ?? null,
    readSessionBySubscription: async (r) => sessions.find((s) => s.subscription_reference_code === r) ?? null,
    insertSession: async (row) => { if (sessions.some((s) => s.order_id === row.order_id)) return null;
      const s = { ...row, id: crypto.randomUUID(), iyzico_token: null, status: "initializing", subscription_reference_code: null, created_at: new Date().toISOString() } as SessionRow; sessions.push(s); return s; },
    resetSession: async () => true,
    bindToken: async (id, tok) => { if (sessions.some((s) => s.iyzico_token === tok)) return false; const s = sessions.find((x) => x.id === id)!; if (s.iyzico_token) return false; s.iyzico_token = tok; s.status = "initialized"; return true; },
    markSession: async (id, st) => { sessions.find((s) => s.id === id)!.status = st; },
    listOpenSessions: async () => sessions.filter((s) => s.status === "initialized"),
    // SQL işleminin semantiği (gerçek SQL eşzamanlılığı concurrency_pg.sh ile ayrıca sınanır): kilit + benzersiz makbuz
    settle: (a: SettleArgs) => { t.settle++; const run = lock.then(async () => {
      const ord = orders.get(a.orderId)!; if (receipts.has(a.paymentKey)) return { outcome: "duplicate" as const };
      if (ord.status !== "pending") return { outcome: "rejected" as const, reason: "order_not_pending" };
      if (Math.abs(ord.amount - a.amount) > 0.005) return { outcome: "rejected" as const, reason: "amount_mismatch" };
      if (!a.sessionId && ord.is_first_order) return { outcome: "rejected" as const, reason: "first_order_requires_session" };
      receipts.add(a.paymentKey); ord.status = "approved"; t.applied++;
      if (a.sessionId) { const s = sessions.find((x) => x.id === a.sessionId)!; s.status = "settled"; s.subscription_reference_code = a.subscriptionRef; }
      return { outcome: "applied" as const, order_id: a.orderId }; }); lock = run.then(() => {}); return run; },
    findPendingBySubscription: async (r) => [...orders.values()].filter((x) => x.subscription_reference_code === r && x.status === "pending"),
    findPendingRenewalsByEmail: async (e) => [...orders.values()].filter((x) => x.customer_email.toLowerCase() === e && x.status === "pending"),
    automaticOrderSubscription: async () => ({ exists: true, subscriptionRef: null }),
    hasApprovedOrder: async () => true,
  };
  let sub: any = subscription(); let form: any = null;
  const iyzico: IyzicoPort = {
    initialize: async (b) => { t.initialize++; t.provider.push(b); return { status: "success", token: `tok-${t.initialize}-abcdef`, conversationId: b.conversationId, checkoutFormContent: "<script></script>" }; },
    retrieveCheckout: async (tok) => { t.retrieve++; return form ?? { status: "success", data: { token: tok, referenceCode: SUB, pricingPlanReferenceCode: PLAN, customerReferenceCode: CUST, subscriptionStatus: "ACTIVE" } }; },
    subscription: async () => sub,
  };
  return { db, iyzico, orders, sessions, t, setSub: (s: any) => (sub = s), setForm: (f: any) => (form = f), order };
}
const customer = { name: "Synthetic", surname: "Buyer", email: "buyer@example.invalid", gsmNumber: "05000000000", identityNumber: "11111111111" };
const start = (w: ReturnType<typeof world>, extra: Record<string, unknown> = {}) =>
  startCheckout({ orderId: ORDER_ID, customerData: customer, ...extra }, { db: w.db, iyzico: w.iyzico, callbackUrl: "https://cb.invalid" });

Deno.test("girişsiz satın alma: plan/tutar kayıtlı siparişten, token+conversationId siparişe bağlanır", async () => {
  const w = world(); const r = await start(w, { packageType: "kayit-linki", amount: 5000 });
  assertEquals(r.status, 200); assertEquals(w.t.provider[0].pricingPlanReferenceCode, PLAN);
  assertEquals(w.t.provider[0].conversationId, w.sessions[0].conversation_id); assertEquals(w.sessions[0].iyzico_token, r.body.token);
  assertEquals(w.sessions[0].expected_amount, 4000); assertEquals(w.t.provider[0].customer.email, "Buyer@Example.invalid");
});
Deno.test("başka e-posta ile sipariş başlatılamaz; aynı siparişe ikinci oturum yok", async () => {
  const w = world(); assertEquals((await startCheckout({ orderId: ORDER_ID, customerData: { ...customer, email: "x@y.invalid" } }, { db: w.db, iyzico: w.iyzico, callbackUrl: "" })).status, 403);
  assertEquals((await start(w)).status, 200); assertEquals((await start(w)).status, 409); assertEquals(w.t.initialize, 1);
});
Deno.test("plan fiyatıyla uyuşmayan sipariş tutarı başlatılmaz; süresi geçmiş sipariş başlatılmaz", async () => {
  assertEquals((await start(world({ amount: 1 }))).body.errorCode, "plan_amount_mismatch");
  assertEquals((await start(world({ created_at: new Date(Date.now() - 31 * 60_000).toISOString() }))).body.errorCode, "order_expired");
  assertEquals(planForOrder("premium", 4998)?.planRef, "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94");
});
Deno.test("başarılı ödeme: kayıtlı token ile Retrieve + tahsilat doğrulanır, tek onay", async () => {
  const w = world(); const r = await start(w); const out = await settleByToken(r.body.token, "cb", w);
  assertEquals(out.outcome, "applied"); assertEquals(w.t.retrieve, 1); assertEquals(w.order.status, "approved");
});
Deno.test("sahte callback / yanlış token: Retrieve yok, onay yok", async () => {
  const w = world(); await start(w);
  assertEquals((await settleByToken("forged-token-123", "cb", w)).outcome, "rejected");
  assertEquals((await settleByToken("", "cb", w)).outcome, "rejected"); assertEquals(w.t.retrieve, 0); assertEquals(w.t.settle, 0);
});
Deno.test("yanlış tutar / başarısız tahsilat / başka plan / başka conversation: onay yok", async () => {
  for (const [sub, form] of [[subscription(2398), null], [subscription(4000, "FAILURE"), null],
    [null, { status: "success", data: { referenceCode: SUB, pricingPlanReferenceCode: "29429127-2e4f-48ee-a2b7-708a068de378" } }],
    [null, { status: "success", data: { referenceCode: SUB, pricingPlanReferenceCode: PLAN, conversationId: "other" } }]] as const) {
    const w = world(); const r = await start(w); if (sub) w.setSub(sub); if (form) w.setForm(form);
    const out = await settleByToken(r.body.token, "cb", w);
    assertEquals(out.outcome === "applied", false); assertEquals(w.order.status, "pending"); assertEquals(w.t.applied, 0);
  }
});
Deno.test("20 eşzamanlı aynı başarılı callback: 1 aktivasyon, 19 önceden işlenmiş", async () => {
  const w = world(); const r = await start(w);
  const res = await Promise.all(Array.from({ length: 20 }, () => settleByToken(r.body.token, "cb", w)));
  assertEquals(res.filter((x) => x.outcome === "applied").length, 1); assertEquals(res.filter((x) => x.outcome === "duplicate").length, 19); assertEquals(w.t.applied, 1);
});
Deno.test("tarayıcı kapandı: callback hiç gelmese de cron kayıtlı token ile kesinleştirir; abonelik olayı tekrar onaylamaz", async () => {
  const w = world(); await start(w);
  for (const s of await w.db.listOpenSessions("")) assertEquals((await settleByToken(s.iyzico_token, "auto", w)).outcome, "applied");
  assertEquals((await settleSubscriptionCharge(subscription(), SUB, "event", w, "buyer@example.invalid")).outcome, "duplicate"); assertEquals(w.t.applied, 1);
});
Deno.test("auto-approve: oturumsuz ilk sipariş yalnız e-posta eşleşmesiyle onaylanmaz", async () => {
  const w = world(); const out = await settleSubscriptionCharge(subscription(), SUB, "auto", w, "buyer@example.invalid");
  assertEquals(out.outcome, "rejected"); assertEquals(w.order.status, "pending");
});
Deno.test("auto-approve: abonelik koduyla bağlı yenileme siparişi doğrulanmış tahsilatla bir kez onaylanır", async () => {
  const w = world({ is_first_order: false, subscription_reference_code: SUB });
  assertEquals((await settleSubscriptionCharge(subscription(), SUB, "auto", w, null)).outcome, "applied");
  assertEquals((await settleSubscriptionCharge(subscription(), SUB, "auto", w, null)).outcome === "applied", false);
  const w2 = world({ is_first_order: false, subscription_reference_code: SUB });
  assertEquals((await settleSubscriptionCharge(subscription(3600), SUB, "auto", w2, null)).outcome, "rejected");
});
