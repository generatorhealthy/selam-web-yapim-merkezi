/** A public JWT is transport only. Authority is a DB-issued, appointment-bound token. */
export async function appointmentAuthority(
  appointmentId: string,
  token: unknown,
  verify: (id: string, hash: string) => Promise<boolean>,
): Promise<boolean> {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return verify(appointmentId, hash);
}