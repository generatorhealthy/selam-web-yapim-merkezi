// New legal documents remain unavailable until separately approved and published.
export const PURPOSES = ["health_test", "health_appointment", "marketing_etk", "ads_analytics", "analytics", "advertising"] as const;
export type Purpose = typeof PURPOSES[number];
export type Action = "grant" | "withdraw" | "disclosure_shown";
export type ConsentInput = { transaction_id: string; purpose: Purpose; action: Action; transaction_token?: string };

// Published documents are pinned by their SHA-256 hash (see src/content/legal SHA256SUMS),
// so consent evidence references exact document bytes without embedding the full text here.
export const DOCUMENTS: Record<string, { published: boolean; version: string; hash: string }> = {
  // /aydinlatma-metni v9 — published 2026-11-12T21:07:08Z (informational release).
  disclosure: {
    published: true,
    version: "2026-11-12-v9",
    hash: "00cf77757d5da1d61407c8c775a7ed7c3576966c0901bed1e023f35f27001fc9",
  },
  explicit_consent: { published: false, version: "2026-11-12-taslak", hash: "" },
};

// Cookie-banner purposes are evidenced against the published disclosure text.
export function documentFor(input: ConsentInput): { published: boolean; version: string; hash: string } | undefined {
  if (input.action === "disclosure_shown") return DOCUMENTS.disclosure;
  if (input.purpose === "analytics" || input.purpose === "advertising") return DOCUMENTS.disclosure;
  return DOCUMENTS.explicit_consent;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Server-issued anonymous tokens are 64 hex chars (32 random bytes); only their SHA-256 is stored.
const TOKEN_RE = /^[0-9a-f]{64}$/;

export function parseInput(value: unknown): ConsentInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !["transaction_id", "purpose", "action", "transaction_token"].includes(k))) return null;
  if (typeof v.transaction_id !== "string" || !UUID_RE.test(v.transaction_id)) return null;
  if (!PURPOSES.includes(v.purpose as Purpose)) return null;
  if (!["grant", "withdraw", "disclosure_shown"].includes(String(v.action))) return null;
  const out: ConsentInput = {
    transaction_id: v.transaction_id.toLowerCase(),
    purpose: v.purpose as Purpose,
    action: v.action as Action,
  };
  if (v.transaction_token !== undefined) {
    if (typeof v.transaction_token !== "string" || !TOKEN_RE.test(v.transaction_token)) return null;
    out.transaction_token = v.transaction_token;
  }
  return out;
}

export async function sha256(text: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

// Same operation for the same subject has the same primary key.
// INSERT, not upsert: concurrent requests never mutate the existing evidence.
export async function eventId(subject: string, input: ConsentInput): Promise<string> {
  const h = await sha256(JSON.stringify(["consent-v1", subject, input.transaction_id, input.purpose, input.action]));
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;
}

export function authenticatedSubject(user: { id?: string; role?: string } | null): string | null {
  return user?.id && user.role === "authenticated" ? user.id : null;
}
