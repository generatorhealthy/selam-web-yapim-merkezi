import { createClient } from "npm:@supabase/supabase-js@2";
import { statusFromDigit } from "../_shared/leadIvr.ts";

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const ok = () => new Response("ok", { status: 200 });

Deno.serve(async (req) => {
  if (req.method !== "POST") return ok();
  const url = new URL(req.url);
  const c = url.searchParams.get("c") || "";
  const t = url.searchParams.get("t") || "";
  if (!/^[0-9a-f-]{36}$/.test(c) || t.length < 40) return new Response("forbidden", { status: 403 });

  const raw = await req.text();
  if (!raw.trim()) return ok(); // Verimor URL doğrulaması

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: camp } = await svc.from("lead_ivr_campaigns").select("id, webhook_token_hash").eq("id", c).maybeSingle();
  if (!camp || camp.webhook_token_hash !== (await sha256(t))) return new Response("forbidden", { status: 403 });

  let p: URLSearchParams;
  try { p = raw.trim().startsWith("{") ? new URLSearchParams(JSON.parse(raw)) : new URLSearchParams(raw); }
  catch { return ok(); }
  const digits = (p.get("phone") || "").replace(/\D/g, "");
  const phone = digits.startsWith("90") ? digits : digits.startsWith("0") ? "9" + digits : "90" + digits;
  const digit = (p.get("digit") || "").slice(0, 4);
  const status = (p.get("status") || "").slice(0, 60);

  const { data: call } = await svc.from("lead_ivr_calls").select("id, lead_id, digit")
    .eq("campaign_id", c).eq("phone", phone).maybeSingle();
  if (!call) return ok();
  // Bir kez geçerli tuş geldiyse sonraki bildirimler onu ezmez.
  if (call.digit === "1" || call.digit === "2") return ok();

  await svc.from("lead_ivr_calls").update({ digit, call_status: status, notified_at: new Date().toISOString() }).eq("id", call.id);
  const next = statusFromDigit(digit);
  if (next) {
    await svc.from("danisan_basvurulari").update({ status: next }).eq("id", call.lead_id).eq("status", "no_answer");
  }
  return ok();
});
