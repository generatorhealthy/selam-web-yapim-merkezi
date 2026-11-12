import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasAdvertisingConsent, HELD_REASON } from "./capiConsent.ts";

function stubAdmin(row: { accepted: boolean } | null, fail = false) {
  const filters: Record<string, string> = {};
  const chain: any = {
    select: () => chain,
    eq: (col: string, val: string) => { filters[col] = val; return chain; },
    order: () => chain, limit: () => chain,
    maybeSingle: () => Promise.resolve(fail ? { data: null, error: { message: "boom" } } : { data: row, error: null }),
  };
  return { from: () => chain, filters };
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

Deno.test("only server-verified record_consent rows count as evidence", async () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  const stub = stubAdmin({ accepted: true });
  await hasAdvertisingConsent(stub, uid);
  // Eski doğrudan INSERT kaynakları (mobile_signup vb.) kanıt sayılmaz:
  // sorgu yalnızca sunucu kimlik doğrulamalı kayıtlara iner.
  assertEquals(stub.filters.source, "record_consent");
  assertEquals(stub.filters.consent_type, "advertising");
  assertEquals(stub.filters.user_id, uid);
});

Deno.test("unreadable consent evidence fails closed", async () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  assertEquals(await hasAdvertisingConsent(stubAdmin(null, true), uid), false);
});

Deno.test("held reason is stable for audit", () => {
  assertEquals(HELD_REASON, "held_no_verified_advertising_consent");
});
