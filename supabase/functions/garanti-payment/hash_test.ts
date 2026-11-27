import { assertEquals } from "jsr:@std/assert@1";
import { pad9, verifyResponseHash } from "../_shared/garantiHash.ts";
import { historySales } from "../_shared/garantiXml.ts";
Deno.test("terminal id is zero-padded to 9", () => assertEquals(pad9("10558929"), "010558929"));
Deno.test("tampered response hash is rejected", async () => {
  assertEquals(await verifyResponseHash({ hashparams: "oid:procreturncode:", oid: "X", procreturncode: "00", hash: "ABC" }, "k"), false);
});
Deno.test("only approved, non-voided sales count as recurring payments", () => {
  const x = `<OrderTxn><Type>sales</Type><ReturnCode>00</ReturnCode><AuthAmount>750000</AuthAmount><RetrefNum>1</RetrefNum><VoidDate></VoidDate></OrderTxn>
  <OrderTxn><Type>sales</Type><ReturnCode>51</ReturnCode><RetrefNum>2</RetrefNum></OrderTxn>
  <OrderTxn><Type>refund</Type><ReturnCode>00</ReturnCode><RetrefNum>3</RetrefNum></OrderTxn>
  <OrderTxn><Type>sales</Type><ReturnCode>00</ReturnCode><RetrefNum>4</RetrefNum><VoidDate>20261201</VoidDate></OrderTxn>`;
  assertEquals(historySales(x).map((t) => t.retref), ["1"]);
});
