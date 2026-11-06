import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyPage, clickPotential, pageTarget } from "../../supabase/functions/_shared/seoRules.ts";

const base = { page: "https://doktorumol.com.tr/blog/x", clicks: 3, impressions: 3000, ctr: 0.001, position: 5, topQuery: "x" };

test("sırasına göre çok az tıklanan sayfa yüksek öncelikli işaretlenir", () => {
  assert.deepEqual(classifyPage(base, "Uygun uzunlukta bir başlık örneği burada", "a".repeat(120)), [{ issue: "low_ctr", severity: "high" }]);
});
test("8–20. sıradaki sayfa ilk sayfaya yakın sayılır", () => {
  const r = classifyPage({ ...base, ctr: 0.02, position: 12 }, "Uygun uzunlukta bir başlık örneği burada", "a".repeat(120));
  assert.ok(r.some((i) => i.issue === "striking_distance"));
});
test("blog ve uzman adresleri ayırt edilir", () => {
  assert.deepEqual(pageTarget("https://doktorumol.com.tr/blog/kaygi"), { type: "blog", slug: "kaygi" });
  assert.deepEqual(pageTarget("https://doktorumol.com.tr/psikolog/ayse-yilmaz"), { type: "specialist", slug: "ayse-yilmaz" });
  assert.equal(pageTarget("https://doktorumol.com.tr/uzmanlik/istanbul-psikolog").type, "other");
});
test("ek tıklama potansiyeli ilk 3 sıranın tıklama oranına göre hesaplanır", () => {
  assert.equal(clickPotential({ ...base, impressions: 1000, clicks: 10, position: 8 }), 90);
});
