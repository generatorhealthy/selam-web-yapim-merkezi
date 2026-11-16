// Hoppa tekrarlı ödeme (aylık abonelik). Kart bilgisi yalnız bu istekte Hoppa'ya iletilir;
// hiçbir yerde saklanmaz/loglanmaz. Ödeme yalnız RecurringPaymentQuery sonucuyla onaylanır.
import { CHECKOUT_TTL_MS } from "./iyzicoCheckout.ts";
import { HOPPA_PRICES, HOPPA_REF, newOrderRef, parseAmount, type HoppaDb } from "./hoppaCheckout.ts";

/** Şimdilik yalnız test paketi abonelikle satılır. */
export const RECURRING_TYPES = new Set(["test-paket-link"]);
export const RECURRING_REPEAT = 12;
export const RECURRING_TRIES = 3;

export type RecurringPort = {
  start: (body: Record<string, unknown>) => Promise<any>;
  query: (ref: string) => Promise<any>;
};
export function recurringHttpPort(merchant: string, key: string, baseUrl: string, http: typeof fetch = fetch): RecurringPort {
  const post = async (path: string, body: unknown) => {
    const r = await http(`${baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    try { return JSON.parse(await r.text()); } catch { return null; }
  };
  return {
    start: (b) => post("/api/pay/RecurringPayment", { ...b, Config: { ...(b.Config as object), MERCHANT: merchant, MERCHANT_KEY: key } }),
    query: (ref) => post("/api/services/RecurringPaymentQuery", { MERCHANT: merchant, MERCHANT_KEY: key, ORDER_REF_NUMBER: ref }),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function luhn(n: string) {
  let sum = 0, alt = false;
  for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; }
  return sum % 10 === 0;
}
export function validCard(c: any, now = new Date()): { number: string; month: string; year: string; cvv: string; owner: string } | null {
  const number = String(c?.number ?? "").replace(/\D/g, "");
  const month = String(c?.month ?? "").padStart(2, "0");
  let year = String(c?.year ?? "").replace(/\D/g, ""); if (year.length === 2) year = "20" + year;
  const cvv = String(c?.cvv ?? "").replace(/\D/g, "");
  const owner = String(c?.owner ?? "").replace(/[<>"'\u0000-\u001f]/g, " ").trim().slice(0, 60);
  if (number.length < 15 || number.length > 19 || !luhn(number)) return null;
  const m = +month, y = +year;
  if (!(m >= 1 && m <= 12) || year.length !== 4) return null;
  if (y < now.getUTCFullYear() || (y === now.getUTCFullYear() && m < now.getUTCMonth() + 1)) return null;
  if (cvv.length < 3 || cvv.length > 4 || owner.length < 3) return null;
  return { number, month, year, cvv, owner };
}
export function istanbulDate(ms: number): string {
  return new Date(ms + 3 * 3600_000).toISOString().slice(0, 10);
}
const clean = (v: unknown, fb: string, max = 120) => {
  const s = String(v ?? "").replace(/[<>"'\u0000-\u001f]/g, " ").trim().slice(0, max);
  return s.length ? s : fb;
};

export async function startHoppaSubscription(
  input: { orderId: unknown; customerData: any; card: any; clientIp?: string },
  ports: { db: HoppaDb; rec: RecurringPort; backUrl: string; now?: () => number },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const now = ports.now?.() ?? Date.now();
  const orderId = String(input.orderId || "");
  if (!UUID.test(orderId)) return { status: 400, body: { status: "failure", errorCode: "order_required" } };
  const order = await ports.db.readOrder(orderId);
  if (!order || order.deleted_at || order.status !== "pending" || order.payment_method !== "credit_card"
    || order.is_first_order === false || !RECURRING_TYPES.has(order.package_type)) {
    return { status: 409, body: { status: "failure", errorCode: "order_not_payable" } };
  }
  if (now - Date.parse(order.created_at) > CHECKOUT_TTL_MS) return { status: 409, body: { status: "failure", errorCode: "order_expired" } };
  const c = input.customerData || {};
  if (String(c.email || "").trim().toLowerCase() !== String(order.customer_email || "").trim().toLowerCase()) {
    return { status: 403, body: { status: "failure", errorCode: "order_owner_mismatch" } };
  }
  const price = HOPPA_PRICES[order.package_type];
  if (price == null || Math.abs(price - Number(order.amount)) > 0.005) return { status: 409, body: { status: "failure", errorCode: "plan_amount_mismatch" } };
  const card = validCard(input.card, new Date(now));
  if (!card) return { status: 400, body: { status: "failure", errorCode: "card_invalid", errorMessage: "Kart bilgilerini kontrol edin." } };
  if (await ports.db.readSessionByOrder(order.id)) return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };
  const ref = newOrderRef();
  const session = await ports.db.insertSession({ order_id: order.id, conversation_id: ref, plan_ref: `hoppa-rec:${order.package_type}`,
    expected_amount: price, currency: "TRY" });
  if (!session) return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };

  const r = await ports.rec.start({
    Config: { BACK_URL: ports.backUrl, PRICES_CURRENCY: "TRY", ORDER_REF_NUMBER: ref, ORDER_AMOUNT: price.toFixed(2),
      REPEAT: RECURRING_REPEAT, TRIES_COUNT: String(RECURRING_TRIES), START_DATE: istanbulDate(now) },
    Cards: [{ CC_NUMBER: card.number, EXP_MONTH: card.month, EXP_YEAR: card.year, CC_CVV: card.cvv, CC_OWNER: card.owner }],
    Customer: { FIRST_NAME: clean(c.name, "-", 60), LAST_NAME: clean(c.surname, "-", 60), MAIL: order.customer_email,
      PHONE: String(c.gsmNumber ?? "").replace(/\D/g, "") || "-", CITY: clean(c.city, "-", 60), STATE: clean(c.district || c.city, "-", 60),
      ADDRESS: clean(c.registrationAddress, "-", 200), CLIENT_IP: clean(input.clientIp, "-", 45) },
  });
  if (r?.STATUS !== "SUCCESS" || String(r?.RETURN_CODE) !== "0") {
    await ports.db.markSession(session.id, "rejected", String(r?.RETURN_CODE ?? "start_failed").slice(0, 80));
    return { status: 200, body: { status: "failure", errorCode: "start_failed", errorMessage: r?.RETURN_MESSAGE || "Abonelik başlatılamadı" } };
  }
  if (!(await ports.db.bindToken(session.id, `hoppa-rec:${ref}`))) {
    await ports.db.markSession(session.id, "rejected", "token_conflict");
    return { status: 409, body: { status: "failure", errorCode: "token_conflict" } };
  }
  const settled = await settleHoppaRecurring(ref, ports);
  return { status: 200, body: { status: "success", orderId: order.id, state: settled.first ?? "pending" } };
}

const ok = (t: any) => /ba[sş]ar[ıi]l[ıi]|success/i.test(String(t?.STATUS ?? "")) && t?.PAYMENT_ID != null && String(t.PAYMENT_ID) !== "";

/** Sorgudaki her başarılı tekrarı tek kez işler: 1. tekrar ilk siparişi, sonrakiler bekleyen yenilemeyi onaylar. */
export async function settleHoppaRecurring(orderRef: unknown, ports: { db: HoppaDb; rec: RecurringPort }):
  Promise<{ first?: "applied" | "duplicate" | "pending" | "rejected"; renewals: number; reason?: string }> {
  const ref = String(orderRef || "");
  if (!HOPPA_REF.test(ref)) return { renewals: 0, reason: "ref_invalid" };
  const s = await ports.db.readSessionByConversation(ref);
  if (!s || !String(s.plan_ref).startsWith("hoppa-rec:")) return { renewals: 0, reason: "session_missing" };
  const q = await ports.rec.query(ref);
  if (!q || String(q.RETURN_CODE) !== "0" || (q.DEALER_REF_NO && q.DEALER_REF_NO !== ref)) return { first: "pending", renewals: 0, reason: "query_unavailable" };
  const amt = parseAmount(q.AMOUNT);
  if (amt == null || Math.abs(amt - Number(s.expected_amount)) > 0.005) return { first: "rejected", renewals: 0, reason: "amount_mismatch" };
  const txs: any[] = Array.isArray(q.RECURRING_PAYMENT_TRANSACTIONS) ? q.RECURRING_PAYMENT_TRANSACTIONS : [];
  let first: "applied" | "duplicate" | "pending" | "rejected" = s.status === "settled" ? "duplicate" : "pending";
  let renewals = 0;
  for (const t of txs.filter(ok).sort((a, b) => Number(a.RECURRING_NO) - Number(b.RECURRING_NO))) {
    const no = Number(t.RECURRING_NO);
    const base = { paymentKey: `hoppa:rec:${t.PAYMENT_ID}`, subscriptionRef: `hoppa:${ref}`, customerRef: "hoppa",
      chargeRef: String(t.REF_NO ?? t.PAYMENT_ID), amount: amt, currency: "TRY", paidAt: new Date().toISOString(), source: "hoppa_recurring" };
    if (no === 1) {
      if (s.status === "settled") continue;
      const r = await ports.db.settle({ ...base, orderId: s.order_id, binding: "checkout_session", sessionId: s.id });
      first = r.outcome;
    } else {
      const pending = await ports.db.findPendingBySubscription(`hoppa:${ref}`);
      if (!pending.length) continue;
      const r = await ports.db.settle({ ...base, orderId: pending[pending.length - 1].id, binding: "subscription_ref", sessionId: null });
      if (r.outcome === "applied") renewals++;
    }
  }
  return { first, renewals };
}
