// QualifiedLead eşik geçişi — saf mantık (yan etkisiz, test edilebilir).
// qualified_at = skorun ilk kez eşiği geçtiği gerçek olay zamanı; kuyruk/gönderim zamanıyla karıştırılmaz.

export type Signal = { key: string; at: string | null; timestamped: boolean };
export type Rule = { rule_key: string; category: string; points: number; enabled: boolean };
export type Decision = "SEND" | "SUPPRESSED_POST_PAYMENT" | "UNDETERMINED_PAID" | "LEGACY_ALREADY_SENT" | "TOO_OLD_FOR_META";

export const META_MAX_AGE_MS = 6 * 864e5; // Meta 7 günden eski olayı kabul etmez; zaman yapay olarak kaydırılmaz

export function ruleVersion(rules: Rule[], threshold: number): string {
  const s = [...rules].sort((a, b) => a.rule_key.localeCompare(b.rule_key))
    .map((r) => `${r.rule_key}:${r.category}:${r.points}:${r.enabled ? 1 : 0}`).join("|");
  let h = 2166136261; // FNV-1a
  for (const c of `${s}#${threshold}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return `v_${h.toString(16)}`;
}

export function computeQualification(i: {
  signals: Signal[]; rules: Rule[]; threshold: number; firstPaidAt: string | null; now: Date; alreadySent: boolean;
}): null | { qualified_at: string | null; precision: "event_timestamp" | "profile_timestamp" | "unknown";
  score: number | null; trigger: string | null; decision: Decision } {
  const pts = new Map(i.rules.filter((r) => r.enabled).map((r) => [r.rule_key, Number(r.points)]));
  const total = [...pts.values()].reduce((a, b) => a + b, 0) || 1;
  // Ödeme bir skor sinyali değildir; yalnız tanımlı kurallar sayılır
  const sigs = i.signals.filter((s) => pts.has(s.key));
  const known = sigs.filter((s) => s.at).sort((a, b) => Date.parse(a.at!) - Date.parse(b.at!));
  const unknown = sigs.filter((s) => !s.at);
  let cum = 0, hit: Signal | null = null, score: number | null = null;
  for (const s of known) {
    cum += pts.get(s.key)!;
    const sc = Math.min(100, Math.round((100 * cum) / total));
    if (sc >= i.threshold) { hit = s; score = sc; break; }
  }
  if (i.alreadySent) {
    // Geçmişte zaten gönderilmiş: zaman kesin kanıtlanamaz, tahmin kesin veri gibi yazılmaz
    return { qualified_at: null, precision: "unknown", score: null, trigger: null, decision: "LEGACY_ALREADY_SENT" };
  }
  // Zamanı bilinmeyen sinyal varsa ve zamanlı sinyallerle eşik geçilmiyorsa zaman belirlenemez
  if (!hit) {
    if (!unknown.length) return null; // henüz eşik geçilmedi
    if (i.firstPaidAt) return { qualified_at: null, precision: "unknown", score: null, trigger: null, decision: "UNDETERMINED_PAID" };
    return null; // zamansız ve ödemesiz: sonraki çalışmada tekrar bakılır, gönderilmez
  }
  const at = hit.at!;
  const precision = hit.timestamped ? "event_timestamp" : "profile_timestamp";
  let decision: Decision = "SEND";
  if (i.firstPaidAt && Date.parse(i.firstPaidAt) <= Date.parse(at)) decision = "SUPPRESSED_POST_PAYMENT";
  else if (i.now.getTime() - Date.parse(at) > META_MAX_AGE_MS) decision = "TOO_OLD_FOR_META";
  return { qualified_at: at, precision, score, trigger: hit.key, decision };
}
