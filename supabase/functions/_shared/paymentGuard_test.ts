import { decideInit, decideCallback, parseIyzicoSubscription, LIVE_SALES_PACKAGES } from "./paymentGuard.ts";
const eq = (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`); };

const P4 = LIVE_SALES_PACKAGES["ozel-firsat"].planId, P5 = LIVE_SALES_PACKAGES["kayit-linki"].planId;
const T1 = 1_760_000_000_000, MONTH = 30 * 86400_000;
const charge = (price: number | null, t: number, status = "SUCCESS", ref = `ch-${t}`) =>
  ({ referenceCode: ref, price, orderStatus: status, paymentAttempts: [{ paymentStatus: status === "SUCCESS" ? "SUCCESS" : "FAILED", createdDate: t }] });
const mockSub = (over: Record<string, unknown> = {}) => ({ status: "success", data: {
  referenceCode: "sub-ref-0001", customerReferenceCode: "cust-0001", subscriptionStatus: "ACTIVE",
  pricingPlanReferenceCode: P5, orders: [charge(5000, T1)], ...over } });
const order = (o: Record<string, unknown> = {}) => ({ id: "o1", amount: 5000, package_type: "kayit-linki", status: "pending", ...o });
const cb = (sub: any, o: any = order(), last: number | null = null, claimed?: string) =>
  decideCallback({ verified: parseIyzicoSubscription(sub, "sub-ref-0001"), pendingOrder: o, lastApprovedAtForSubscription: last, claimedCustomerRef: claimed });

// --- başlatma
Deno.test("özel fırsat yalnız 4000 planına", () => { const d = decideInit("ozel-firsat"); eq(d.ok && [d.planId, d.amount], [P4, 4000]); });
Deno.test("kayıt linki yalnız 5000 planına", () => { const d = decideInit("kayit-linki"); eq(d.ok && [d.planId, d.amount], [P5, 5000]); });
Deno.test("istemci 1 TL gönderse de plan değişmez", () => { const d = decideInit("kayit-linki", 1); eq(d.ok && [d.planId, d.amount, d.clientPriceIgnored], [P5, 5000, true]); });
Deno.test("4000 paketine 5000 fiyatı 5000 planı seçtirmez", () => { const d = decideInit("ozel-firsat", 5000); eq(d.ok && d.planId, P4); });
Deno.test("bilinmeyen paket başka pakete düşmez", () => { eq(decideInit("hack", 5000), { ok: false, reason: "unknown_package" }); });

// --- iyzico doğrulama (mock)
Deno.test("PENDING abonelik reddedilir", () => { eq(parseIyzicoSubscription(mockSub({ subscriptionStatus: "PENDING" }), "sub-ref-0001"), null); });
Deno.test("hiç başarılı tahsilat yoksa reddedilir", () => { eq(parseIyzicoSubscription(mockSub({ orders: [charge(5000, T1, "FAILED")] }), "sub-ref-0001"), null); });
Deno.test("orders listesi boşsa artık onay yok", () => { eq(parseIyzicoSubscription(mockSub({ orders: [] }), "sub-ref-0001"), null); });
Deno.test("iyzico hata yanıtı reddedilir", () => { eq(parseIyzicoSubscription({ status: "failure" }, "sub-ref-0001"), null); });
Deno.test("başka abonelik kodu reddedilir", () => { eq(parseIyzicoSubscription(mockSub({ referenceCode: "x" }), "sub-ref-0001"), null); });
Deno.test("plan kodu pricingPlan.referenceCode alanından da okunur", () => {
  eq(parseIyzicoSubscription(mockSub({ pricingPlanReferenceCode: undefined, pricingPlan: { referenceCode: P4 } }), "sub-ref-0001")?.pricingPlanReferenceCode, P4); });

// --- onay kararı
Deno.test("yeni kayıt-linki ödemesi onaylanır", () => { eq(cb(mockSub()), { action: "approve", orderId: "o1" }); });
Deno.test("aynı bildirim ikinci kez gelirse mükerrer", () => { eq(cb(mockSub(), order(), T1 + 1000).action, "duplicate"); });
Deno.test("tek tahsilat ikinci bekleyen siparişi onaylamaz", () => { eq(cb(mockSub(), order({ id: "o2" }), T1).action, "duplicate"); });
Deno.test("aylık yenileme (aynı abonelik, yeni tahsilat) onaylanır", () => {
  eq(cb(mockSub({ orders: [charge(5000, T1), charge(5000, T1 + MONTH)] }), order({ subscription_month: 2 }), T1 + 1000).action, "approve"); });
Deno.test("son deneme başarısızsa yenileme onaylanmaz", () => {
  eq(cb(mockSub({ orders: [charge(5000, T1), charge(5000, T1 + MONTH, "FAILED")] }), order({ subscription_month: 2 }), T1 + 1000),
     { action: "reject", reason: "latest_charge_not_paid" }); });
Deno.test("5000 aboneliği 4000 siparişini onaylamaz", () => { eq(cb(mockSub(), order({ package_type: "ozel-firsat", amount: 4000 })).action, "reject"); });
Deno.test("tutarı oynanmış sipariş onaylanmaz", () => { eq(cb(mockSub(), order({ amount: 1 })), { action: "reject", reason: "amount_mismatch" }); });
Deno.test("plan kodu yoksa tutar eşleşmesiyle onaylanır", () => { eq(cb(mockSub({ pricingPlanReferenceCode: null })).action, "approve"); });
Deno.test("plan kodu ve tutar yoksa sessiz onay yok", () => {
  eq(cb(mockSub({ pricingPlanReferenceCode: null, orders: [charge(null, T1)] })), { action: "reject", reason: "amount_unknown" }); });
Deno.test("eski premium abone (2998) planı katalogda olmasa da tutar eşleşince onaylanır", () => {
  eq(cb(mockSub({ pricingPlanReferenceCode: "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94", orders: [charge(2998, T1)] }), order({ package_type: "premium", amount: 2998 })).action, "approve"); });
Deno.test("eski plan, kayıt-linki siparişini onaylamaz", () => {
  eq(cb(mockSub({ pricingPlanReferenceCode: "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94", orders: [charge(5000, T1)] })), { action: "reject", reason: "plan_mismatch" }); });
Deno.test("müşteri kodu uyuşmazsa reddedilir", () => { eq(cb(mockSub(), order(), null, "baska").action, "reject"); });
Deno.test("bekleyen sipariş yoksa onay yok", () => { eq(cb(mockSub(), null).action, "reject"); });

Deno.test("gerçek yanıt biçimi: gelecek dönem WAITING (denemesiz) onayı engellemez", () => {
  const future = { referenceCode: "next", price: 5000, orderStatus: "WAITING", startPeriod: T1 + MONTH, paymentAttempts: [] };
  eq(cb(mockSub({ orders: [charge(5000, T1), future] })).action, "approve"); });
Deno.test("denemesi yapılmış WAITING (tahsil edilemedi) onaylanmaz", () => {
  const w = { referenceCode: "w", price: 5000, orderStatus: "WAITING", paymentAttempts: [{ paymentStatus: "FAILED", createdDate: T1 + MONTH }] };
  eq(cb(mockSub({ orders: [charge(5000, T1), w] }), order({ subscription_month: 2 }), T1 + 1000).action, "reject"); });
