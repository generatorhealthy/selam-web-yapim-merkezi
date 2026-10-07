export type Coverage = {
  attribution_started_at?: string | null;
  tracked_visits?: number;
  tracked_spend?: number;
  tracked_active_days?: number;
};
export type Thresholds = {
  min_leads_for_decision: number;
  min_spend_for_pause: number;
  min_days_active: number;
};

export function attributedRoas(revenue: number, spend: number, paid: number): number | null {
  return paid > 0 && spend > 0 ? revenue / spend : null;
}

export function hasTrackedSample(row: Coverage, rules: Thresholds): boolean {
  return Boolean(row.attribution_started_at)
    && Number(row.tracked_visits || 0) > 0
    && Number(row.tracked_visits || 0) >= Math.max(1, rules.min_leads_for_decision)
    && Number(row.tracked_active_days || 0) >= Math.max(1, rules.min_days_active);
}

export function canWarnNoSales(row: Coverage & { paid: number }, rules: Thresholds): boolean {
  return row.paid === 0 && hasTrackedSample(row, rules)
    && Number(row.tracked_spend || 0) >= rules.min_spend_for_pause;
}