// Hoppa (Esnekpos) client: hosted Common Payment page for the first charge,
// card lookup by phone (CUSTOMER_GSM), and 3D-less (METHOD 2) charges with the
// saved card UNIQUE_KEY. Card numbers never pass through our servers.
export const HOPPA_BASE = {
  test: "https://posservicetest.esnekpos.com",
  prod: "https://posservice.esnekpos.com",
} as const;
export const HOPPA_RELAY = "https://doktorumol.com.tr/hoppa-relay.php";
export type HoppaEnv = keyof typeof HOPPA_BASE;

export interface HoppaMerchant { merchant: string; merchantKey: string; env: HoppaEnv }
export interface HoppaCustomer {
  firstName: string; lastName: string; mail: string; phone: string;
  city?: string; state?: string; address?: string; clientIp?: string;
}

export function normalizeGsm(phone: string): string {
  const d = phone.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
  if (!/^5\d{9}$/.test(d)) throw new Error("Geçersiz cep telefonu");
  return "0" + d;
}

export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Geçersiz tutar");
  return amount.toFixed(2);
}

export function orderRef(prefix: string, id: string): string {
  const ref = `${prefix}${id.replace(/-/g, "")}`.slice(0, 24);
  return ref;
}

const cust = (c: HoppaCustomer) => ({
  FIRST_NAME: c.firstName, LAST_NAME: c.lastName, MAIL: c.mail,
  PHONE: normalizeGsm(c.phone), CITY: c.city || "-", STATE: c.state || "-",
  ADDRESS: c.address || "-",
});

export function buildCommonPayment(m: HoppaMerchant, ref: string, amount: number,
  backUrl: string, c: HoppaCustomer, productName: string) {
  const a = formatAmount(amount);
  return {
    Config: { MERCHANT: m.merchant, MERCHANT_KEY: m.merchantKey, ORDER_REF_NUMBER: ref,
      ORDER_AMOUNT: a, PRICES_CURRENCY: "TRY", BACK_URL: backUrl, LOCALE: "tr" },
    Customer: cust(c),
    Product: [{ PRODUCT_ID: "1", PRODUCT_NAME: productName, PRODUCT_CATEGORY: "Hizmet",
      PRODUCT_DESCRIPTION: productName, PRODUCT_AMOUNT: a }],
  };
}

export function buildSavedCardCharge(m: HoppaMerchant, ref: string, amount: number,
  uniqueKey: string, backUrl: string, c: HoppaCustomer) {
  if (!uniqueKey) throw new Error("Kayıtlı kart anahtarı yok");
  return {
    Config: { MERCHANT: m.merchant, MERCHANT_KEY: m.merchantKey, BACK_URL: backUrl,
      PRICES_CURRENCY: "TRY", ORDER_REF_NUMBER: ref, ORDER_AMOUNT: formatAmount(amount), METHOD: 2 },
    CreditCard: { CC_NUMBER: "", EXP_MONTH: "", EXP_YEAR: "", CC_CVV: "", CC_OWNER: "",
      INSTALLMENT_NUMBER: "1", UNIQUE_KEY: uniqueKey },
    Customer: { ...cust(c), CLIENT_IP: c.clientIp || "127.0.0.1" },
  };
}

export interface HoppaCard { CARD_MASKED_NUMBER: string; UNIQUE_KEY: string; IS_EXPIRED: boolean }
/** Picks the newest-listed non-expired card; null when none usable. */
export function pickUsableCard(cards: HoppaCard[] | null | undefined): HoppaCard | null {
  const ok = (cards || []).filter((c) => c && c.UNIQUE_KEY && !c.IS_EXPIRED);
  return ok.length ? ok[ok.length - 1] : null;
}

/** A charge counts as paid only with STATUS SUCCESS and RETURN_CODE "0" or "00". */
export function isPaid(r: { STATUS?: string; RETURN_CODE?: string } | null | undefined): boolean {
  return !!r && r.STATUS === "SUCCESS" && (r.RETURN_CODE === "0" || r.RETURN_CODE === "00");
}

async function post(m: HoppaMerchant, path: string, body: unknown) {
  // Hoppa requires a static source IP: route through our Hostinger relay.
  const url = `${HOPPA_RELAY}?env=${m.env}&path=${encodeURIComponent(path)}`;
  const res = await fetch(url, { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Hoppa HTTP ${res.status}`);
  return await res.json();
}

export const hoppa = {
  startCommonPayment: (m: HoppaMerchant, body: ReturnType<typeof buildCommonPayment>) =>
    post(m, "/api/pay/CommonPaymentDealer", body),
  // Server-to-server status check; the only trusted proof of the first payment.
  processQuery: (m: HoppaMerchant, ref: string) =>
    post(m, "/api/services/ProcessQuery", { MERCHANT: m.merchant, MERCHANT_KEY: m.merchantKey, ORDER_REF_NUMBER: ref }),
  listCardsByGsm: (m: HoppaMerchant, phone: string) =>
    post(m, "/api/card/ListCustomerCards", { MERCHANT: m.merchant, MERCHANT_KEY: m.merchantKey, CUSTOMER_GSM: normalizeGsm(phone) }),
  chargeSavedCard: (m: HoppaMerchant, body: ReturnType<typeof buildSavedCardCharge>) =>
    post(m, "/api/pay/EYV3DPay", body),
};
