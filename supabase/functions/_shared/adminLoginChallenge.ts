export type LoginChallenge = { nonce: string; issuedAt: number; notBefore: number; expiresAt: number; difficulty: number; failures: number };
const enc = new TextEncoder();
export const loginDifficulty = (failures: number) => Math.min(22, 18 + Math.floor(failures / 2));
export const loginDelay = (failures: number) => failures === 0 ? 0 : Math.min(30, 2 ** Math.min(failures, 5));
export async function digest(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value)))].map(v => v.toString(16).padStart(2, '0')).join('');
}
async function key(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signChallenge(secret: string, failures = 0, now = Date.now()) {
  const challenge: LoginChallenge = { nonce: crypto.randomUUID(), issuedAt: now, notBefore: now + loginDelay(failures) * 1000, expiresAt: now + 300_000, difficulty: loginDifficulty(failures), failures };
  const payload = btoa(JSON.stringify(challenge));
  const signature = [...new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(payload)))].map(v => v.toString(16).padStart(2, '0')).join('');
  return { token: `${payload}.${signature}`, challenge };
}
export async function verifyChallenge(secret: string, token: string, solution: number, now = Date.now()) {
  try {
    if (token.length > 1500 || !Number.isSafeInteger(solution) || solution < 0) return null;
    const parts = token.split('.');
    if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return null;
    const signature = Uint8Array.from(parts[1].match(/../g) ?? [], v => parseInt(v, 16));
    if (!await crypto.subtle.verify('HMAC', await key(secret), signature, enc.encode(parts[0]))) return null;
    const c: LoginChallenge = JSON.parse(atob(parts[0]));
    if (!Number.isInteger(c.failures) || c.failures < 0 || c.failures > 100 || c.difficulty !== loginDifficulty(c.failures) || typeof c.nonce !== 'string' || !/^[a-f0-9-]{36}$/.test(c.nonce) || c.issuedAt > now || c.notBefore > now || c.expiresAt <= now || c.expiresAt !== c.issuedAt + 300_000 || c.notBefore !== c.issuedAt + loginDelay(c.failures) * 1000) return null;
    const hash = await digest(`${token}:${solution}`);
    const full = Math.floor(c.difficulty / 4), rest = c.difficulty % 4;
    if (!hash.startsWith('0'.repeat(full)) || (rest && parseInt(hash[full], 16) >= 2 ** (4 - rest))) return null;
    return c;
  } catch { return null; }
}