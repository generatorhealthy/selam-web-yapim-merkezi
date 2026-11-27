import { assert, assertEquals } from "jsr:@std/assert@1";
import { base32Encode, hotp, verifyTotp, signGateTicket, verifyGateTicket } from "./totp.ts";

// RFC 4226 test secret "12345678901234567890"
const secret = base32Encode(new TextEncoder().encode("12345678901234567890"));
Deno.test("hotp matches RFC 4226 vectors", async () => {
  assertEquals(await hotp(secret, 0), "755224");
  assertEquals(await hotp(secret, 1), "287082");
  assertEquals(await hotp(secret, 9), "520489");
});
Deno.test("totp accepts current step, rejects far codes", async () => {
  const now = 59_000; // step 1
  assert(await verifyTotp(secret, "287082", now));
  assert(!(await verifyTotp(secret, "520489", now)));
  assert(!(await verifyTotp(secret, "abc", now)));
});
Deno.test("gate ticket expires and rejects tampering", async () => {
  const t = await signGateTicket("k", 1000);
  assert(await verifyGateTicket("k", t, 2000));
  assert(!(await verifyGateTicket("k", t, 1000 + 11 * 60_000)));
  assert(!(await verifyGateTicket("other", t, 2000)));
});
