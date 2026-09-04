// Kara liste: bu numaralara hiçbir koşulda SMS veya otomatik arama gitmez.
// Kötüye kullanım / hatalı numara bildirimleri sonrası eklenmiştir.
export const BLOCKED_PHONES: string[] = [
  "905383254444",
  "905308443006",
];

/** Numarayı 90XXXXXXXXXX biçimine indirger. */
export function normalizePhoneForBlock(raw: unknown): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "90" + d.slice(1);
  else if (!d.startsWith("90")) d = "90" + d;
  return d;
}

/** Numara kara listede mi? */
export function isBlockedPhone(raw: unknown): boolean {
  const n = normalizePhoneForBlock(raw);
  if (!n) return false;
  const last10 = n.slice(-10);
  return BLOCKED_PHONES.some((b) => b.slice(-10) === last10);
}

/** Liste halindeki alıcılardan engellileri ayıklar. */
export function filterBlockedPhones<T>(
  items: T[],
  getPhone: (item: T) => unknown,
): { allowed: T[]; blocked: T[] } {
  const allowed: T[] = [];
  const blocked: T[] = [];
  for (const it of items) {
    (isBlockedPhone(getPhone(it)) ? blocked : allowed).push(it);
  }
  return { allowed, blocked };
}
