import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chargeKey, nextRetry, paymentUrl } from "./logic.ts";
const now = new Date("2026-12-01T00:00:00Z");
Deno.test("3 deneme: 1., 3., 7. gün, sonra başarısız", () => {
  assertEquals(nextRetry(1, now)?.toISOString(), "2026-12-03T00:00:00.000Z");
  assertEquals(nextRetry(2, now)?.toISOString(), "2026-12-05T00:00:00.000Z");
  assertEquals(nextRetry(3, now), null);
});
Deno.test("aynı dönem ve deneme aynı anahtarı üretir", () => assertEquals(chargeKey("a", 2, 0), chargeKey("a", 2, 0)));
Deno.test("yalnız https ödeme adresi kabul", () => {
  assertEquals(paymentUrl({ URL_3DS: "http://x" }), null);
  assertEquals(paymentUrl({ URL_3DS: "https://pos.esnekpos.com/p" }), "https://pos.esnekpos.com/p");
});
