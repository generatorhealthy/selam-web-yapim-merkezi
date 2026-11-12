import { decideInit, decideCallback, parseIyzicoSubscription, LIVE_SALES_PACKAGES } from "./paymentGuard.ts";
const eq = (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`); };

const P4 = LIVE_SALES_PACKAGES["ozel-firsat"].planId, P5 = LIVE_SALES_PACKAGES["kayit-linki"].planId;
const mockSub = (over: Record<string, unknown> = {}) => ({ status: "success", data: {
  referenceCode: "sub-ref-0001", customerReferenceCode: "cust-0001", subscriptionStatus: "ACTIVE",
  pricingPlanReferenceCode: P5, orders: [{ orderStatus: "SUCCESS" }], ...over } });
const order = (o: Partial<{ amount: number; package_type: string; status: string }> = {}) =>
  ({ id: "o1", amount: 5000, package_type: "kayit-linki", status: "pending", ...o });

Deno.test("özel fırsat yalnız 4000 planına", () => { const d = decideInit("ozel-firsat"); eq(d.ok && [d.planId, d.amount], [P4, 4000]); });
Deno.test("kayıt linki yalnız 5000 planına", () => { const d = decideInit("kayit-linki"); eq(d.ok && [d.planId, d.amount], [P5, 5000]); });
Deno.test("istemci 1 TL gönderse de plan değişmez", () => { const d = decideInit("kayit-linki", 1); eq(d.ok && [d.planId, d.amount, d.clientPriceIgnored], [P5, 5000, true]); });
Deno.test("4000 paketine 5000 fiyatı 5000 planı seçtirmez", () => { const d = decideInit("ozel-firsat", 5000); eq(d.ok && d.planId, P4); });
Deno.test("bilinmeyen paket başka pakete düşmez", () => { eq(decideInit("hack", 5000), { ok: false, reason: "unknown_package" }); });
Deno.test("boş paket reddedilir", () => { eq(decideInit(undefined, 4000).ok, false); });

Deno.test("mock: ACTIVE + SUCCESS doğrulanır", () => { eq(parseIyzicoSubscription(mockSub(), "sub-ref-0001")?.pricingPlanReferenceCode, P5); });
Deno.test("mock: PENDING abonelik reddedilir", () => { eq(parseIyzicoSubscription(mockSub({ subscriptionStatus: "PENDING" }), "sub-ref-0001"), null); });
Deno.test("mock: başarısız ödeme reddedilir", () => { eq(parseIyzicoSubscription(mockSub({ orders: [{ orderStatus: "FAILED" }] }), "sub-ref-0001"), null); });
Deno.test("mock: iyzico hata yanıtı reddedilir", () => { eq(parseIyzicoSubscription({ status: "failure" }, "sub-ref-0001"), null); });
Deno.test("mock: başka abonelik kodu dönerse reddedilir", () => { eq(parseIyzicoSubscription(mockSub({ referenceCode: "other" }), "sub-ref-0001"), null); });

const v = parseIyzicoSubscription(mockSub(), "sub-ref-0001");
Deno.test("doğrulanmadan onay yok", () => { eq(decideCallback({ verified: null, alreadyUsedByOrderId: null, pendingOrder: order() }).action, "reject"); });
Deno.test("doğru plan + tutar onaylanır", () => { eq(decideCallback({ verified: v, alreadyUsedByOrderId: null, pendingOrder: order() }), { action: "approve", orderId: "o1" }); });
Deno.test("mükerrer bildirim ikinci onay üretmez", () => { eq(decideCallback({ verified: v, alreadyUsedByOrderId: "o1", pendingOrder: order({}) }).action, "duplicate"); });
Deno.test("5000 aboneliği 4000 siparişini onaylamaz", () => { eq(decideCallback({ verified: v, alreadyUsedByOrderId: null, pendingOrder: order({ package_type: "ozel-firsat", amount: 4000 }) }), { action: "reject", reason: "plan_mismatch" }); });
Deno.test("tutarı oynanmış sipariş onaylanmaz", () => { eq(decideCallback({ verified: v, alreadyUsedByOrderId: null, pendingOrder: order({ amount: 1 }) }), { action: "reject", reason: "amount_mismatch" }); });
Deno.test("müşteri kodu uyuşmazsa reddedilir", () => { eq(decideCallback({ verified: v, claimedCustomerRef: "x", alreadyUsedByOrderId: null, pendingOrder: order() }).action, "reject"); });
Deno.test("bekleyen sipariş yoksa onay yok", () => { eq(decideCallback({ verified: v, alreadyUsedByOrderId: null, pendingOrder: null }).action, "reject"); });
Deno.test("plan kodu dönmezse katı modda reddedilir", () => { const w = { ...v!, pricingPlanReferenceCode: null }; eq(decideCallback({ verified: w, alreadyUsedByOrderId: null, pendingOrder: order(), strictPlan: true }).action, "reject"); });
