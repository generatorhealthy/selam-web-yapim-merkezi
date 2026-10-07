import { attributedRoas, canWarnNoSales } from "../_shared/adAttribution.ts";

const rules = { min_leads_for_decision: 10, min_spend_for_pause: 1000, min_days_active: 3 };
const tracked = { attribution_started_at: "2026-10-06T21:44:34Z", tracked_visits: 10, tracked_spend: 1000, tracked_active_days: 3, paid: 0 };
function equal(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
}
Deno.test("ROAS is N/A without a matched successful payment", () => equal(attributedRoas(0, 10221, 0), null));
Deno.test("ROAS starts after one matched successful payment", () => equal(attributedRoas(4000, 1000, 1), 4));
Deno.test("Historical spend cannot trigger a no-sales warning", () => equal(canWarnNoSales({ ...tracked, tracked_spend: 0 }, rules), false));
Deno.test("Untracked traffic cannot trigger a no-sales warning", () => equal(canWarnNoSales({ ...tracked, tracked_visits: 0 }, rules), false));
Deno.test("Traffic below the configured minimum cannot trigger a warning", () => equal(canWarnNoSales({ ...tracked, tracked_visits: 9 }, rules), false));
Deno.test("Tracked days below the configured minimum cannot trigger a warning", () => equal(canWarnNoSales({ ...tracked, tracked_active_days: 2 }, rules), false));
Deno.test("Missing inception date cannot trigger a warning", () => equal(canWarnNoSales({ ...tracked, attribution_started_at: null }, rules), false));
Deno.test("Sufficient tracked spend and traffic with no sales can trigger a warning", () => equal(canWarnNoSales(tracked, rules), true));
Deno.test("A matched payment prevents the no-sales warning", () => equal(canWarnNoSales({ ...tracked, paid: 1 }, rules), false));