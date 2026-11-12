// Sunucuya ait tek paket kaynağı.
// İstemciden gelen tutar (body.amount / packageData.price) fiyat veya plan seçiminde ASLA belirleyici değildir:
// ödeme planı yalnızca packageType ile bu katalogdan bulunur, tutar ise kataloğun kendisinden gelir.
//
// Fiyatı doğrulanamayan paketlerde price = null bırakılır: bu, "ödeme başlat ama tutarı bilmiyorum"
// demek değil, sağlayıcı (iyzico) plan konfigürasyonunun doğrulanması gerektiğini işaretler.
// planId = null olan paket için ödeme başlatılmaz; eski davranıştaki "bilinmeyen tip => temel plan"
// sessiz düşüşü kaldırılmıştır.

export type PackageDef = {
  key: string;
  name: string;
  /** iyzico planının gerçek çekim tutarı; doğrulanmadıysa null */
  price: number | null;
  /** üstü çizili gösterim fiyatı; doğrulanmadıysa null */
  originalPrice: number | null;
  /** iyzico pricingPlanReferenceCode; tanımsızsa null */
  planId: string | null;
};

export const PACKAGE_CATALOG: Record<string, PackageDef> = {
  // Kullanıcının doğruladığı iki kampanya paketi (iyzico planı ₺5.000,00 / ₺4.000,00).
  "kayit-linki": {
    key: "kayit-linki",
    name: "Premium Paket - Özel Fırsat",
    price: 5000,
    originalPrice: 8500,
    planId: "29429127-2e4f-48ee-a2b7-708a068de378",
  },
  "ozel-firsat": {
    key: "ozel-firsat",
    name: "Premium Paket - Özel Fırsat",
    price: 4000,
    originalPrice: 6500,
    planId: "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652",
  },
  // Eski özel teklif: 3600 TL planı.
  "special-offer": {
    key: "special-offer",
    name: "Premium Paket",
    price: 3600,
    originalPrice: 7200,
    planId: "92feac6d-1181-4b78-b0c2-3b5d5742adff",
  },
  // Aşağıdakilerin plan kodları kod tabanında kullanılıyordu; sağlayıcıdaki gerçek
  // çekim tutarı buradan okunamadığı için price = null olarak bırakıldı.
  "professional": {
    key: "professional",
    name: "Professional Paket",
    price: null,
    originalPrice: null,
    planId: "92feac6d-1181-4b78-b0c2-3b5d5742adff",
  },
  "basic": {
    key: "basic",
    name: "Premium Paket",
    price: null,
    originalPrice: null,
    planId: "205eb35c-e122-401f-aef7-618daf3732f8",
  },
  "campaign": {
    key: "campaign",
    name: "Kampanyalı Paket",
    price: null,
    originalPrice: null,
    planId: "e01a059d-9392-4690-b030-0002064f9421",
  },
  "premium": {
    key: "premium",
    name: "Full Paket",
    price: null,
    originalPrice: null,
    planId: "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94",
  },
  // Kod tabanında bu tipler için plan eşlemi hiç yoktu; eskiden sessizce "basic" planına
  // düşüyorlardı. Artık ödeme başlatılmaz, ta ki doğru plan kodu tanımlanana kadar.
  "campaign-premium": {
    key: "campaign-premium",
    name: "Kampanyalı Premium Paket",
    price: null,
    originalPrice: null,
    planId: null,
  },
  "discounted": {
    key: "discounted",
    name: "İndirimli Tanıtım Paketi",
    price: null,
    originalPrice: null,
    planId: null,
  },
  "psikolog": {
    key: "psikolog",
    name: "Klinik Psikolog Paketi",
    price: null,
    originalPrice: null,
    planId: null,
  },
};

/** Bilinmeyen/boş tip için null döner — varsayılana düşürmez. */
export function resolvePackage(packageType: unknown): PackageDef | null {
  if (typeof packageType !== "string") return null;
  const key = packageType.trim().toLowerCase();
  if (!key) return null;
  // "constructor" / "__proto__" gibi miras alınan nesne anahtarları paket sayılmaz.
  if (!Object.prototype.hasOwnProperty.call(PACKAGE_CATALOG, key)) return null;
  return PACKAGE_CATALOG[key] ?? null;
}

export type PlanResolution =
  | { ok: true; pkg: PackageDef; planId: string }
  | { ok: false; reason: "unknown_package" | "plan_not_configured"; packageType: string };

/**
 * Ödeme başlatma için tek yetkili giriş noktası.
 * İstemci tutarı buraya hiç girmez: plan yalnızca packageType'tan belirlenir.
 */
export function paymentPlanFor(packageType: unknown): PlanResolution {
  const key = typeof packageType === "string" ? packageType.trim().toLowerCase() : "";
  const pkg = resolvePackage(packageType);
  if (!pkg || !key) return { ok: false, reason: "unknown_package", packageType: key };
  if (!pkg.planId) return { ok: false, reason: "plan_not_configured", packageType: key };
  return { ok: true, pkg, planId: pkg.planId };
}

/**
 * Sipariş satırına yazılacak tutar. Sağlayıcı plan tutarı doğrulanmamışsa null döner;
 * çağıran bu durumda siparişi oluşturmaz (istemci tutarına geri düşmez).
 */
export function authoritativeAmount(packageType: unknown): number | null {
  const pkg = resolvePackage(packageType);
  if (!pkg) return null;
  return typeof pkg.price === "number" && pkg.price > 0 ? pkg.price : null;
}

/**
 * Geriye dönük ödeme eşleştirmesi: iyzico'dan dönen plan kodunu kataloğa çevirir.
 * Birden fazla paket aynı planı paylaşabiliyorsa (special-offer / professional gibi)
 * hepsi döner; çağıran tek bir tanesini "kazanılmış" saymaz.
 */
export function packagesForPlan(planId: unknown): PackageDef[] {
  if (typeof planId !== "string" || !planId) return [];
  return Object.values(PACKAGE_CATALOG).filter((p) => p.planId === planId);
}
