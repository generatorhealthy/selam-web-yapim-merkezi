export function verifiedContactPhone(user: { phone?: string; phone_confirmed_at?: string } | null): string | null {
  if (!user?.phone_confirmed_at || !user.phone) return null;
  const digits = user.phone.replace(/\D/g, '');
  return /^905\d{9}$/.test(digits) ? digits : null;
}
export function contactSlug(value: unknown): string | null {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 150 ? value : null;
}
export function contactMessage(name: string, slug: string, specialtySlug: string): string {
  return `Doktorumol: ${name.replace(/[\r\n]/g, ' ').slice(0, 150)} randevu profili: https://doktorumol.com.tr/${specialtySlug}/${slug}`;
}