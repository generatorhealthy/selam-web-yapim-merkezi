import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { areaFromTherapy, AREA_EXPERTS, normalizeMobile, statusFromDigit, inCallWindow, localMobile, callToken, bulkIvrStatus, BULK_IVR_STATUSES, readIvrPages, selectIvrBatch } from "./leadIvr.ts";

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

Deno.test("arama saati 10:00-18:00 (TR)", () => {
  assertEquals(inCallWindow(new Date("2026-11-21T06:59:59Z")), false);
  assertEquals(inCallWindow(new Date("2026-11-21T07:00:00Z")), true);
  assertEquals(inCallWindow(new Date("2026-11-21T14:59:59Z")), true);
  assertEquals(inCallWindow(new Date("2026-11-21T15:00:00Z")), false);
});
Deno.test("toplu arama yalnız açmayanlar ve yanlış ulaşanlar", () => {
  assertEquals(bulkIvrStatus(undefined), "no_answer");
  assertEquals(bulkIvrStatus("wrong"), "wrong");
  assertEquals(bulkIvrStatus("transferred"), null);
  assertEquals(bulkIvrStatus("ivr_pressed_2"), null);
  assertEquals([...BULK_IVR_STATUSES], ["no_answer", "wrong"]);
});
Deno.test("hepsini ara 1607 kaydı kesmez; ilk beş ayrı seçilir", async () => {
  const fixture = Array.from({ length: 1607 }, (_, i) => i);
  const pages: number[][] = [];
  const rows = await readIvrPages(async (from, to) => {
    pages.push([from, to]);
    return fixture.slice(from, to + 1);
  });
  assertEquals(pages, [[0, 999], [1000, 1999]]);
  assertEquals(selectIvrBatch(rows, undefined).length, 1607);
  assertEquals(selectIvrBatch(rows, undefined)[1606], 1606);
  assertEquals(selectIvrBatch(rows, 5), [0, 1, 2, 3, 4]);
});
Deno.test("santral numarası ve çağrı imzası", async () => {
  assertEquals(localMobile("905313453014"), "05313453014");
  const a = await callToken("x", "k");
  assertEquals(a.length, 64);
  assertEquals(a === (await callToken("y", "k")), false);
});
