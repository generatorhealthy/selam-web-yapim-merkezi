// Kartla ödeme yalnızca bu paketlerde açıktır.
// PayTR kart akışı henüz tam hazır olmadığı için satış paketlerinde kart seçeneği kapalıdır;
// yalnızca geçici test paketinde açıktır. Satın alma sayfası ve ödeme sunucusu aynı listeyi kullanır.
export const CARD_PAYMENT_PACKAGES: readonly string[] = ["test-paket-link"];

export function cardPaymentsAllowedFor(packageType: unknown): boolean {
  return typeof packageType === "string" && CARD_PAYMENT_PACKAGES.includes(packageType);
}
