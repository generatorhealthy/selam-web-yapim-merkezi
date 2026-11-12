import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasAdvertisingConsent, HELD_REASON } from "./capiConsent.ts";

function stubAdmin(row: { accepted: boolean } | null, fail = false) {
  const chain: any = {
    select: () => chain, eq: () => chain, order: () => chain, limit: () => chain,
    maybeSingle: () => Promise.resolve(fail ? { data: null, error: { message: "boom" } } : { data: row, error: null }),
  };
  return { from: () => chain };
}

Deno.test("anonymous or malformed user id is never consented", async () => {
  assertEquals(await hasAdvertisingConsent(stubAdmin({ accepted: true }), null), false);
  assertEquals(await hasAdvertisingConsent(stubAdmin({ accepted: true }), "not-a-uuid"), false);
});

Deno.test("only the latest verified advertising grant allows sending", async () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  assertEquals(await hasAdvertisingConsent(stubAdmin({ accepted: true }), uid), true);
  assertEquals(await hasAdvertisingConsent(stubAdmin({ accepted: false }), uid), false);
  assertEquals(await hasAdvertisingConsent(stubAdmin(null), uid), false);
});

Deno.test("unreadable consent evidence fails closed", async () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  assertEquals(await hasAdvertisingConsent(stubAdmin(null, true), uid), false);
});

Deno.test("held reason is stable for audit", () => {
  assertEquals(HELD_REASON, "held_no_verified_advertising_consent");
});
