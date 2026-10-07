import { decide, reasonLine } from "../_shared/adDecision.ts";

const s = { target_cac: 2000, min_leads_for_decision: 10, min_purchases_for_scale: 3, min_spend_for_pause: 1000, min_days_active: 3,
  min_roas_for_scale: 1.5, min_roas_for_keep: 1.0, high_conf_min_paid: 5, min_attribution_completeness: 60 };
const base = { spend: 4820, leads: 20, qualified: 6, registrations: 17, profiles: 10, checkouts: 5, paid: 3, net_revenue: 10598,
  active_days: 7, tracked_visits: 50, tracked_spend: 4820, has_tracked_sample: true, attribution_completeness_pct: 80 };
const eq = (a: unknown, b: unknown) => { if (a !== b) throw new Error(`Expected ${b}, got ${a}`); };

Deno.test("Paid + ROAS above threshold scales", () => eq(decide(base, s).decision, "BUYUT"));
Deno.test("Without tracked sample decision is insufficient", () => eq(decide({ ...base, has_tracked_sample: false }, s).decision, "YETERSIZ_VERI"));
Deno.test("Qualified-only signal never scales", () => eq(decide({ ...base, paid: 0, net_revenue: 0, qualified: 15 }, s).decision === "BUYUT", false));
Deno.test("Low attribution completeness blocks SCALE", () => eq(decide({ ...base, attribution_completeness_pct: 20 }, s).decision, "IZLE"));
Deno.test("Low completeness gives low confidence", () => eq(decide({ ...base, attribution_completeness_pct: null }, s).confidence, "DUSUK"));
Deno.test("Reason line uses real numbers and N/A ROAS when unpaid", () =>
  eq(reasonLine({ ...base, paid: 0, net_revenue: 0 }).endsWith("ROAS N/A"), true));
