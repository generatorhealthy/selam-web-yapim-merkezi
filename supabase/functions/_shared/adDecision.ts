// Deterministik reklam karar motoru — UI ve AI analizi aynı kuralları kullanır.
// AI bu kararı değiştiremez; yalnız açıklar. Eşikler ad_intel_settings'ten gelir.
export type Decision = "BUYUT" | "KORU" | "IZLE" | "AZALT" | "DURDUR" | "YETERSIZ_VERI";
export type Confidence = "YUKSEK" | "ORTA" | "DUSUK";

export type DecisionSettings = {
  target_cac: number; min_leads_for_decision: number; min_purchases_for_scale: number;
  min_spend_for_pause: number; min_days_active: number; qualified_threshold?: number;
  min_roas_for_scale: number; min_roas_for_keep: number; high_conf_min_paid: number;
  min_attribution_completeness: number; // yüzde
};

export type DecisionInput = {
  spend: number; leads: number; qualified: number; registrations: number; profiles: number;
  checkouts: number; paid: number; net_revenue: number; active_days: number;
  tracked_visits: number; tracked_spend: number; has_tracked_sample: boolean;
  attribution_completeness_pct: number | null; // null = ölçülemedi
};

const r2 = (n: number) => Math.round(n * 100) / 100;
export const ratio = (a: number, b: number) => (b > 0 ? r2(a / b) : null);
const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;
const x2 = (n: number) => n.toFixed(2).replace(".", ",");

export function confidenceOf(m: DecisionInput, s: DecisionSettings): { level: Confidence; factors: Record<string, unknown> } {
  const comp = m.attribution_completeness_pct;
  const compOk = comp != null && comp >= s.min_attribution_completeness;
  const volumeOk = m.leads >= s.min_leads_for_decision;
  const daysOk = m.active_days >= s.min_days_active;
  const paidHigh = m.paid >= s.high_conf_min_paid;
  const paidSome = m.paid >= s.min_purchases_for_scale;
  let level: Confidence = "DUSUK";
  if (m.has_tracked_sample && compOk && volumeOk && daysOk && paidHigh) level = "YUKSEK";
  else if (m.has_tracked_sample && compOk && volumeOk && daysOk && (paidSome || m.qualified >= s.min_leads_for_decision)) level = "ORTA";
  return { level, factors: { attribution_completeness_pct: comp, completeness_ok: compOk, leads: m.leads, volume_ok: volumeOk, active_days: m.active_days, days_ok: daysOk, paid: m.paid, tracked_sample: m.has_tracked_sample } };
}

/** Öncelik: Paid+NetCiro+CAC+ROAS → Nitelikli+CPQL → Kayıt/Profil+CPL. CTR/CPC karar üretmez. */
export function decide(m: DecisionInput, s: DecisionSettings): { decision: Decision; confidence: Confidence; basis: string; factors: Record<string, unknown> } {
  const { level, factors } = confidenceOf(m, s);
  const cac = ratio(m.spend, m.paid);
  const roas = m.paid > 0 && m.spend > 0 ? r2(m.net_revenue / m.spend) : null;
  const cpql = ratio(m.spend, m.qualified);
  const cpl = ratio(m.spend, m.leads);
  let decision: Decision = "YETERSIZ_VERI", basis = "insufficient";
  const canNegative = m.has_tracked_sample && m.tracked_spend >= s.min_spend_for_pause;

  if (!m.has_tracked_sample || m.leads < s.min_leads_for_decision) {
    decision = "YETERSIZ_VERI"; basis = "insufficient";
  } else if (m.paid >= s.min_purchases_for_scale && roas != null && cac != null) {
    basis = "paid";
    if (roas >= s.min_roas_for_scale && cac <= s.target_cac && m.active_days >= s.min_days_active) decision = "BUYUT";
    else if (roas >= s.min_roas_for_keep) decision = "KORU";
    else if (canNegative) decision = "AZALT";
    else decision = "IZLE";
  } else if (m.qualified > 0 && cpql != null) {
    basis = "qualified";
    // Satış örneği yetersiz: ikincil sinyal en fazla KORU/İZLE üretir, BÜYÜT üretmez.
    decision = cpql <= s.target_cac / 3 ? "KORU" : "IZLE";
  } else {
    basis = "registrations";
    if (canNegative && m.tracked_spend >= s.min_spend_for_pause * 2 && m.registrations === 0 && m.paid === 0) decision = "DURDUR";
    else if (canNegative && m.paid === 0 && m.qualified === 0) decision = "AZALT";
    else decision = "IZLE";
    void cpl;
  }
  // Düşük güvende agresif karar yok
  if (level === "DUSUK" && (decision === "BUYUT" || decision === "DURDUR")) decision = decision === "BUYUT" ? "IZLE" : "AZALT";
  if (level === "DUSUK" && decision === "AZALT" && !canNegative) decision = "YETERSIZ_VERI";
  return { decision, confidence: decision === "YETERSIZ_VERI" ? "DUSUK" : level, basis, factors };
}

/** Sistemin hesapladığı sabit gerekçe satırı; olmayan metrik yazılmaz, sıfır uydurulmaz. */
export function reasonLine(m: DecisionInput): string {
  const parts = [`${tl(m.spend)} harcama`, `${m.registrations} kayıt`, `${m.qualified} nitelikli aday`, `${m.paid} ücretli üye`];
  if (m.paid > 0) parts.push(`${tl(m.net_revenue)} net ciro`);
  const cac = ratio(m.spend, m.paid);
  if (cac != null) parts.push(`CAC ${tl(cac)}`);
  if (m.paid > 0 && m.spend > 0) parts.push(`ROAS ${x2(m.net_revenue / m.spend)}`);
  else parts.push("ROAS N/A");
  return parts.join(" → ");
}

export const DECISION_LABEL: Record<Decision, string> = {
  BUYUT: "BÜYÜT (SCALE)", KORU: "KORU (KEEP)", IZLE: "İZLE (WATCH)",
  AZALT: "AZALT (REDUCE)", DURDUR: "DURDUR (PAUSE)", YETERSIZ_VERI: "YETERSİZ VERİ (INSUFFICIENT DATA)",
};
export const CONFIDENCE_LABEL: Record<Confidence, string> = { YUKSEK: "YÜKSEK (HIGH)", ORTA: "ORTA (MEDIUM)", DUSUK: "DÜŞÜK (LOW)" };
