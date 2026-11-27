// RFC 6238 TOTP (SHA-1, 6 digits, 30 s) for the Divan panel gate.
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const enc = new TextEncoder();

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Uint8Array<ArrayBuffer> {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0; const out: number[] = [];
  for (const c of clean) {
    value = (value << 5) | B32.indexOf(c); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out) as Uint8Array<ArrayBuffer>;
}

export function newSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
}

export async function hotp(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) { msg[i] = c & 255; c = Math.floor(c / 256); }
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

// Accepts the current 30 s step and one step either side (clock drift).
export async function verifyTotp(secret: string, code: string, now = Date.now()): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const step = Math.floor(now / 30_000);
  for (const d of [-1, 0, 1]) if (await hotp(secret, step + d) === code) return true;
  return false;
}

export async function sha256Hex(v: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(v)))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode("panel-gate:" + secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

// Short-lived proof that the gate code was entered, carried into the login call.
export async function signGateTicket(secret: string, now = Date.now()): Promise<string> {
  const payload = btoa(JSON.stringify({ exp: now + 10 * 60_000, n: crypto.randomUUID() }));
  return `${payload}.${hex(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload)))}`;
}
export async function verifyGateTicket(secret: string, ticket: string, now = Date.now()): Promise<boolean> {
  try {
    const [p, s] = ticket.split(".");
    if (!p || !/^[a-f0-9]{64}$/.test(s ?? "")) return false;
    const sig = Uint8Array.from(s.match(/../g)!, (v) => parseInt(v, 16));
    if (!await crypto.subtle.verify("HMAC", await hmacKey(secret), sig, enc.encode(p))) return false;
    return JSON.parse(atob(p)).exp > now;
  } catch { return false; }
}

export function jwtSessionId(accessToken: string): string | null {
  try {
    const part = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const sid = JSON.parse(atob(part + "=".repeat((4 - part.length % 4) % 4))).session_id;
    return typeof sid === "string" && /^[0-9a-f-]{36}$/i.test(sid) ? sid : null;
  } catch { return null; }
}

export const GATE_SESSION_HOURS = 16;
export const GATED_ROLES = ["admin", "staff", "legal", "muhasebe", "partner"];

// deno-lint-ignore no-explicit-any
export async function panelGateOk(svc: any, userId: string, role: string | undefined, accessToken: string): Promise<boolean> {
  if (!role || !GATED_ROLES.includes(role)) return true;
  const { data: cfg } = await svc.from("panel_gate_config").select("enabled").eq("id", 1).maybeSingle();
  if (!cfg?.enabled) return true;
  const sid = jwtSessionId(accessToken);
  if (!sid) return false;
  const { data } = await svc.from("panel_gate_sessions").select("expires_at").eq("session_id", sid).eq("user_id", userId).maybeSingle();
  return !!data && new Date(data.expires_at).getTime() > Date.now();
}
