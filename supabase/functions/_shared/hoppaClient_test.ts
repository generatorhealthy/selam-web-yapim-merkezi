import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { buildSavedCardCharge, isPaid, normalizeGsm, pickUsableCard } from "./hoppaClient.ts";
const m = { merchant: "M", merchantKey: "K", env: "test" as const };
const c = { firstName: "A", lastName: "B", mail: "a@b.c", phone: "+90 531 345 30 14" };
Deno.test("telefon Hoppa biçimine çevrilir", () => assertEquals(normalizeGsm("+90 531 345 30 14"), "05313453014"));
Deno.test("geçersiz telefon reddedilir", () => assertThrows(() => normalizeGsm("12345")));
Deno.test("otomatik çekim 3D'siz (METHOD 2) ve kart numarasız gider", () => {
  const b = buildSavedCardCharge(m, "R1", 4000, "uk-1", "https://x", c);
  assertEquals(b.Config.METHOD, 2); assertEquals(b.Config.ORDER_AMOUNT, "4000.00");
  assertEquals(b.CreditCard.UNIQUE_KEY, "uk-1"); assertEquals(b.CreditCard.CC_NUMBER, "");
});
Deno.test("kart anahtarı yoksa çekim yapılmaz", () => assertThrows(() => buildSavedCardCharge(m, "R", 1, "", "u", c)));
Deno.test("süresi dolmuş kart seçilmez", () => {
  assertEquals(pickUsableCard([{ CARD_MASKED_NUMBER: "x", UNIQUE_KEY: "a", IS_EXPIRED: true }]), null);
});
Deno.test("yalnız SUCCESS + 0 ödendi sayılır", () => {
  assertEquals(isPaid({ STATUS: "SUCCESS", RETURN_CODE: "0" }), true);
  assertEquals(isPaid({ STATUS: "FAIL", RETURN_CODE: "0" }), false);
  assertEquals(isPaid({ STATUS: "SUCCESS", RETURN_CODE: "51" }), false);
});
