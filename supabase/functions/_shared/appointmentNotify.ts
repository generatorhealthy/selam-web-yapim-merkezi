// Randevu bildirimi kararları — saf mantık, test edilebilir. Gerçek gönderim yapmaz.
export const NOTIFY_WINDOW_MS = 30 * 60 * 1000;        // eski (anon) tetikleyici yolu
export const TRUSTED_NOTIFY_WINDOW_MS = 24 * 60 * 60 * 1000; // güvenilir sunucu yolu: gecikmeler kaybolmasın
export type Caller = 'trusted' | 'legacy_trigger' | 'rejected';

const safeEq = (a: string, b: string) => {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

/** Güvenilir: gizli başlık veya service role. Zorunlu kipte başka her şey reddedilir. */
export function classifyCaller(o: { secretHeader: string | null; secret: string; bearer: string; serviceKey: string; enforce: boolean }): Caller {
  if (safeEq(o.secretHeader ?? '', o.secret) || safeEq(o.bearer, o.serviceKey)) return 'trusted';
  return o.enforce ? 'rejected' : 'legacy_trigger';
}
const PLACEHOLDER = new Set(["02167060611", "902167060611"]);
const digits = (v?: string | null) => (v ?? "").replace(/\D/g, "");
export const isUsablePhone = (v?: string | null) => digits(v).length >= 10 && !PLACEHOLDER.has(digits(v));

/** Bildirim yalnız: randevu gerçekten var, ilk kez ve 30 dk içinde oluşturulmuşsa. */
export function decideNotification(o: { exists: boolean; alreadyNotified: boolean; createdAt: string | null; now: number; caller?: Caller }):
  { send: true } | { send: false; reason: "not_found" | "duplicate" | "stale" } {
  if (!o.exists) return { send: false, reason: "not_found" };
  if (o.alreadyNotified) return { send: false, reason: "duplicate" };
  const t = o.createdAt ? new Date(o.createdAt).getTime() : NaN;
  if (!Number.isFinite(t) || o.now - t > (o.caller === 'trusted' ? TRUSTED_NOTIFY_WINDOW_MS : NOTIFY_WINDOW_MS) || t - o.now > 60_000) return { send: false, reason: "stale" };
  return { send: true };
}

/** Alıcı yalnız uzmanın kayıtlı numarası. İstek gövdesi asla. */
export function pickSpecialistPhone(specialistPhone: string | null | undefined) {
  if (isUsablePhone(specialistPhone)) return { phone: specialistPhone!.trim(), source: "specialists" as const };
  return { phone: null, source: "none" as const };
}

/** Uzmana SMS/WhatsApp: sağlık açıklaması ve serbest not İÇERMEZ. */
export function specialistSms(p: { patientName: string; date: string; time: string; type: string; patientPhone: string }) {
  return `Yeni randevu alındı!\nDanışan: ${p.patientName}\nTarih: ${p.date}\nSaat: ${p.time}\nTür: ${p.type}\nTelefon: ${p.patientPhone}\nAyrıntılar uzman panelinizde.`;
}
export function patientSms(p: { specialistName: string; date: string; time: string; type: string }) {
  return `Randevunuz alindi!\nUzman: ${p.specialistName}\nTarih: ${p.date}\nSaat: ${p.time}\nRandevu Turu: ${p.type}`;
}
