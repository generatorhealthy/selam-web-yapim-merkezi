// PREPARATION ONLY: not imported by the application or deployed functions.
// A server signature authenticates a recorded declaration, not the physical click.
export type Choices = { disclosureShown: boolean; disclosureRead: boolean; explicitConsent: boolean; marketingConsent: boolean };
export type Receipt = {
  id: string; emailHash: string; documentVersion: string; documentHash: string;
  issuedAt: number; expiresAt: number; choices: Choices;
};
export type ConfirmedAccount = { id: string; email: string; emailConfirmed: boolean; provider: "email" | "google" | "apple" };
export async function digest(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
}
export function validateChoices(value: unknown): Choices | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const keys = ["disclosureShown", "disclosureRead", "explicitConsent", "marketingConsent"];
  if (Object.keys(v).length !== keys.length || keys.some(k => typeof v[k] !== "boolean")) return null;
  if (v.disclosureShown !== true || v.disclosureRead !== true) return null;
  return v as Choices;
}
export function bindingDecision(receipt: Receipt, account: ConfirmedAccount | null, emailHash: string, now: number): string {
  if (!account?.id || !account.emailConfirmed) return "verified_session_required";
  if (account.provider !== "email") return "oauth_reaffirmation_required";
  if (receipt.emailHash !== emailHash) return "account_mismatch";
  if (now >= receipt.expiresAt || now < receipt.issuedAt) return "expired";
  if (!validateChoices(receipt.choices)) return "invalid_choices";
  return "ok";
}
export function rowsFor(receipt: Receipt, userId: string) {
  if (!validateChoices(receipt.choices)) throw new Error("invalid_choices");
  return [
    { userId, purpose: "disclosure", action: "disclosure_shown", accepted: true },
    { userId, purpose: "explicit_consent", action: receipt.choices.explicitConsent ? "grant" : "decline", accepted: receipt.choices.explicitConsent },
    { userId, purpose: "marketing_etk", action: receipt.choices.marketingConsent ? "grant" : "decline", accepted: receipt.choices.marketingConsent },
  ].map(row => ({ ...row, receiptId: receipt.id, version: receipt.documentVersion, hash: receipt.documentHash }));
}
async function signingKey(secret: string) {
  if (new TextEncoder().encode(secret).length < 32) throw new Error("weak_signing_key");
  return await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,"0")).join("");
export async function sign(receipt: Receipt, secret: string): Promise<string> {
  return hex(await crypto.subtle.sign("HMAC", await signingKey(secret), new TextEncoder().encode(JSON.stringify(receipt))));
}
export async function verify(receipt: Receipt, signature: string, secret: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(signature)) return false;
  const bytes = new Uint8Array(signature.match(/.{2}/g)?.map(x => parseInt(x,16)) ?? []);
  return await crypto.subtle.verify("HMAC", await signingKey(secret), bytes, new TextEncoder().encode(JSON.stringify(receipt)));
}
export async function operationKey(account: string, transaction: string, purpose: string, action: "grant" | "decline" | "withdraw" | "disclosure_shown") {
  return await digest(JSON.stringify([account,transaction,purpose,action]));
}