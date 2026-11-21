import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { IVR_LINES, ivrDialPrefix } from "./ivrLines.ts";

Deno.test("81 uses the confirmed caller number", () => {
  assertEquals(IVR_LINES.find((l) => l.prefix === "81")?.phone, "905317893880");
});
Deno.test("80 uses the corrected caller number", () => {
  assertEquals(IVR_LINES.find((l) => l.prefix === "80")?.phone, "905328222275");
});
Deno.test("dual helper allocates one of the two lines atomically", () => {
  assertEquals(ivrDialPrefix({ dual_line: true }), "auto");
});
Deno.test("old helper stays on 81 until installed", () => {
  assertEquals(ivrDialPrefix({}), "81");
});