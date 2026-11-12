// Kişisel veri en aza indirilmiş kayıt yardımcıları. Gönderim veya iş mantığını değiştirmez.
const DROP_KEYS = /^(message|body|text|content|transcript|notes?|address|adres|billing_?address|shipping_?address|identity_?number|tc_?(no|kimlik)?|tckn|identityNumber|password|card.*|cvc|cvv|iban|consultation_topic|answers?)$/i;
const SECRET_KEYS = /(api[-_]?key|secret|token|authorization|password|bearer|signature|cookie)/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?<!\d)(?:\+?90|0)?\s*\(?5\d{2}\)?[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}(?!\d)/g;
const TCKN = /(?<!\d)[1-9]\d{10}(?!\d)/g;
const BEARER = /Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi;

export function maskEmail(v: string) {
  return v.replace(EMAIL, (m) => { const [u, d] = m.split("@"); return `${u.slice(0, 1)}***@${d}`; });
}
export function scrubText(v: string): string {
  return maskEmail(v.replace(BEARER, "Bearer [gizli]").replace(TCKN, "[tckn]").replace(PHONE, (m) => `[tel …${m.replace(/\D/g, "").slice(-2)}]`));
}
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[derin]";
  if (value == null) return value;
  if (typeof value === "string") return scrubText(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEYS.test(k)) out[k] = "[gizli]";
    else if (DROP_KEYS.test(k)) out[k] = v == null ? v : "[çıkarıldı]";
    else out[k] = redact(v, depth + 1);
  }
  return out;
}
export const safeLog = (label: string, data?: unknown) =>
  console.log(label, data === undefined ? "" : JSON.stringify(redact(data)));
