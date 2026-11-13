import { sha256 } from '@noble/hashes/sha256';

type Challenge = { token: string; challenge: { difficulty: number; notBefore: number; expiresAt: number } };
export async function solveLoginChallenge(ticket: Challenge): Promise<number> {
  const { difficulty, notBefore, expiresAt } = ticket.challenge;
  if (!Number.isInteger(difficulty) || difficulty < 18 || difficulty > 22 || expiresAt <= Date.now()) throw new Error('Giriş doğrulanamadı.');
  const wait = Math.max(0, notBefore - Date.now());
  if (wait > 31_000) throw new Error('Giriş doğrulanamadı.');
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  const encoder = new TextEncoder();
  for (let solution = 0; Date.now() < expiresAt; solution++) {
    const hash = sha256(encoder.encode(`${ticket.token}:${solution}`));
    let bits = difficulty, valid = true;
    for (const byte of hash) {
      if (bits <= 0) break;
      const count = Math.min(bits, 8);
      if (byte >>> (8 - count) !== 0) { valid = false; break; }
      bits -= count;
    }
    if (valid) return solution;
    if (solution % 4096 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  throw new Error('Giriş doğrulamasının süresi doldu. Tekrar deneyin.');
}