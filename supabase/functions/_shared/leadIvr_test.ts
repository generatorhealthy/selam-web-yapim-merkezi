import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { areaFromTherapy, AREA_EXPERTS, normalizeMobile, statusFromDigit, inCallWindow, localMobile, callToken } from "./leadIvr.ts";

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

Deno.test("arama saati 09:30-20:00 (TR)", () => {
  assertEquals(inCallWindow(new Date("2026-11-21T06:29:00Z")), false);
  assertEquals(inCallWindow(new Date("2026-11-21T06:30:00Z")), true);
  assertEquals(inCallWindow(new Date("2026-11-21T16:59:00Z")), true);
  assertEquals(inCallWindow(new Date("2026-11-21T17:00:00Z")), false);
});
Deno.test("santral numarası ve çağrı imzası", async () => {
  assertEquals(localMobile("905313453014"), "05313453014");
  const a = await callToken("x", "k");
  assertEquals(a.length, 64);
  assertEquals(a === (await callToken("y", "k")), false);
});
