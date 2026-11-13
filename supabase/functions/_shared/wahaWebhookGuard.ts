// WAHA webhook kaynağı doğrulaması — her zaman zorunlu (fail-closed).
// Anahtarsız, yanlış anahtarlı veya sır tanımsız istekler reddedilir.
import { requireSharedSecret } from "./secretGate.ts";

export type HookAuth =
  | { allow: true; state: "signed" | "unsigned" }
  | { allow: false; status: number; state: "rejected" | "misconfigured" };

export function readHookToken(h: Headers): string | null {
  const v = h.get("x-waha-token") || h.get("x-bot-secret") ||
    (h.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return v && v.trim() !== "" ? v.trim() : null;
}

export function decideHookAuth(
  provided: string | null,
  secret: string | null | undefined,
  _enforce: boolean,
): HookAuth {
  // Fail-closed: unsigned or unverifiable webhook calls never reach storage or outbound sends.
  const hasSecret = !!secret && secret.trim() !== "";
  if (!hasSecret) return { allow: false, status: 500, state: "misconfigured" };
  if (!provided) return { allow: false, status: 401, state: "rejected" };
  const r = requireSharedSecret(provided, secret);
  return r.ok ? { allow: true, state: "signed" } : { allow: false, status: 401, state: "rejected" };
}

export function hookAuthFromEnv(req: Request): HookAuth {
  const secret = Deno.env.get("WAHA_WEBHOOK_SECRET");
  const enforce = (Deno.env.get("WAHA_WEBHOOK_ENFORCE") || "").toLowerCase() === "true";
  return decideHookAuth(readHookToken(req.headers), secret, enforce);
}
