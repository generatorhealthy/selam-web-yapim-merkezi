import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { areaFromTherapy, AREA_EXPERTS, normalizeMobile, statusFromDigit } from "./leadIvr.ts";

Deno.test("alan eşleme", () => {
  assertEquals(areaFromTherapy("çift_terapisi"), "cift");
  assertEquals(areaFromTherapy("aile_danışmanlığı"), "aile");
  assertEquals(areaFromTherapy("Çocuk Terapisi"), "cocuk");
  assertEquals(areaFromTherapy("bireysel_terapi"), "bireysel");
  assertEquals(AREA_EXPERTS[areaFromTherapy("İlişki Danışmanlığı")], "Aile Danışmanı");
});
Deno.test("telefon ve tuş", () => {
  assertEquals(normalizeMobile("+90 532 216 10 46"), "905322161046");
  assertEquals(normalizeMobile("02167060611"), null);
  assertEquals(statusFromDigit("1"), "ivr_pressed_1");
  assertEquals(statusFromDigit("2"), "ivr_pressed_2");
  assertEquals(statusFromDigit("-"), null);
});
