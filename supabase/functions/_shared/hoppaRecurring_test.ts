import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { settleHoppaRecurring, startHoppaSubscription, validCard } from "./hoppaRecurring.ts";
const now = Date.parse("2026-11-16T10:00:00Z");
const card = { number: "4531444531442283", month: "12", year: "2030", cvv: "111", owner: "Test User" };
function setup(type = "test-paket-link", amount = 5) {
  const order = { id: "11111111-1111-4111-8111-111111111111", status: "pending", deleted_at: null, amount, package_type: type,
    payment_method: "credit_card", is_first_order: true, customer_email: "a@b.com", created_at: "2026-11-16T09:55:00Z" };
  const sessions: any[] = []; const settled: any[] = [];
  const db: any = { readOrder: async () => order, readSessionByOrder: async () => sessions[0] ?? null,
    insertSession: async (r: any) => { const s = { ...r, id: "s1", status: "initializing" }; sessions.push(s); return s; },
    bindToken: async () => { sessions[0].status = "initialized"; return true; }, markSession: async () => {},
    readSessionByConversation: async (r: string) => sessions.find((s) => s.conversation_id === r) ?? null,
    findPendingBySubscription: async () => [],
    settle: async (a: any) => { if (settled.some((x) => x.paymentKey === a.paymentKey)) return { outcome: "duplicate" }; settled.push(a); sessions[0].status = "settled"; return { outcome: "applied" }; } };
  return { db, sessions, settled };
}
const q = (status: string) => async () => ({ RETURN_CODE: "0", AMOUNT: "5,00", RECURRING_PAYMENT_TRANSACTIONS: [{ RECURRING_NO: 1, STATUS: status, PAYMENT_ID: status === "Başarılı" ? "77" : null }] });
Deno.test("4000 TL paket henüz abonelikle satılmaz", async () => {
  const t = setup("ozel-firsat", 4000);
  const r = await startHoppaSubscription({ orderId: "11111111-1111-4111-8111-111111111111", customerData: { email: "a@b.com" }, card }, { db: t.db, rec: { start: async () => ({}), query: q("x") }, backUrl: "x", now: () => now });
  assertEquals(r.status, 409);
});
Deno.test("5 TL aylık abonelik: tutar 5.00, 12 tekrar, ilk çekim onaylanır bir kez", async () => {
  const t = setup(); let sent: any;
  const rec = { start: async (b: any) => (sent = b, { STATUS: "SUCCESS", RETURN_CODE: "0" }), query: q("Başarılı") };
  const r = await startHoppaSubscription({ orderId: "11111111-1111-4111-8111-111111111111", customerData: { email: "a@b.com" }, card }, { db: t.db, rec, backUrl: "x", now: () => now });
  assertEquals(r.body.state, "applied"); assertEquals(sent.Config.ORDER_AMOUNT, "5.00"); assertEquals(sent.Config.REPEAT, 12);
  await settleHoppaRecurring(t.sessions[0].conversation_id, { db: t.db, rec });
  assertEquals(t.settled.length, 1);
});
Deno.test("çekim bekliyorsa sipariş onaylanmaz", async () => {
  const t = setup();
  const r = await startHoppaSubscription({ orderId: "11111111-1111-4111-8111-111111111111", customerData: { email: "a@b.com" }, card }, { db: t.db, rec: { start: async () => ({ STATUS: "SUCCESS", RETURN_CODE: "0" }), query: q("Bekliyor") }, backUrl: "x", now: () => now });
  assertEquals(r.body.state, "pending"); assertEquals(t.settled.length, 0);
});
Deno.test("geçersiz kart reddedilir", () => { assertEquals(validCard({ ...card, number: "4531444531442284" }), null); });
