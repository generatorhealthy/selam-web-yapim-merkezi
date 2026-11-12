// WAHA webhook kaynağı doğrulaması — kontrollü geçiş için iki kip.
//  - İzleme kipi (WAHA_WEBHOOK_ENFORCE != "true"): anahtarsız istek GEÇER ama
//    "unsigned" olarak kaydedilir; YANLIŞ anahtar her zaman reddedilir.
//  - Zorunlu kip (WAHA_WEBHOOK_ENFORCE == "true"): anahtarsız/yanlış istek reddedilir.
// Sır tanımlı değilse zorunlu kipte de istek reddedilir (fail-closed).
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
  enforce: boolean,
): HookAuth {
  const hasSecret = !!secret && secret.trim() !== "";
  if (!provided) {
    if (enforce) return { allow: false, status: hasSecret ? 401 : 500, state: hasSecret ? "rejected" : "misconfigured" };
    return { allow: true, state: "unsigned" };
  }
  if (!hasSecret) {
    return enforce ? { allow: false, status: 500, state: "misconfigured" } : { allow: true, state: "unsigned" };
  }
  const r = requireSharedSecret(provided, secret);
  return r.ok ? { allow: true, state: "signed" } : { allow: false, status: 401, state: "rejected" };
}

export function hookAuthFromEnv(req: Request): HookAuth {
  const secret = Deno.env.get("WAHA_WEBHOOK_SECRET");
  const enforce = (Deno.env.get("WAHA_WEBHOOK_ENFORCE") || "").toLowerCase() === "true";
  return decideHookAuth(readHookToken(req.headers), secret, enforce);
}
