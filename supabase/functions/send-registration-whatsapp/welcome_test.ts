import { canReceiveWelcome, normalizePhoneToWa } from "./welcome.ts";

const now = Date.parse("2026-10-06T12:00:00Z");
const recipient = { user_id: "owner", phone: "0532 123 45 67", created_at: "2026-10-06T11:00:00Z" };
function assert(value: boolean) { if (!value) throw new Error("Assertion failed"); }

Deno.test("Spaced registration phones match WhatsApp recipients", () => {
  assert(normalizePhoneToWa("0532 123 45 67") === "905321234567");
  assert(canReceiveWelcome(recipient, "owner", "+90 532 123 45 67", now));
});
Deno.test("Unpaid new specialists can receive welcome without a payment requirement", () => {
  assert(canReceiveWelcome(recipient, "owner", "05321234567", now));
});
Deno.test("Welcome cannot expose another specialist's login email", () => {
  assert(!canReceiveWelcome(recipient, "different-user", "05321234567", now));
  assert(!canReceiveWelcome(recipient, "owner", "05321234568", now));
});
Deno.test("Only registrations within 24 hours can receive welcome", () => {
  assert(!canReceiveWelcome({ ...recipient, created_at: "2026-10-05T11:59:59Z" }, "owner", "05321234567", now));
});