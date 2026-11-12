import {
  authoritativeAmount,
  packagesForPlan,
  paymentPlanFor,
  resolvePackage,
} from "./packageCatalog.ts";

const eq = (a: unknown, b: unknown, label = "") => {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x !== y) throw new Error(`${label} Beklenen ${y}, gelen ${x}`);
};

Deno.test("kayit-linki 5000 TL planına bağlanır, istemci tutarı sözkonusu bile değildir", () => {
  const r = paymentPlanFor("kayit-linki");
  eq(r.ok, true, "ok");
  if (r.ok) {
    eq(r.planId, "29429127-2e4f-48ee-a2b7-708a068de378", "plan");
    eq(r.pkg.price, 5000, "tutar");
    eq(r.pkg.originalPrice, 8500, "üstü çizili");
  }
  eq(authoritativeAmount("kayit-linki"), 5000, "sipariş tutarı");
});

Deno.test("ozel-firsat 4000 TL planında kalır", () => {
  const r = paymentPlanFor("ozel-firsat");
  eq(r.ok, true, "ok");
  if (r.ok) {
    eq(r.planId, "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652", "plan");
    eq(r.pkg.price, 4000, "tutar");
  }
  eq(authoritativeAmount("ozel-firsat"), 4000, "sipariş tutarı");
});

Deno.test("tutar plan seçimini değiştirmez: aynı tip her zaman aynı planı alır", () => {
  // Eski davranış body.amount / packageData.price ile plan seçiyordu.
  // Artık fonksiyonun tutar parametresi yok; sonuç yalnızca tipten gelir.
  const a = paymentPlanFor("basic");
  eq(a, paymentPlanFor("basic"), "kararlılık");
  eq(a.ok, true, "ok");
  if (a.ok) eq(a.planId, "205eb35c-e122-401f-aef7-618daf3732f8", "plan");
  // basic için sağlayıcı tutarı doğrulanmadı => sipariş tutarı üretilemez
  eq(authoritativeAmount("basic"), null, "tutar doğrulanmadı");
});

Deno.test("bilinmeyen paket tipi reddedilir, temel plana düşürülmez", () => {
  eq(paymentPlanFor("bedava-paket"), { ok: false, reason: "unknown_package", packageType: "bedava-paket" });
  eq(paymentPlanFor(""), { ok: false, reason: "unknown_package", packageType: "" });
  eq(paymentPlanFor(undefined), { ok: false, reason: "unknown_package", packageType: "" });
  eq(paymentPlanFor(5000), { ok: false, reason: "unknown_package", packageType: "" });
  eq(resolvePackage("bedava-paket"), null);
});

Deno.test("planı olmayan paketler için ödeme başlatılmaz", () => {
  for (const key of ["discounted", "campaign-premium", "psikolog"]) {
    eq(paymentPlanFor(key), { ok: false, reason: "plan_not_configured", packageType: key }, key);
    eq(authoritativeAmount(key), null, key);
  }
});

Deno.test("büyük/küçük harf ve boşluk toleransı vardır", () => {
  const r = paymentPlanFor("  KAYIT-Linki ");
  eq(r.ok, true, "ok");
  if (r.ok) eq(r.planId, "29429127-2e4f-48ee-a2b7-708a068de378", "plan");
});

Deno.test("katalog dışı nesne anahtarları paket sayılmaz", () => {
  eq(resolvePackage("constructor"), null, "constructor");
  eq(resolvePackage("__proto__"), null, "__proto__");
  eq(resolvePackage("toString"), null, "toString");
  eq(paymentPlanFor("constructor"), { ok: false, reason: "unknown_package", packageType: "constructor" });
});

Deno.test("aynı planı paylaşan paketler birlikte döner", () => {
  eq(packagesForPlan("92feac6d-1181-4b78-b0c2-3b5d5742adff").map((p) => p.key).sort(), ["professional", "special-offer"]);
  eq(packagesForPlan("olmayan-plan"), []);
  eq(packagesForPlan(null), []);
});
