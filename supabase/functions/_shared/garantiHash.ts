// Garanti BBVA Ortak Ödeme hash rules (dev.garantibbva.com.tr/sanal-pos-ortak-odeme-tekrarli).
const enc = (s: string) => new TextEncoder().encode(s); // ASCII-only inputs; ISO-8859-9 identical for these
async function hex(alg: "SHA-1" | "SHA-512", s: string) {
  const b = new Uint8Array(await crypto.subtle.digest(alg, enc(s)));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
export const pad9 = (terminalId: string) => terminalId.padStart(9, "0");
export const hashedPassword = (password: string, terminalId: string) => hex("SHA-1", password + pad9(terminalId));
export async function requestHash(p: { terminalId: string; orderId: string; amount: string; currency: string; successUrl: string; errorUrl: string; type: string; installment: string; storeKey: string; password: string }) {
  const hp = await hashedPassword(p.password, p.terminalId);
  return hex("SHA-512", p.terminalId + p.orderId + p.amount + p.currency + p.successUrl + p.errorUrl + p.type + p.installment + p.storeKey + hp);
}
/** Response hash: concat values named in hashparams (":"-separated) + storeKey, SHA512 upper. */
export async function verifyResponseHash(form: Record<string, string>, storeKey: string) {
  const params = form["hashparams"];
  if (!params || !form["hash"]) return false;
  const digest = params.split(":").filter(Boolean).map((k) => form[k] ?? "").join("") + storeKey;
  return (await hex("SHA-512", digest)) === form["hash"].toUpperCase();
}
export const toKurus = (tl: number) => String(Math.round(tl * 100));
