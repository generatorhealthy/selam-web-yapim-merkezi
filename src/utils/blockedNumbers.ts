// Kötüye kullanım nedeniyle engellenen numaralar.
// Bu numaralara hiçbir koşulda SMS / WhatsApp / otomatik arama gönderilmez.
export const BLOCKED_PHONES = ["905383254444", "905308443006"];

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
