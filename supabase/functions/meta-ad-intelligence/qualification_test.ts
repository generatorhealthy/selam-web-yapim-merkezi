import { computeQualification, ruleVersion, type Rule, type Signal } from "../_shared/qualification.ts";

const eq = (a: unknown, b: unknown) => { if (a !== b) throw new Error(`Expected ${b}, got ${a}`); };
const rules: Rule[] = [
  ["profile_completed", 15], ["has_bio", 5], ["has_education", 5], ["has_photo", 5], ["online_consultation", 10],
  ["face_to_face", 5], ["capacity_entered", 5], ["capacity_6_plus", 10], ["pricing_page_view", 5],
  ["registration_started", 5], ["registration_completed", 15], ["checkout_started", 20], ["payment_failed", 5],
].map(([k, p]) => ({ rule_key: k as string, category: "x", points: p as number, enabled: true }));
const P = "2026-10-07T14:37:00Z";
const prof: Signal[] = ["registration_started", "profile_completed", "has_bio", "has_education", "has_photo",
  "online_consultation", "face_to_face", "registration_completed"].map((key) => ({ key, at: P, timestamped: false }));
const real: Signal[] = [...prof, { key: "pricing_page_view", at: "2026-10-07T15:54:07Z", timestamped: true },
  { key: "checkout_started", at: "2026-10-07T15:58:29Z", timestamped: true }];
const now = new Date("2026-10-08T07:00:00Z");
const base = { rules, threshold: 60, now, alreadySent: false };

Deno.test("Crossing before payment sends with real event time (score 82 case → crosses at 64)", () => {
  const r = computeQualification({ ...base, signals: real, firstPaidAt: "2026-10-07T16:04:01Z" })!;
  eq(r.decision, "SEND"); eq(r.qualified_at, "2026-10-07T15:54:07Z"); eq(r.score, 64);
  eq(r.trigger, "pricing_page_view"); eq(r.precision, "event_timestamp");
});
Deno.test("First crossing after payment is suppressed", () => {
  const r = computeQualification({ ...base, signals: real, firstPaidAt: "2026-10-07T15:00:00Z" })!;
  eq(r.decision, "SUPPRESSED_POST_PAYMENT");
});
Deno.test("Payment is not a score signal", () => {
  const r = computeQualification({ ...base, signals: [...prof.slice(0, 2), { key: "paid", at: P, timestamped: true }], firstPaidAt: null });
  eq(r, null);
});
Deno.test("Already recorded/sent user never gets a second QualifiedLead", () => {
  eq(computeQualification({ ...base, signals: real, firstPaidAt: null, alreadySent: true })!.decision, "LEGACY_ALREADY_SENT");
});
Deno.test("Same input processed twice gives identical result (idempotent)", () => {
  const a = computeQualification({ ...base, signals: real, firstPaidAt: null })!;
  const b = computeQualification({ ...base, signals: real, firstPaidAt: null })!;
  eq(JSON.stringify(a), JSON.stringify(b));
});
Deno.test("Rule change produces a new rule version", () => {
  const changed = rules.map((r) => r.rule_key === "checkout_started" ? { ...r, points: 25 } : r);
  eq(ruleVersion(rules, 60) === ruleVersion(changed, 60), false);
  eq(ruleVersion(rules, 60), ruleVersion([...rules].reverse(), 60));
});
Deno.test("Unknown history time with payment is reported, not invented", () => {
  const sigs = real.map((s) => ({ ...s, at: null }));
  const r = computeQualification({ ...base, signals: sigs, firstPaidAt: "2026-10-07T16:04:01Z" })!;
  eq(r.decision, "UNDETERMINED_PAID"); eq(r.qualified_at, null);
});
Deno.test("Unknown time without payment is not recorded yet", () =>
  eq(computeQualification({ ...base, signals: real.map((s) => ({ ...s, at: null })), firstPaidAt: null }), null));
Deno.test("Crossing older than Meta window is not shifted, just not sent", () =>
  eq(computeQualification({ ...base, signals: real, firstPaidAt: null, now: new Date("2026-10-20T00:00:00Z") })!.decision, "TOO_OLD_FOR_META"));
Deno.test("Profile-only crossing is labelled profile_timestamp precision", () => {
  const r = computeQualification({ ...base, signals: prof, firstPaidAt: null })!;
  eq(r.precision, "profile_timestamp"); eq(r.qualified_at, P);
});
