import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handlePaytrNotify, hmacB64, startPaytrCheckout, type PaytrDb } from "./paytrCheckout.ts";
const now = Date.parse("2026-11-16T10:00:00Z");
const creds = { merchantId: "1", key: "k", salt: "s" };
const order = { id: "11111111-1111-4111-8111-111111111111", status: "pending", deleted_at: null, amount: 4000, package_type: "ozel-firsat",
  package_name: "Premium", payment_method: "credit_card", is_first_order: true, customer_email: "a@b.com", created_at: "2026-11-16T09:55:00Z" };
function db() {
  const sessions: any[] = []; const settled: any[] = [];
  const d = { readOrder: async () => order, readSessionByOrder: async () => sessions[0] ?? null,
    insertSession: async (r: any) => { if (sessions.length) return null; const s = { ...r, id: "s1", status: "initializing" }; sessions.push(s); return s; },
    bindToken: async () => { sessions[0].status = "initialized"; return true; },
    markSession: async (_: string, st: string) => { sessions[0].status = st; },
    readSessionByConversation: async (r: string) => sessions.find((s) => s.conversation_id === r) ?? null,
    settle: async (a: any) => { if (settled.length) return { outcome: "duplicate" }; settled.push(a); sessions[0].status = "settled"; return { outcome: "applied" }; },
  } as unknown as PaytrDb;
  return { d, sessions, settled };
}
async function started() {
  const t = db(); let sent: any;
  const r = await startPaytrCheckout({ orderId: order.id, customerData: { email: "a@b.com" }, userIp: "1.2.3.4" },
    { db: t.d, creds, okUrl: "x", failUrl: "y", now: () => now, paytr: { getToken: async (f) => (sent = f, { status: "success", token: "abc123" }) } });
  return { ...t, r, sent, oid: t.sessions[0]?.conversation_id };
}
const notify = async (oid: string, status: string, amount: string, key = "k") =>
  new URLSearchParams({ merchant_oid: oid, status, total_amount: amount, payment_amount: amount, hash: await hmacB64(key, oid + "s" + status + amount) });
Deno.test("tutar sunucudaki siparişten gelir: 4000 TL = 400000 kuruş", async () => {
  const t = await started();
  assertEquals(t.sent.payment_amount, "400000"); assertEquals(t.r.body.paymentUrl, "https://www.paytr.com/odeme/guvenli/abc123");
});
Deno.test("başka e-posta ödeme başlatamaz", async () => {
  const r = await startPaytrCheckout({ orderId: order.id, customerData: { email: "x@y.com" }, userIp: "" },
    { db: db().d, creds, okUrl: "x", failUrl: "y", now: () => now, paytr: { getToken: async () => ({}) } });
  assertEquals(r.status, 403);
});
Deno.test("imzası yanlış bildirim siparişi onaylamaz", async () => {
  const t = await started();
  const r = await handlePaytrNotify(await notify(t.oid, "success", "400000", "wrong"), { db: t.d, creds });
  assertEquals(r.ack, false); assertEquals(t.settled.length, 0);
});
Deno.test("eksik tutarlı bildirim onaylamaz", async () => {
  const t = await started();
  await handlePaytrNotify(await notify(t.oid, "success", "100"), { db: t.d, creds });
  assertEquals(t.settled.length, 0);
});
Deno.test("başarılı bildirim bir kez onaylar, tekrar gelirse çift onay olmaz", async () => {
  const t = await started();
  const a = await handlePaytrNotify(await notify(t.oid, "success", "400000"), { db: t.d, creds });
  const b = await handlePaytrNotify(await notify(t.oid, "success", "400000"), { db: t.d, creds });
  assertEquals([a.outcome, b.outcome, t.settled.length, t.settled[0].amount], ["applied", "duplicate", 1, 4000]);
});
