// Gerçek iyzico yeni satın alma / onay yolu (create-iyzico-payment, iyzico-payment-callback,
// auto-approve-iyzico-orders bu dosyayı kullanır). Ağ ve veritabanı yalnız enjekte edilen
// portlar üzerinden çağrılır; testler aynı kodu sentetik portlarla çalıştırır.
import { parseIyzicoSubscription } from "./paymentGuard.ts";

/** iyzico'da GET ile doğrulanmış altı abonelik planı ve gerçek çekim tutarı (TRY, aylık). */
export const PLAN_PRICES: Record<string, number> = {
  "e01a059d-9392-4690-b030-0002064f9421": 2398, // campaign
  "205eb35c-e122-401f-aef7-618daf3732f8": 2998, // basic
  "92feac6d-1181-4b78-b0c2-3b5d5742adff": 3600, // professional / special-offer
  "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94": 4998, // premium
  "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652": 4000, // ozel-firsat
  "29429127-2e4f-48ee-a2b7-708a068de378": 5000, // kayit-linki
};
const TYPE_PLAN: Record<string, string> = {
  "kayit-linki": "29429127-2e4f-48ee-a2b7-708a068de378",
  "ozel-firsat": "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652",
  "special-offer": "92feac6d-1181-4b78-b0c2-3b5d5742adff",
  "professional": "92feac6d-1181-4b78-b0c2-3b5d5742adff",
  "campaign": "e01a059d-9392-4690-b030-0002064f9421",
  "basic": "205eb35c-e122-401f-aef7-618daf3732f8",
  "premium": "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94",
};
export const CHECKOUT_TTL_MS = 30 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REF = /^[A-Za-z0-9-]{8,64}$/;

/** Plan yalnız kayıtlı siparişten seçilir; plan tutarı sipariş tutarına eşit olmalı. */
export function planForOrder(packageType: unknown, amount: unknown): { planRef: string; price: number } | null {
  const amt = Number(amount);
  let planRef = TYPE_PLAN[String(packageType || "").toLowerCase()];
  if (!planRef) planRef = Object.keys(PLAN_PRICES).find((p) => PLAN_PRICES[p] === amt) ?? "";
  if (!planRef) return null;
  const price = PLAN_PRICES[planRef];
  return Math.abs(price - amt) <= 0.005 ? { planRef, price } : null;
}
/** Eski istemci (orderId göndermeyen) için: plan yalnız paket tipinden, istemci tutarı yok sayılır. */
export function legacyPlanForType(packageType: unknown): string {
  return TYPE_PLAN[String(packageType || "").toLowerCase()] || TYPE_PLAN.basic;
}

export async function iyzicoAuthHeader(apiKey: string, secretKey: string, uriPath: string, body = "") {
  const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(randomKey + uriPath + body));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { authorization: `IYZWSv2 ${btoa(`apiKey:${apiKey}&randomKey:${randomKey}&signature:${hex}`)}`, randomKey };
}

export type IyzicoPort = {
  initialize: (body: Record<string, unknown>) => Promise<any>;
  retrieveCheckout: (token: string) => Promise<any>;
  subscription: (ref: string) => Promise<any>;
};

/** Gerçek iyzico HTTP portu (fetch enjekte edilebilir). */
export function iyzicoHttpPort(apiKey: string, secretKey: string, baseUrl: string, http: typeof fetch = fetch): IyzicoPort {
  const call = async (method: "GET" | "POST", path: string, body?: string) => {
    const { authorization, randomKey } = await iyzicoAuthHeader(apiKey, secretKey, path, body ?? "");
    const res = await http(`${baseUrl}${path}${method === "POST" ? "?locale=tr" : ""}`, {
      method, body,
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: authorization, "x-iyzi-rnd": randomKey },
    });
    try { return JSON.parse(await res.text()); } catch { return null; }
  };
  return {
    initialize: (b) => call("POST", "/v2/subscription/checkoutform/initialize", JSON.stringify(b)),
    retrieveCheckout: (t) => call("GET", `/v2/subscription/checkoutform/${encodeURIComponent(t)}`),
    subscription: (r) => call("GET", `/v2/subscription/subscriptions/${encodeURIComponent(r)}`),
  };
}

export type OrderRow = { id: string; status: string; deleted_at: string | null; amount: number; package_type: string;
  payment_method: string; is_first_order: boolean | null; customer_email: string; customer_name?: string;
  package_name?: string; created_at: string; subscription_reference_code?: string | null };
export type SessionRow = { id: string; order_id: string; conversation_id: string; iyzico_token: string | null;
  plan_ref: string; expected_amount: number; currency: string; status: string; subscription_reference_code: string | null; created_at: string };
export type SettleArgs = { orderId: string; paymentKey: string; subscriptionRef: string; customerRef: string; chargeRef: string;
  amount: number; currency: string; paidAt: string; source: string; binding: string; sessionId: string | null };
export type SettleResult = { outcome: "applied" | "duplicate" | "rejected"; reason?: string; order_id?: string };

export type DbPort = {
  readOrder: (id: string) => Promise<OrderRow | null>;
  readSessionByOrder: (orderId: string) => Promise<SessionRow | null>;
  readSessionByToken: (token: string) => Promise<SessionRow | null>;
  readSessionBySubscription: (ref: string) => Promise<SessionRow | null>;
  /** INSERT; benzersizlik çakışmasında null */
  insertSession: (row: Omit<SessionRow, "id" | "iyzico_token" | "status" | "subscription_reference_code" | "created_at">) => Promise<SessionRow | null>;
  resetSession: (id: string, conversationId: string) => Promise<boolean>;
  /** UPDATE ... WHERE id AND iyzico_token IS NULL; token UNIQUE. Bağlandıysa true. */
  bindToken: (sessionId: string, token: string) => Promise<boolean>;
  markSession: (sessionId: string, status: string, error: string | null) => Promise<void>;
  listOpenSessions: (sinceIso: string) => Promise<SessionRow[]>;
  /** Tek veritabanı işlemi: public.settle_iyzico_payment */
  settle: (a: SettleArgs) => Promise<SettleResult>;
  findPendingBySubscription: (ref: string) => Promise<OrderRow[]>;
  findPendingRenewalsByEmail: (email: string) => Promise<OrderRow[]>;
  automaticOrderSubscription: (email: string) => Promise<{ exists: boolean; subscriptionRef: string | null }>;
  hasApprovedOrder: (email: string) => Promise<boolean>;
};

// ---------------- 1) Ödeme başlatma ----------------
export type StartResult = { status: number; body: Record<string, unknown> };
export async function startCheckout(
  input: { orderId: unknown; customerData: any; layout?: unknown },
  ports: { db: DbPort; iyzico: IyzicoPort; callbackUrl: string; now?: () => number },
): Promise<StartResult> {
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

  const conversationId = crypto.randomUUID();
  let session = await ports.db.readSessionByOrder(order.id);
  if (session) {
    if (session.iyzico_token || session.status !== "initializing") {
      return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };
    }
    if (!(await ports.db.resetSession(session.id, conversationId))) return { status: 409, body: { status: "failure", errorCode: "checkout_busy" } };
    session = { ...session, conversation_id: conversationId };
  } else {
    session = await ports.db.insertSession({ order_id: order.id, conversation_id: conversationId, plan_ref: plan.planRef,
      expected_amount: plan.price, currency: "TRY" });
    if (!session) return { status: 409, body: { status: "failure", errorCode: "checkout_already_started" } };
  }

  const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
  let gsm = digits(c.gsmNumber); if (gsm.startsWith("90")) gsm = gsm.slice(2); if (gsm.startsWith("0")) gsm = gsm.slice(1);
  const tc = digits(c.identityNumber);
  const addr = (a: unknown) => (typeof a === "string" && a.length >= 5 ? a : "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
  const name = c.name || "Kullanici", surname = c.surname || "Adi";
  const result = await ports.iyzico.initialize({
    locale: "tr", conversationId: session.conversation_id,
    callbackUrl: ports.callbackUrl, pricingPlanReferenceCode: plan.planRef, subscriptionInitialStatus: "ACTIVE",
    customer: { name, surname, email: order.customer_email, gsmNumber: gsm.length === 10 ? `+90${gsm}` : "+905000000000",
      identityNumber: tc.length === 11 ? tc : "11111111111",
      billingAddress: { address: addr(c.billingAddress || c.registrationAddress), zipCode: c.billingZipCode || "34100",
        contactName: `${name} ${surname}`, city: c.billingCity || c.city || "Istanbul", country: "Turkey" } },
  });
  const token = typeof result?.token === "string" ? result.token : "";
  if (result?.status !== "success" || !token || !result?.checkoutFormContent
    || (result.conversationId && result.conversationId !== session.conversation_id)) {
    await ports.db.markSession(session.id, "initializing", String(result?.errorCode || "initialize_failed").slice(0, 80));
    return { status: 200, body: { status: "failure", errorCode: result?.errorCode ?? "initialize_failed", errorMessage: result?.errorMessage ?? "Ödeme başlatılamadı" } };
  }
  if (!(await ports.db.bindToken(session.id, token))) {
    await ports.db.markSession(session.id, "rejected", "token_conflict");
    return { status: 409, body: { status: "failure", errorCode: "token_conflict" } };
  }
  return { status: 200, body: { status: "success", checkoutFormContent: result.checkoutFormContent, token,
    tokenExpireTime: result.tokenExpireTime, orderId: order.id, popup: input.layout === "popup" || undefined } };
}

// ---------------- 2) Sağlayıcı kanıtı ----------------
export type ChargeProof = { subscriptionRef: string; customerRef: string; planRef: string | null; chargeRef: string;
  amount: number; currency: string; paidAt: number };
/** Abonelik detayından (sağlayıcı yanıtı) en son başarılı tahsilat. Başarısız/eksikse null. */
export function chargeProof(raw: any, ref: string): ChargeProof | null {
  const v = parseIyzicoSubscription(raw, ref);
  if (!v?.latestCharge || v.latestChargeFailedOrWaiting || v.latestCharge.price === null) return null;
  const sub = Array.isArray(raw?.data?.items) ? raw.data.items[0] : raw?.data;
  const ord = (Array.isArray(sub?.orders) ? sub.orders : []).find((o: any) => String(o?.referenceCode ?? "") === String(v.latestCharge!.referenceCode ?? ""));
  const currency = String(ord?.currencyCode || sub?.currencyCode || "TRY").toUpperCase();
  const chargeRef = v.latestCharge.referenceCode || "";
  if (!chargeRef || !v.latestCharge.paidAt) return null;
  return { subscriptionRef: v.subscriptionReferenceCode, customerRef: v.customerReferenceCode, planRef: v.pricingPlanReferenceCode,
    chargeRef, amount: v.latestCharge.price, currency, paidAt: v.latestCharge.paidAt };
}
const keyOf = (p: ChargeProof) => `iyzico:${p.subscriptionRef}:${p.chargeRef}`;

// ---------------- 3) Token ile kesinleştirme (callback ve tarayıcı kapandıysa cron) ----------------
export type TokenOutcome = { outcome: "applied" | "duplicate" | "pending" | "rejected"; reason?: string; orderId?: string };
export async function settleByToken(token: unknown, source: string, ports: { db: DbPort; iyzico: IyzicoPort }): Promise<TokenOutcome> {
  const t = String(token || "");
  if (!/^[A-Za-z0-9-]{8,128}$/.test(t)) return { outcome: "rejected", reason: "token_invalid" };
  const session = await ports.db.readSessionByToken(t);
  if (!session) return { outcome: "rejected", reason: "token_unknown" };
  if (session.status === "settled") return { outcome: "duplicate", orderId: session.order_id };
  if (session.status !== "initialized") return { outcome: "rejected", reason: "session_closed", orderId: session.order_id };

  const form = await ports.iyzico.retrieveCheckout(t);       // iyzico Checkout Form Retrieve
  const d = form?.data ?? form;
  if (form?.status !== "success" || !d) return { outcome: "pending", reason: "retrieve_not_success", orderId: session.order_id };
  const subRef = String(d.referenceCode || "");
  if (!REF.test(subRef)) return { outcome: "pending", reason: "retrieve_no_subscription", orderId: session.order_id };
  if (d.pricingPlanReferenceCode && d.pricingPlanReferenceCode !== session.plan_ref) return { outcome: "rejected", reason: "plan_mismatch", orderId: session.order_id };
  if (d.conversationId && d.conversationId !== session.conversation_id) return { outcome: "rejected", reason: "conversation_mismatch", orderId: session.order_id };
  if (d.token && d.token !== t) return { outcome: "rejected", reason: "token_mismatch", orderId: session.order_id };

  const proof = chargeProof(await ports.iyzico.subscription(subRef), subRef);
  if (!proof) return { outcome: "pending", reason: "charge_not_verified", orderId: session.order_id };
  if (d.customerReferenceCode && d.customerReferenceCode !== proof.customerRef) return { outcome: "rejected", reason: "customer_mismatch", orderId: session.order_id };
  if (proof.planRef && proof.planRef !== session.plan_ref) return { outcome: "rejected", reason: "plan_mismatch", orderId: session.order_id };
  if (Math.abs(proof.amount - Number(session.expected_amount)) > 0.005) return { outcome: "rejected", reason: "amount_mismatch", orderId: session.order_id };
  if (proof.currency !== session.currency) return { outcome: "rejected", reason: "currency_mismatch", orderId: session.order_id };

  const r = await ports.db.settle({ orderId: session.order_id, paymentKey: keyOf(proof), subscriptionRef: proof.subscriptionRef,
    customerRef: proof.customerRef, chargeRef: proof.chargeRef, amount: proof.amount, currency: proof.currency,
    paidAt: new Date(proof.paidAt).toISOString(), source, binding: "checkout_session", sessionId: session.id });
  return { outcome: r.outcome, reason: r.reason, orderId: session.order_id };
}

// ---------------- 4) Abonelik kanıtıyla (webhook / cron) — yalnız bağlı sipariş ----------------
export async function settleSubscriptionCharge(raw: any, ref: string, source: string, ports: { db: DbPort },
  claimedCustomerEmail?: string | null): Promise<TokenOutcome> {
  if (!REF.test(ref)) return { outcome: "rejected", reason: "ref_invalid" };
  const proof = chargeProof(raw, ref);
  if (!proof) return { outcome: "rejected", reason: "charge_not_verified" };
  if (proof.currency !== "TRY") return { outcome: "rejected", reason: "currency_mismatch" };
  const base = { paymentKey: keyOf(proof), subscriptionRef: proof.subscriptionRef, customerRef: proof.customerRef,
    chargeRef: proof.chargeRef, amount: proof.amount, currency: proof.currency, paidAt: new Date(proof.paidAt).toISOString(), source };

  // a) Sunucu ödeme oturumu bu aboneliğe bağlıysa
  const session = await ports.db.readSessionBySubscription(ref);
  if (session) {
    if (session.status === "settled") return { outcome: "duplicate", orderId: session.order_id };
    const r = await ports.db.settle({ ...base, orderId: session.order_id, binding: "checkout_session", sessionId: session.id });
    return { outcome: r.outcome, reason: r.reason, orderId: session.order_id };
  }
  // b) Abonelik koduyla kayıtlı bekleyen yenileme siparişi
  const bound = (await ports.db.findPendingBySubscription(ref)).filter((o) => o.is_first_order === false);
  const pick = (list: OrderRow[]) => list.find((o) => Math.abs(Number(o.amount) - proof.amount) <= 0.005);
  let order = pick(bound); let binding = "subscription_ref";
  // c/d) Abonelik kodu taşımayan yenileme: e-posta tek başına yetmez — yenileme siparişi, daha önce onaylı
  // müşteri, tutar eşleşmesi, aboneliğin bu müşteriye önceden bağlı olması (veya hiç bağ yoksa eski müşteri)
  // ve tahsilatın daha önce kullanılmamış olması (makbuz) birlikte gerekir. İlk siparişler asla.
  const email = String(claimedCustomerEmail || "").trim().toLowerCase();
  if (!order && email) {
    const ao = await ports.db.automaticOrderSubscription(email);
    if (ao.exists && (ao.subscriptionRef === ref || ao.subscriptionRef === null) && await ports.db.hasApprovedOrder(email)) {
      order = pick((await ports.db.findPendingRenewalsByEmail(email)).filter((o) => o.is_first_order === false && !o.subscription_reference_code));
      binding = ao.subscriptionRef === ref ? "renewal_bound" : "legacy_renewal";
    }
  }
  if (!order) return { outcome: "rejected", reason: "no_bound_order" };
  const r = await ports.db.settle({ ...base, orderId: order.id, binding, sessionId: null });
  return { outcome: r.outcome, reason: r.reason, orderId: order.id };
}

/** iyzico abonelik webhook X-IYZ-SIGNATURE-V3 (merchantId tanımlıysa zorunlu). */
// Subscription webhook V3 (official example): message = merchantId + secretKey + eventType
// + subscriptionReferenceCode + orderReferenceCode + customerReferenceCode; HMAC-SHA256 key = secretKey.
export async function verifyWebhookSignature(secretKey: string, merchantId: string, body: any, signature: string): Promise<boolean> {
  const fields = ["iyziEventType", "subscriptionReferenceCode", "orderReferenceCode", "customerReferenceCode"];
  if (!secretKey || !merchantId || !/^[a-f0-9]{64}$/i.test(signature || "")
    || fields.some((k) => typeof body?.[k] !== "string" || !body[k])) return false;
  const data = merchantId + secretKey + fields.map((k) => String(body[k])).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const hex = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  const got = signature.toLowerCase(); let diff = 0;
  for (let i = 0; i < 64; i++) diff |= hex.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}
