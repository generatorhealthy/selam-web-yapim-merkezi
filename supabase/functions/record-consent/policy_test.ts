import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authenticatedSubject, DOCUMENTS, documentFor, eventId, parseInput, sha256 } from "./policy.ts";
const input = { transaction_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", purpose: "health_test" as const, action: "grant" as const };
Deno.test("anonymous account cannot create consent", () => assertEquals(authenticatedSubject(null), null));
for (const role of ["user", "specialist", "staff", "admin"]) {
  Deno.test(`${role}: identity comes from verified account, not app privilege`, () => {
    assertEquals(authenticatedSubject({ id: role, role: "authenticated" }), role);
    assertEquals(parseInput({ ...input, user_id: "another-account", role }), null);
  });
}
for (const field of ["ip_address", "consent_version", "document_hash", "email", "accepted_at"]) {
  Deno.test(`caller-supplied ${field} is rejected`, () => assertEquals(parseInput({ ...input, [field]: "forged" }), null));
}
Deno.test("health documents stay unpublished; disclosure v9 is pinned by hash", () => {
  assertEquals(DOCUMENTS.explicit_consent.published, false);
  assertEquals(DOCUMENTS.disclosure.published, true);
  assertEquals(DOCUMENTS.disclosure.version, "2026-11-12-v9");
  assertEquals(DOCUMENTS.disclosure.hash, "00cf77757d5da1d61407c8c775a7ed7c3576966c0901bed1e023f35f27001fc9");
});
Deno.test("health purposes still cannot create grants before document publication", () => {
  assertEquals(documentFor(input)?.published, false);
});
Deno.test("cookie-banner purposes are evidenced against the published disclosure", () => {
  for (const purpose of ["analytics", "advertising"] as const) {
    const doc = documentFor({ ...input, purpose });
    assertEquals(doc?.published, true);
    assertEquals(doc?.hash, DOCUMENTS.disclosure.hash);
  }
});
Deno.test("analytics and advertising purposes are independent evidence", async () => {
  assertNotEquals(
    await eventId("account-1", { ...input, purpose: "analytics" }),
    await eventId("account-1", { ...input, purpose: "advertising" }),
  );
});
Deno.test("anonymous token must be 64 hex chars; anything else is rejected", () => {
  const valid = "a".repeat(64);
  assertEquals(parseInput({ ...input, purpose: "advertising", transaction_token: valid })?.transaction_token, valid);
  assertEquals(parseInput({ ...input, purpose: "advertising", transaction_token: "consent=true" }), null);
  assertEquals(parseInput({ ...input, purpose: "advertising", transaction_token: valid.slice(0, 63) }), null);
  assertEquals(parseInput({ ...input, purpose: "advertising", transaction_token: 12345 }), null);
});
Deno.test("retry and concurrent requests target exactly one primary key", async () => {
  const ids = await Promise.all(Array.from({ length: 30 }, () => eventId("account-1", input)));
  assertEquals(new Set(ids).size, 1);
});
Deno.test("withdrawal appends a separate event instead of overwriting grant", async () =>
  assertNotEquals(await eventId("account-1", input), await eventId("account-1", { ...input, action: "withdraw" })));
Deno.test("operation is scoped to subject", async () =>
  assertNotEquals(await eventId("account-1", input), await eventId("account-2", input)));
Deno.test("purpose has independent evidence", async () =>
  assertNotEquals(await eventId("account-1", input), await eventId("account-1", { ...input, purpose: "marketing_etk" })));
Deno.test("server hashes exact document bytes with SHA-256", async () =>
  assertEquals(await sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
Deno.test("invalid operation and purpose are rejected", () => {
  assertEquals(parseInput({ ...input, transaction_id: "bad" }), null);
  assertEquals(parseInput({ ...input, purpose: "all" }), null);
  assertEquals(parseInput({ ...input, action: "update" }), null);
});
