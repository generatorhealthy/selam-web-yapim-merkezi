/** Kayıt formu yardımcıları: tek kural hem görsel durumu hem doğrulamayı belirler. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

/**
 * Yaygın Türkiye cep telefonu yazımlarını (05xx, 5xx, 905xx, +905xx; boşluk/tire/parantez)
 * tek standarda (05XXXXXXXXX) çevirir. Geçersizse null döner.
 */
export const normalizeTrMobile = (raw: string): string | null => {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("0090")) d = d.slice(4);
  else if (d.length === 12 && d.startsWith("90")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (!/^5\d{9}$/.test(d)) return null;
  return `0${d}`;
};
