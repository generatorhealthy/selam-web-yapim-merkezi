// Offline acceptance candidate; never imported by the app or deployed handlers.
export async function verifyWahaHmac(raw: Uint8Array, headers: Headers, secret: string | undefined): Promise<boolean> {
  if (!secret || headers.get('x-webhook-hmac-algorithm') !== 'sha512') return false;
  const signature = headers.get('x-webhook-hmac');
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const bytes = Uint8Array.from(signature.match(/../g) ?? [], part => parseInt(part, 16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, bytes, raw);
}

export function verifyScheduledCaller(headers: Headers, secret: string | undefined): boolean {
  const provided = headers.get('x-cron-secret');
  if (!secret || !provided) return false;
  const a = new TextEncoder().encode(secret), b = new TextEncoder().encode(provided);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}