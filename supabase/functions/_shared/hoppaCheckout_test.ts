import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseAmount, settleHoppaReturn, startHoppaCheckout, type HoppaDb } from "./hoppaCheckout.ts";
const now = Date.parse("2026-11-16T10:00:00Z");
const order = { id: "11111111-1111-4111-8111-111111111111", status: "pending", deleted_at: null, amount: 4000, package_type: "ozel-firsat",
  payment_method: "credit_card", is_first_order: true, customer_email: "a@b.com", created_at: "2026-11-16T09:55:00Z" };
function db() {
  const sessions: any[] = []; const settled: any[] = [];
  const d = { readOrder: async () => order, readSessionByOrder: async () => sessions[0] ?? null,
    insertSession: async (r: any) => { if (sessions.length) return null; const s = { ...r, id: "s1", status: "initializing", iyzico_token: null }; sessions.push(s); return s; },
    bindToken: async (_: string, t: string) => { sessions[0].iyzico_token = t; sessions[0].status = "initialized"; return true; },
    markSession: async (_: string, st: string) => { sessions[0].status = st; },
    readSessionByConversation: async (r: string) => sessions.find((s) => s.conversation_id === r) ?? null,
    settle: async (a: any) => { if (settled.length) return { outcome: "duplicate" }; settled.push(a); sessions[0].status = "settled"; return { outcome: "applied" }; },
  } as unknown as HoppaDb;
  return { d, sessions, settled };
}
const okStart = { commonPayment: async (b: any) => ({ STATUS: "SUCCESS", RETURN_CODE: "0", URL_3DS: "https://pos.esnekpos.com/x", HASH: "h", ORDER_REF_NUMBER: b.Config.ORDER_REF_NUMBER }) };
Deno.test("tutar her zaman sunucudaki siparişten gelir (4000)", async () => {
  const { d } = db(); let sent: any;
  const r = await startHoppaCheckout({ orderId: order.id, customerData: { email: "a@b.com" } },
    { db: d, now: () => now, backUrl: "https://x", hoppa: { ...okStart, commonPayment: async (b: any) => (sent = b, okStart.commonPayment(b)), processQuery: async () => null } });
  assertEquals(r.status, 200); assertEquals(sent.Config.ORDER_AMOUNT, "4000.00");
});
Deno.test("başka e-posta ödeme başlatamaz", async () => {
  const r = await startHoppaCheckout({ orderId: order.id, customerData: { email: "x@y.com" } }, { db: db().d, now: () => now, backUrl: "x", hoppa: okStart as any });
  assertEquals(r.status, 403);
});
async function started() {
  const t = db();
  await startHoppaCheckout({ orderId: order.id, customerData: { email: "a@b.com" } }, { db: t.d, now: () => now, backUrl: "x", hoppa: okStart as any });
  return { ...t, ref: t.sessions[0].conversation_id };
}
Deno.test("sorgu başarısızsa sipariş onaylanmaz", async () => {
  const t = await started();
  const r = await settleHoppaReturn(t.ref, { db: t.d, hoppa: { processQuery: async () => ({ STATUS: "FAIL", RETURN_CODE: "1" }) } as any });
  assertEquals(r.outcome, "pending"); assertEquals(t.settled.length, 0);
});
Deno.test("eksik tutar onaylanmaz", async () => {
  const t = await started();
  const r = await settleHoppaReturn(t.ref, { db: t.d, hoppa: { processQuery: async () => ({ STATUS: "SUCCESS", RETURN_CODE: "0", SUCCESS_TRANSACTION_ID: 9, AMOUNT: "1,00" }) } as any });
  assertEquals(r.outcome, "rejected"); assertEquals(t.settled.length, 0);
});
Deno.test("doğrulanmış ödeme bir kez onaylanır", async () => {
  const t = await started();
  const hoppa = { processQuery: async () => ({ STATUS: "SUCCESS", RETURN_CODE: "0", SUCCESS_TRANSACTION_ID: 9, AMOUNT: "4.000,00", REFNO: "7" }) } as any;
  assertEquals((await settleHoppaReturn(t.ref, { db: t.d, hoppa })).outcome, "applied");
  assertEquals((await settleHoppaReturn(t.ref, { db: t.d, hoppa })).outcome, "duplicate");
  assertEquals(t.settled.length, 1);
});
Deno.test("tutar biçimleri", () => { assertEquals(parseAmount("4.000,00"), 4000); assertEquals(parseAmount("5000.00"), 5000); });
