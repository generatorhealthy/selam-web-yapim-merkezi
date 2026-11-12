// New legal documents remain unavailable until separately approved and published.
export const PURPOSES = ["health_test", "health_appointment", "marketing_etk", "ads_analytics"] as const;
export type Purpose = typeof PURPOSES[number];
export type Action = "grant" | "withdraw" | "disclosure_shown";
export type ConsentInput = { transaction_id: string; purpose: Purpose; action: Action };
export const DOCUMENTS: Record<string, { published: boolean; version: string; text: string }> = {
  disclosure: { published: false, version: "2026-11-12-taslak", text: "" },
  explicit_consent: { published: false, version: "2026-11-12-taslak", text: "" },
};

export function parseInput(value: unknown): ConsentInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !["transaction_id", "purpose", "action"].includes(k))) return null;
  if (typeof v.transaction_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.transaction_id)) return null;
  if (!PURPOSES.includes(v.purpose as Purpose)) return null;
  if (!["grant", "withdraw", "disclosure_shown"].includes(String(v.action))) return null;
  return { transaction_id: v.transaction_id.toLowerCase(), purpose: v.purpose as Purpose, action: v.action as Action };
}

export async function sha256(text: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

// Same operation for the same authenticated account has the same primary key.
// INSERT, not upsert: concurrent requests never mutate the existing evidence.
export async function eventId(userId: string, input: ConsentInput): Promise<string> {
  const h = await sha256(JSON.stringify(["consent-v1", userId, input.transaction_id, input.purpose, input.action]));
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;
}

export function authenticatedSubject(user: { id?: string; role?: string } | null): string | null {
  return user?.id && user.role === "authenticated" ? user.id : null;
}