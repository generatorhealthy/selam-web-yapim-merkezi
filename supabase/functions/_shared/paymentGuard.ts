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

export type IyzicoCharge = { referenceCode: string | null; price: number | null; paidAt: number };

export type VerifiedSubscription = {
  subscriptionReferenceCode: string;
  customerReferenceCode: string;
  pricingPlanReferenceCode: string | null;
  /** En son BAŞARILI tahsilat (iyzico abonelik "orders" listesinden). Yoksa null. */
  latestCharge: IyzicoCharge | null;
  /** En son tahsilat denemesi başarısız/bekliyor mu */
  latestChargeFailedOrWaiting: boolean;
};

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };

/** iyzico "abonelik detayı" yanıtını doğrular. Başarılı tahsilat yoksa null (üyelik açılmaz). */
export function parseIyzicoSubscription(result: any, requestedRef: string): VerifiedSubscription | null {
  if (!result || result.status !== "success") return null;
  const sub = Array.isArray(result.data?.items) ? result.data.items[0] : result.data;
  if (!sub) return null;
  if (String(sub.subscriptionStatus || "").toUpperCase() !== "ACTIVE") return null;
  if (!sub.customerReferenceCode) return null;
  const ref = String(sub.referenceCode || requestedRef);
  if (ref !== requestedRef) return null;

  const orders: any[] = Array.isArray(sub.orders) ? sub.orders : [];
  const charges = orders.map((o) => {
    const attempts: any[] = Array.isArray(o?.paymentAttempts) ? o.paymentAttempts : [];
    const okAttempt = attempts.filter((a) => String(a?.paymentStatus || "").toUpperCase() === "SUCCESS")
      .sort((x, y) => Number(y.createdDate) - Number(x.createdDate))[0];
    const status = String(o?.orderStatus || "").toUpperCase();
    const t = Number(okAttempt?.createdDate ?? o?.startPeriod ?? 0);
    return { status, success: status === "SUCCESS", referenceCode: o?.referenceCode ? String(o.referenceCode) : null,
      price: num(o?.price ?? okAttempt?.price), paidAt: Number.isFinite(t) ? t : 0,
      lastTry: Math.max(0, ...attempts.map((a) => Number(a?.createdDate) || 0), Number(o?.startPeriod) || 0) };
  });
  const succ = charges.filter((c) => c.success).sort((a, b) => b.paidAt - a.paidAt);
  if (succ.length === 0) return null; // başarılı tahsilat görünmeden onay yok (eski "orders boşsa geç" kaldırıldı)
  const latest = charges.slice().sort((a, b) => b.lastTry - a.lastTry)[0];
  return {
    subscriptionReferenceCode: ref,
    customerReferenceCode: String(sub.customerReferenceCode),
    pricingPlanReferenceCode: sub.pricingPlanReferenceCode ? String(sub.pricingPlanReferenceCode)
      : sub.pricingPlan?.referenceCode ? String(sub.pricingPlan.referenceCode) : null,
    latestCharge: { referenceCode: succ[0].referenceCode, price: succ[0].price, paidAt: succ[0].paidAt },
    latestChargeFailedOrWaiting: !!latest && !latest.success,
  };
}

export type PendingOrder = { id: string; amount: number; package_type: string | null; status: string; subscription_month?: number | null };

export type CallbackDecision =
  | { action: "approve"; orderId: string }
  | { action: "duplicate"; orderId: string | null }
  | { action: "reject"; reason: "not_verified" | "customer_mismatch" | "no_pending_order" | "latest_charge_not_paid" | "plan_mismatch" | "amount_mismatch" | "amount_unknown" };

/**
 * Callback onay kararı (eski paketler ve yenilemeler dahil tüm siparişler için):
 * 1. iyzico doğrulaması + son denemenin başarılı olması şart.
 * 2. Mükerrer: bu abonelikte, bu tahsilat zamanından SONRA onaylanmış sipariş varsa tahsilat tüketilmiştir.
 *    (Yenilemeler aynı abonelik kodunu taşır; her ay yeni tahsilat zamanı olduğu için engellenmez.)
 * 3. Tutar: iyzico'nun gerçekte çektiği tutar = sipariş tutarı. Plan kodu gerekmez; eski fiyatlı aboneler de eşleşir.
 * 4. Plan kodu varsa ve bu iki aktif paketten birine aitse siparişin paketiyle aynı olmalı.
 * Tutar okunamıyorsa onay YOK (sessiz eski yönteme dönüş yok) — sipariş bekliyor kalır.
 */
export function decideCallback(input: {
  verified: VerifiedSubscription | null;
  claimedCustomerRef?: string | null;
  /** bu abonelik koduyla onaylanmış en son siparişin approved_at zamanı (ms) */
  lastApprovedAtForSubscription: number | null;
  lastApprovedOrderId?: string | null;
  pendingOrder: PendingOrder | null;
}): CallbackDecision {
  const { verified: v, claimedCustomerRef, pendingOrder: o } = input;
  if (!v || !v.latestCharge) return { action: "reject", reason: "not_verified" };
  if (claimedCustomerRef && String(claimedCustomerRef) !== v.customerReferenceCode) return { action: "reject", reason: "customer_mismatch" };
  if (v.latestChargeFailedOrWaiting) return { action: "reject", reason: "latest_charge_not_paid" };
  if (input.lastApprovedAtForSubscription !== null && input.lastApprovedAtForSubscription >= v.latestCharge.paidAt) {
    return { action: "duplicate", orderId: input.lastApprovedOrderId ?? null };
  }
  if (!o || o.status !== "pending") return { action: "reject", reason: "no_pending_order" };

  const plan = v.pricingPlanReferenceCode;
  const key = (o.package_type || "").toLowerCase();
  const livePlans = Object.entries(LIVE_SALES_PACKAGES);
  const planOwner = plan ? livePlans.find(([, d]) => d.planId === plan)?.[0] : undefined;
  const orderIsLive = livePlans.some(([k]) => k === key);
  if ((planOwner || orderIsLive) && plan && planOwner !== key) return { action: "reject", reason: "plan_mismatch" };

  if (v.latestCharge.price === null) return { action: "reject", reason: "amount_unknown" };
  if (Math.abs(Number(o.amount) - v.latestCharge.price) > 0.01) return { action: "reject", reason: "amount_mismatch" };
  return { action: "approve", orderId: o.id };
}
