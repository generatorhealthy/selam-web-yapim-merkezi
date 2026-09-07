// Kötüye kullanım nedeniyle engellenen numaralar.
// Bu numaralara hiçbir koşulda SMS / WhatsApp / otomatik arama gönderilmez.
export const BLOCKED_PHONES = ["905383254444", "905308443006", "905541582878", "905399572171"];

export const normalizeBlockPhone = (raw?: string | null): string => {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "90" + d.slice(1);
  else if (!d.startsWith("90")) d = "90" + d;
  return d;
};

export const isBlockedPhone = (raw?: string | null): boolean => {
  const n = normalizeBlockPhone(raw);
  if (!n) return false;
  const last10 = n.slice(-10);
  return BLOCKED_PHONES.some((b) => b.slice(-10) === last10);
};

// Kötüye kullanım nedeniyle engellenen isimler ve e-postalar.
export const BLOCKED_NAMES = ["yusuf kara"];
export const BLOCKED_EMAILS = ["tubitak38@gmail.com"];

const normalizeName = (raw?: string | null): string =>
  (raw || "").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();

export const isBlockedName = (raw?: string | null): boolean => {
  const n = normalizeName(raw);
  return !!n && BLOCKED_NAMES.includes(n);
};

export const isBlockedEmail = (raw?: string | null): boolean => {
  const e = (raw || "").trim().toLowerCase();
  return !!e && BLOCKED_EMAILS.includes(e);
};

/** Ad, e-posta veya telefon engelli listede mi? */
export const isBlockedVisitor = (v: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}): boolean => isBlockedName(v.name) || isBlockedEmail(v.email) || isBlockedPhone(v.phone);
