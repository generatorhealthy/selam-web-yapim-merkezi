import { assert, assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "./iyzicoCheckout.ts";
const body = { iyziEventType: "subscription.order.success", subscriptionReferenceCode: "s", orderReferenceCode: "o", customerReferenceCode: "c" };
const official = (m: string, k: string) => createHmac("sha256", k).update(m + k + body.iyziEventType + "s" + "o" + "c").digest("hex");
Deno.test("official subscription example ordering verifies", async () => assert(await verifyWebhookSignature("sec", "mid", body, official("mid", "sec"))));
Deno.test("old secret-first ordering is rejected", async () => {
  const old = createHmac("sha256", "sec").update("sec" + "mid" + body.iyziEventType + "soc").digest("hex");
  assertEquals(await verifyWebhookSignature("sec", "mid", body, old), false);
});
Deno.test("missing merchant or field fails closed", async () => {
  assertEquals(await verifyWebhookSignature("sec", "", body, official("", "sec")), false);
  assertEquals(await verifyWebhookSignature("sec", "mid", { ...body, orderReferenceCode: "" }, official("mid", "sec")), false);
});
