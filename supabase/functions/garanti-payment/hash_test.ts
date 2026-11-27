import { assertEquals } from "jsr:@std/assert@1";
import { pad9, verifyResponseHash } from "../_shared/garantiHash.ts";
Deno.test("terminal id is zero-padded to 9", () => assertEquals(pad9("10558929"), "010558929"));
Deno.test("tampered response hash is rejected", async () => {
  assertEquals(await verifyResponseHash({ hashparams: "oid:procreturncode:", oid: "X", procreturncode: "00", hash: "ABC" }, "k"), false);
});
