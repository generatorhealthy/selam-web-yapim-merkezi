import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chargeKey, nextRetry, paymentUrl, providerFailure, requireCardList } from "./logic.ts";
const now = new Date("2026-12-01T00:00:00Z");
Deno.test("3 deneme: 1., 3., 7. gün, sonra başarısız", () => {
  assertEquals(nextRetry(1, now)?.toISOString(), "2026-12-03T00:00:00.000Z");
  assertEquals(nextRetry(2, now)?.toISOString(), "2026-12-05T00:00:00.000Z");
  assertEquals(nextRetry(3, now), null);
});
Deno.test("IP reddi güvenli kodla ayrılır ve ham sağlayıcı metni dönmez", () => {
  assertEquals(providerFailure({ RETURN_MESSAGE: 'Bu IP adresinden işlem yapma yetkiniz bulunmamaktadır. IP: PRIVATE' }).code, 'provider_ip_denied');
  assertEquals(providerFailure({ RETURN_MESSAGE: 'PRIVATE' }).error.includes('PRIVATE'), false);
});
Deno.test("boş kart listesi bağlantı hatasından farklıdır", () => {
  assertEquals(requireCardList({ CARDS: [] }), []);
  let rejected = false;
  try { requireCardList(null); } catch { rejected = true; }
  assertEquals(rejected, true);
});
Deno.test("aynı dönem ve deneme aynı anahtarı üretir", () => assertEquals(chargeKey("a", 2, 0), chargeKey("a", 2, 0)));
Deno.test("yalnız https ödeme adresi kabul", () => {
  assertEquals(paymentUrl({ URL_3DS: "http://x" }), null);
  assertEquals(paymentUrl({ URL_3DS: "https://pos.esnekpos.com/p" }), "https://pos.esnekpos.com/p");
});
