import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { bindingDecision, digest, operationKey, rowsFor, sign, validateChoices, verify, type Receipt } from "./receipt.ts";
const secret = "test-only-key-not-a-production-key-123456";
const receipt: Receipt = { id: "operation", emailHash: "email-hash", documentVersion: "legacy-mobile", documentHash: "server-hash", issuedAt: 100, expiresAt: 200,
  choices: { disclosureShown: true, disclosureRead: true, explicitConsent: false, marketingConsent: false } };
const account = { id: "account", email: "example@example.com", emailConfirmed: true, provider: "email" as const };
Deno.test("absence of real choice never defaults to acceptance", () => {
  assertEquals(validateChoices({}), null);
  assertEquals(validateChoices({ ...receipt.choices, disclosureRead: false }), null);
  assertEquals(validateChoices({ ...receipt.choices, marketingConsent: "true" }), null);
});
Deno.test("optional choices remain declined", () => assertEquals(rowsFor(receipt,"account").map(r=>r.accepted),[true,false,false]));
Deno.test("unconfirmed email cannot bind a receipt", () => assertEquals(bindingDecision(receipt,{...account,emailConfirmed:false},"email-hash",150),"verified_session_required"));
Deno.test("signed-out receipt is not a user consent grant", () => assertEquals(bindingDecision(receipt,null,"email-hash",150),"verified_session_required"));
Deno.test("confirmed email and matching context can bind", () => assertEquals(bindingDecision(receipt,account,"email-hash",150),"ok"));
Deno.test("another account email cannot consume", () => assertEquals(bindingDecision(receipt,account,"different",150),"account_mismatch"));
for (const provider of ["google","apple"] as const) Deno.test(`${provider} needs authenticated reaffirmation, not arbitrary prefilled email`, () =>
  assertEquals(bindingDecision(receipt,{...account,provider},"email-hash",150),"oauth_reaffirmation_required"));
Deno.test("expired or future-issued context cannot bind", () => {
  assertEquals(bindingDecision(receipt,account,"email-hash",200),"expired");
  assertEquals(bindingDecision(receipt,account,"email-hash",99),"expired");
});
Deno.test("server signature protects declaration and document", async () => {
  const signature = await sign(receipt,secret);
  assertEquals(await verify(receipt,signature,secret),true);
  assertEquals(await verify({...receipt,choices:{...receipt.choices,explicitConsent:true}},signature,secret),false);
  assertEquals(await verify({...receipt,documentVersion:"forged"},signature,secret),false);
  assertEquals(await verify(receipt,signature,"another-test-key-longer-than-32-bytes"),false);
});
Deno.test("withdrawal and grant use separate immutable keys", async () => assertNotEquals(await operationKey("account","transaction","health_test","grant"),await operationKey("account","transaction","health_test","withdraw")));
Deno.test("same operation reuses key, different accounts never share", async () => {
  const keys=await Promise.all(Array.from({length:30},()=>operationKey("account","transaction","health_test","grant")));
  assertEquals(new Set(keys).size,1);
  assertNotEquals(keys[0],await operationKey("other","transaction","health_test","grant"));
});
Deno.test("normalised email fingerprint computed on server", async () => assertEquals(await digest("Example@Example.com".trim().toLowerCase()),await digest("example@example.com")));