// Hoppa (esnekpos) Ortak Ödeme Sayfası ile ilk satın alma. Kart bilgisi sitemize hiç gelmez.
// Tarayıcı/form dönüşüne güvenilmez: sonuç yalnız sunucudan ProcessQuery ile doğrulanır ve
// public.settle_iyzico_payment ile tek işlemde (oturum + makbuz + sipariş) onaylanır.
import { CHECKOUT_TTL_MS, planForOrder, type DbPort, type SessionRow } from "./iyzicoCheckout.ts";

export type HoppaPort = {
  commonPayment: (body: Record<string, unknown>) => Promise<any>;
  processQuery: (orderRef: string) => Promise<any>;
};
export type HoppaDb = DbPort & { readSessionByConversation: (ref: string) => Promise<SessionRow | null> };

export function hoppaHttpPort(merchant: string, key: string, baseUrl: string, http: typeof fetch = fetch): HoppaPort {
  const post = async (path: string, body: unknown) => {
    const r = await http(`${baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    try { return JSON.parse(await r.text()); } catch { return null; }
  };
  return {
    commonPayment: (b) => post("/api/pay/CommonPaymentDealer", { ...b, Config: { ...(b.Config as object), MERCHANT: merchant, MERCHANT_KEY: key } }),
    processQuery: (ref) => post("/api/services/ProcessQuery", { MERCHANT: merchant, MERCHANT_KEY: key, ORDER_REF_NUMBER: ref }),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const HOPPA_REF = /^DO[0-9a-f]{22}$/;
export function newOrderRef(): string {
  return "DO" + Array.from(crypto.getRandomValues(new Uint8Array(11))).map((b) => b.toString(16).padStart(2, "0")).join("");
}
/** "4000", "4000.00", "4.000,00", "4000,00" → 4000 */
export function parseAmount(v: unknown): number | null {
  let s = String(v ?? "").trim();
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
const clean = (v: unknown, fb: string, max = 120) => {
  const s = String(v ?? "").replace(/[<>"'\u0000-\u001f]/g, " ").trim().slice(0, max);
  return s.length ? s : fb;
};

export async function startHoppaCheckout(
  input: { orderId: unknown; customerData: any },
  ports: { db: HoppaDb; hoppa: HoppaPort; backUrl: string; now?: () => number },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const now = ports.now?.() ?? Date.now();
  const orderId = String(input.orderId || "");
  if (!UUID.test(orderId)) return { status: 400, body: { status: "failure", errorCode: "order_required" } };
  const order = await ports.db.readOrder(orderId);
  if (!order || order.deleted_at || order.status !== "pending" || order.payment_method !== "credit_card"
    || order.is_first_order === false) return { status: 409, body: { status: "failure", errorCode: "order_not_payable" } };
  if (now - Date.parse(order.created_at) > CHECKOUT_TTL_MS) return { status: 409, body: { status: "failure", errorCode: "order_expired" } };
  const c = input.customerData || {};
  const email = String(c.email || "").trim().toLowerCase();
  if (!email || email !== String(order.customer_email || "").trim().toLowerCase()) {
    return { status: 403, body: { status: "failure", errorCode: "order_owner_mismatch" } };
  }
  const plan = planForOrder(order.package_type, order.amount);
  if (!plan) return { status: 409, body: { status: "failure", errorCode: "plan_amount_mismatch" } };
  if (await ports.db.readSessionByOrder(order.id)) {
    return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };
  }
  const ref = newOrderRef();
  const session = await ports.db.insertSession({ order_id: order.id, conversation_id: ref, plan_ref: `hoppa:${plan.planRef}`,
    expected_amount: plan.price, currency: "TRY" });
  if (!session) return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };

  const digits = String(c.gsmNumber ?? "").replace(/\D/g, "");
  const amount = plan.price.toFixed(2);
  const r = await ports.hoppa.commonPayment({
    Config: { ORDER_REF_NUMBER: ref, ORDER_AMOUNT: amount, PRICES_CURRENCY: "TRY", BACK_URL: ports.backUrl, LOCALE: "tr" },
    Customer: { FIRST_NAME: clean(c.name, "-", 60), LAST_NAME: clean(c.surname, "-", 60), MAIL: order.customer_email,
      PHONE: digits || "-", CITY: clean(c.city, "-", 60), STATE: clean(c.district || c.city, "-", 60),
      ADDRESS: clean(c.registrationAddress || c.billingAddress, "-", 200) },
    Product: [{ PRODUCT_ID: order.package_type, PRODUCT_NAME: clean(order.package_name, "Doktorum Ol Üyelik"),
      PRODUCT_CATEGORY: "Üyelik", PRODUCT_DESCRIPTION: "Doktorum Ol uzman üyeliği", PRODUCT_AMOUNT: amount }],
  });
  const url = typeof r?.URL_3DS === "string" ? r.URL_3DS : "";
  if (r?.STATUS !== "SUCCESS" || String(r?.RETURN_CODE) !== "0" || !/^https:\/\//.test(url)
    || (r.ORDER_REF_NUMBER && r.ORDER_REF_NUMBER !== ref)) {
    await ports.db.markSession(session.id, "rejected", String(r?.ERROR_CODE || r?.RETURN_CODE || "start_failed").slice(0, 80));
    return { status: 200, body: { status: "failure", errorCode: "start_failed", errorMessage: r?.RETURN_MESSAGE_TR || r?.RETURN_MESSAGE || "Ödeme başlatılamadı" } };
  }
  if (!(await ports.db.bindToken(session.id, `hoppa:${String(r.HASH || ref)}`))) {
    await ports.db.markSession(session.id, "rejected", "token_conflict");
    return { status: 409, body: { status: "failure", errorCode: "token_conflict" } };
  }
  return { status: 200, body: { status: "success", paymentUrl: url, orderId: order.id } };
}

export type HoppaOutcome = { outcome: "applied" | "duplicate" | "pending" | "rejected"; reason?: string; orderId?: string };
/** Form POST içeriğinden yalnız ORDER_REF_NUMBER kullanılır; sonuç sunucu sorgusuyla belirlenir. */
export async function settleHoppaReturn(orderRef: unknown, ports: { db: HoppaDb; hoppa: HoppaPort }): Promise<HoppaOutcome> {
  const ref = String(orderRef || "");
  if (!HOPPA_REF.test(ref)) return { outcome: "rejected", reason: "ref_invalid" };
  const s = await ports.db.readSessionByConversation(ref);
  if (!s) return { outcome: "rejected", reason: "session_missing" };
  if (s.status === "settled") return { outcome: "duplicate", orderId: s.order_id };
  if (s.status !== "initialized") return { outcome: "rejected", reason: "session_state", orderId: s.order_id };
  const q = await ports.hoppa.processQuery(ref);
  if (!q || q.ORDER_REF_NUMBER && q.ORDER_REF_NUMBER !== ref) return { outcome: "pending", reason: "query_unavailable", orderId: s.order_id };
  const txId = q.SUCCESS_TRANSACTION_ID != null ? String(q.SUCCESS_TRANSACTION_ID) : "";
  const ok = q.STATUS === "SUCCESS" && String(q.RETURN_CODE) === "0" && txId && txId !== "0";
  if (!ok) {
    await ports.db.markSession(s.id, "initialized", String(q.RETURN_CODE ?? "not_paid").slice(0, 80));
    return { outcome: "pending", reason: "not_paid", orderId: s.order_id };
  }
  const amt = parseAmount(q.AMOUNT);
  if (amt == null || Math.abs(amt - Number(s.expected_amount)) > 0.005) {
    await ports.db.markSession(s.id, "initialized", "amount_mismatch");
    return { outcome: "rejected", reason: "amount_mismatch", orderId: s.order_id };
  }
  const r = await ports.db.settle({ orderId: s.order_id, paymentKey: `hoppa:${txId}`, subscriptionRef: `hoppa:${ref}`,
    customerRef: "hoppa", chargeRef: String(q.REFNO || txId), amount: amt, currency: "TRY",
    paidAt: new Date().toISOString(), source: "hoppa_common_payment", binding: "checkout_session", sessionId: s.id });
  return { outcome: r.outcome, reason: r.reason, orderId: s.order_id };
}
