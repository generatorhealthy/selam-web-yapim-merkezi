// PayTR iFrame API ile ilk satın alma. Kart bilgisi sitemize hiç gelmez; PayTR sayfasında girilir.
// Tarayıcı dönüşüne güvenilmez: sipariş yalnız imzası doğrulanmış PayTR Bildirim URL çağrısıyla,
// public.settle_iyzico_payment üzerinden tek işlemde (oturum + makbuz + sipariş) onaylanır.
import { CHECKOUT_TTL_MS } from "./iyzicoCheckout.ts";
import type { HoppaDb as PaytrDb } from "./hoppaCheckout.ts";
export type { PaytrDb };

/** Yeni satışta izinli paketler ve tutarları (DB guard ile aynı). test-paket-link GEÇİCİ. */
export const PAYTR_PRICES: Record<string, number> = { "ozel-firsat": 4000, "kayit-linki": 5000, "test-paket-link": 5 };
export type PaytrCreds = { merchantId: string; key: string; salt: string };
export type PaytrPort = { getToken: (form: Record<string, string>) => Promise<any> };

export async function hmacB64(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
  return btoa(String.fromCharCode(...sig));
}
const b64utf8 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

export function paytrHttpPort(http: typeof fetch = fetch): PaytrPort {
  return { getToken: async (form) => {
    const r = await http("https://www.paytr.com/odeme/api/get-token", { method: "POST", body: new URLSearchParams(form) });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { status: "failed", reason: `http_${r.status}:${t.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)}` }; }
  } };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PAYTR_OID = /^DP[0-9a-f]{22}$/;
export const newOid = () => "DP" + Array.from(crypto.getRandomValues(new Uint8Array(11))).map((b) => b.toString(16).padStart(2, "0")).join("");
const clean = (v: unknown, fb: string, max = 120) => {
  const s = String(v ?? "").replace(/[<>"'\u0000-\u001f]/g, " ").trim().slice(0, max);
  return s.length ? s : fb;
};

export async function startPaytrCheckout(
  input: { orderId: unknown; customerData: any; userIp: string },
  ports: { db: PaytrDb; paytr: PaytrPort; creds: PaytrCreds; okUrl: string; failUrl: string; testMode?: boolean; now?: () => number },
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
  const price = PAYTR_PRICES[String(order.package_type || "")];
  if (price == null || Math.abs(price - Number(order.amount)) > 0.005) return { status: 409, body: { status: "failure", errorCode: "plan_amount_mismatch" } };
  if (await ports.db.readSessionByOrder(order.id)) return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };
  const oid = newOid();
  const session = await ports.db.insertSession({ order_id: order.id, conversation_id: oid, plan_ref: `paytr:${order.package_type}`,
    expected_amount: price, currency: "TRY" });
  if (!session) return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };

  const { merchantId, key, salt } = ports.creds;
  const amount = String(Math.round(price * 100));
  const basket = b64utf8(JSON.stringify([[clean(order.package_name, "Doktorum Ol Üyelik"), price.toFixed(2), 1]]));
  const testMode = ports.testMode ? "1" : "0";
  const ip = String(input.userIp || "").slice(0, 39);
  const hashStr = merchantId + ip + oid + order.customer_email + amount + basket + "1" + "0" + "TL" + testMode;
  const form = {
    merchant_id: merchantId, user_ip: ip, merchant_oid: oid, email: order.customer_email, payment_amount: amount,
    paytr_token: await hmacB64(key, hashStr + salt), user_basket: basket, debug_on: "0", no_installment: "1", max_installment: "0",
    user_name: clean(`${c.name ?? ""} ${c.surname ?? ""}`, "-", 60), user_address: clean(c.registrationAddress || c.billingAddress || c.city, "-", 200),
    user_phone: String(c.gsmNumber ?? "").replace(/\D/g, "").slice(-12) || "0", merchant_ok_url: ports.okUrl, merchant_fail_url: ports.failUrl,
    timeout_limit: "30", currency: "TL", test_mode: testMode, lang: "tr",
  };
  const r = await ports.paytr.getToken(form);
  if (r?.status !== "success" || typeof r.token !== "string" || !/^[A-Za-z0-9_-]+$/.test(r.token)) {
    await ports.db.markSession(session.id, "rejected", String(r?.reason || "start_failed").slice(0, 80));
    console.log("paytr reason:", String(r?.status), String(r?.reason || "none").slice(0, 120));
    return { status: 200, body: { status: "failure", errorCode: "start_failed", errorMessage: "Ödeme başlatılamadı" } };
  }
  if (!(await ports.db.bindToken(session.id, `paytr:${oid}`))) {
    await ports.db.markSession(session.id, "rejected", "token_conflict");
    return { status: 409, body: { status: "failure", errorCode: "token_conflict" } };
  }
  return { status: 200, body: { status: "success", paymentUrl: `https://www.paytr.com/odeme/guvenli/${r.token}`, orderId: order.id } };
}

export type PaytrOutcome = { ack: boolean; outcome: string; reason?: string };
/** PayTR Bildirim URL. ack=true ise PayTR'ye "OK" dönülür (tekrar göndermez). */
export async function handlePaytrNotify(p: URLSearchParams, ports: { db: PaytrDb; creds: PaytrCreds }): Promise<PaytrOutcome> {
  const oid = p.get("merchant_oid") || "", status = p.get("status") || "", total = p.get("total_amount") || "", hash = p.get("hash") || "";
  const expect = await hmacB64(ports.creds.key, oid + ports.creds.salt + status + total);
  if (!hash || hash !== expect) return { ack: false, outcome: "rejected", reason: "bad_hash" };
  if (!PAYTR_OID.test(oid)) return { ack: true, outcome: "rejected", reason: "oid_invalid" };
  const s = await ports.db.readSessionByConversation(oid);
  if (!s) return { ack: true, outcome: "rejected", reason: "session_missing" };
  if (s.status === "settled") return { ack: true, outcome: "duplicate" };
  if (s.status !== "initialized") return { ack: true, outcome: "rejected", reason: "session_state" };
  if (status !== "success") {
    await ports.db.markSession(s.id, "rejected", String(p.get("failed_reason_code") || "failed").slice(0, 80));
    return { ack: true, outcome: "failed" };
  }
  const paid = Number(p.get("payment_amount") || "") / 100;
  if (!Number.isFinite(paid) || Math.abs(paid - Number(s.expected_amount)) > 0.005) {
    await ports.db.markSession(s.id, "initialized", "amount_mismatch");
    return { ack: true, outcome: "rejected", reason: "amount_mismatch" };
  }
  const r = await ports.db.settle({ orderId: s.order_id, paymentKey: `paytr:${oid}`, subscriptionRef: `paytr:${oid}`,
    customerRef: "paytr", chargeRef: oid, amount: paid, currency: "TRY", paidAt: new Date().toISOString(),
    source: "paytr_iframe", binding: "checkout_session", sessionId: s.id });
  // Geçici DB hatasında OK dönmeyiz ki PayTR yeniden göndersin.
  return { ack: r.outcome === "applied" || r.outcome === "duplicate" || r.outcome === "rejected", outcome: r.outcome, reason: r.reason };
}
