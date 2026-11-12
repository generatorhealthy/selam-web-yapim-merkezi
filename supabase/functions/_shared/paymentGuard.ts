// Ödeme güvenliği — saf karar mantığı (ağ/DB çağrısı yok, mock'larla test edilir).
// Canlı create-iyzico-payment / iyzico-payment-callback bu dosyayı HENÜZ import etmiyor;
// yalnızca security/stage2 altındaki v2 sürümleri kullanır.
import { paymentPlanFor, packagesForPlan } from "./packageCatalog.ts";

/** Aktif iki satış sayfası: tutar ve plan sunucuda sabit. */
export const LIVE_SALES_PACKAGES = {
  "ozel-firsat": { price: 4000, planId: "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652" },
  "kayit-linki": { price: 5000, planId: "29429127-2e4f-48ee-a2b7-708a068de378" },
} as const;

export type InitDecision =
  | { ok: true; packageKey: string; planId: string; amount: number | null; clientPriceIgnored: boolean }
  | { ok: false; reason: "unknown_package" | "plan_not_configured" };

/** Ödeme başlatma: plan yalnızca paket kimliğinden. İstemci fiyatı sadece "yok sayıldı" bilgisi için okunur. */
export function decideInit(packageType: unknown, clientPrice?: unknown): InitDecision {
  const r = paymentPlanFor(packageType);
  if (!r.ok) return { ok: false, reason: r.reason };
  const amount = typeof r.pkg.price === "number" ? r.pkg.price : null;
  const cp = Number(clientPrice);
  const clientPriceIgnored = clientPrice !== undefined && clientPrice !== null && cp !== amount;
  return { ok: true, packageKey: r.pkg.key, planId: r.planId, amount, clientPriceIgnored };
}

export type VerifiedSubscription = {
  subscriptionReferenceCode: string;
  customerReferenceCode: string;
  pricingPlanReferenceCode: string | null;
};

/** iyzico "abonelik detayı" yanıtını doğrular (ACTIVE + başarılı ödeme + müşteri kodu). */
export function parseIyzicoSubscription(result: any, requestedRef: string): VerifiedSubscription | null {
  if (!result || result.status !== "success") return null;
  const sub = Array.isArray(result.data?.items) ? result.data.items[0] : result.data;
  if (!sub) return null;
  if (String(sub.subscriptionStatus || "").toUpperCase() !== "ACTIVE") return null;
  const orders: any[] = Array.isArray(sub.orders) ? sub.orders : [];
  if (orders.length > 0 && !orders.some((o) => String(o?.orderStatus || "").toUpperCase() === "SUCCESS")) return null;
  if (!sub.customerReferenceCode) return null;
  const ref = String(sub.referenceCode || requestedRef);
  if (ref !== requestedRef) return null;
  return {
    subscriptionReferenceCode: ref,
    customerReferenceCode: String(sub.customerReferenceCode),
    pricingPlanReferenceCode: sub.pricingPlanReferenceCode ? String(sub.pricingPlanReferenceCode) : null,
  };
}

export type PendingOrder = { id: string; amount: number; package_type: string | null; status: string };

export type CallbackDecision =
  | { action: "approve"; orderId: string }
  | { action: "duplicate"; orderId: string | null }
  | { action: "reject"; reason: "not_verified" | "customer_mismatch" | "no_pending_order" | "plan_mismatch" | "amount_mismatch" | "plan_unknown" };

/**
 * Callback onay kararı.
 * - iyzico doğrulaması yoksa onay yok.
 * - Aynı abonelik kodu daha önce bir siparişe yazıldıysa tekrar onay yok (mükerrer bildirim).
 * - Aboneliğin planı ile siparişin paketi ve tutarı katalogda eşleşmeli.
 * Plan kodu iyzico yanıtında yoksa eski davranış korunur (yalnızca uyarı) — strictPlan ile kapatılabilir.
 */
export function decideCallback(input: {
  verified: VerifiedSubscription | null;
  claimedCustomerRef?: string | null;
  alreadyUsedByOrderId: string | null;
  pendingOrder: PendingOrder | null;
  strictPlan?: boolean;
}): CallbackDecision {
  const { verified, claimedCustomerRef, alreadyUsedByOrderId, pendingOrder } = input;
  if (!verified) return { action: "reject", reason: "not_verified" };
  if (claimedCustomerRef && String(claimedCustomerRef) !== verified.customerReferenceCode) {
    return { action: "reject", reason: "customer_mismatch" };
  }
  if (alreadyUsedByOrderId) return { action: "duplicate", orderId: alreadyUsedByOrderId };
  if (!pendingOrder || pendingOrder.status !== "pending") return { action: "reject", reason: "no_pending_order" };

  const plan = verified.pricingPlanReferenceCode;
  if (!plan) {
    if (input.strictPlan) return { action: "reject", reason: "plan_unknown" };
    return { action: "approve", orderId: pendingOrder.id };
  }
  const pkgs = packagesForPlan(plan);
  if (pkgs.length === 0) return { action: "reject", reason: "plan_unknown" };
  const key = (pendingOrder.package_type || "").toLowerCase();
  const match = pkgs.find((p) => p.key === key);
  if (!match) return { action: "reject", reason: "plan_mismatch" };
  if (typeof match.price === "number" && Number(pendingOrder.amount) !== match.price) {
    return { action: "reject", reason: "amount_mismatch" };
  }
  return { action: "approve", orderId: pendingOrder.id };
}
