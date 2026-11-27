import { assertEquals } from "jsr:@std/assert@1";
import { staffWindowOpen } from "./staffHours.ts";
Deno.test("cumartesi 09:29 kapalı, 09:30 açık", () => {
  assertEquals(staffWindowOpen(new Date("2026-11-28T06:29:00Z")), false);
  assertEquals(staffWindowOpen(new Date("2026-11-28T06:30:00Z")), true);
});
Deno.test("18:29 açık, 18:30 kapalı", () => {
  assertEquals(staffWindowOpen(new Date("2026-11-28T15:29:00Z")), true);
  assertEquals(staffWindowOpen(new Date("2026-11-28T15:30:00Z")), false);
});
Deno.test("pazar tamamen kapalı", () => {
  assertEquals(staffWindowOpen(new Date("2026-11-29T09:00:00Z")), false);
});
