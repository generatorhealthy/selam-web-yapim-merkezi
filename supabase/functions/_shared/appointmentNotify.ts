// Randevu bildirimi kararları — saf mantık, test edilebilir. Gerçek gönderim yapmaz.
export const NOTIFY_WINDOW_MS = 30 * 60 * 1000;
const PLACEHOLDER = new Set(["02167060611", "902167060611"]);
const digits = (v?: string | null) => (v ?? "").replace(/\D/g, "");
export const isUsablePhone = (v?: string | null) => digits(v).length >= 10 && !PLACEHOLDER.has(digits(v));

/** Bildirim yalnız: randevu gerçekten var, ilk kez ve 30 dk içinde oluşturulmuşsa. */
export function decideNotification(o: { exists: boolean; alreadyNotified: boolean; createdAt: string | null; now: number }):
  { send: true } | { send: false; reason: "not_found" | "duplicate" | "stale" } {
  if (!o.exists) return { send: false, reason: "not_found" };
  if (o.alreadyNotified) return { send: false, reason: "duplicate" };
  const t = o.createdAt ? new Date(o.createdAt).getTime() : NaN;
  if (!Number.isFinite(t) || o.now - t > NOTIFY_WINDOW_MS || t - o.now > 60_000) return { send: false, reason: "stale" };
  return { send: true };
}

/** Alıcı yalnız sistem kaydından: önce uzman kaydı, sonra uzmanın kendi e-postasıyla eşleşen siparişler. İstek gövdesi asla. */
export function pickSpecialistPhone(specialistPhone: string | null | undefined, orderPhonesByEmail: Array<string | null | undefined>) {
  if (isUsablePhone(specialistPhone)) return { phone: specialistPhone!.trim(), source: "specialists" as const };
  const o = orderPhonesByEmail.find(isUsablePhone);
  return o ? { phone: o.trim(), source: "orders_email" as const } : { phone: null, source: "none" as const };
}

/** Uzmana SMS/WhatsApp: sağlık açıklaması ve serbest not İÇERMEZ. */
export function specialistSms(p: { patientName: string; date: string; time: string; type: string; patientPhone: string }) {
  return `Yeni randevu alındı!\nDanışan: ${p.patientName}\nTarih: ${p.date}\nSaat: ${p.time}\nTür: ${p.type}\nTelefon: ${p.patientPhone}\nAyrıntılar uzman panelinizde.`;
}
export function patientSms(p: { specialistName: string; date: string; time: string; type: string }) {
  return `Randevunuz alindi!\nUzman: ${p.specialistName}\nTarih: ${p.date}\nSaat: ${p.time}\nRandevu Turu: ${p.type}`;
}
