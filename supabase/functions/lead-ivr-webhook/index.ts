import { createClient } from "npm:@supabase/supabase-js@2";
import { callToken, statusFromDigit, BULK_IVR_STATUSES } from "../_shared/leadIvr.ts";

// Santral (FreePBX) danışanın tuşlamasını buraya GET ile bildirir:
// ?t=<çağrıya özel imza>&call=<çağrı id>&digit=1|2|none
const ok = () => new Response("ok", { status: 200 });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const call = url.searchParams.get("call") || "";
  const t = url.searchParams.get("t") || "";
  const digit = (url.searchParams.get("digit") || "").slice(0, 4);
  if (!/^[0-9a-f-]{36}$/.test(call) || !/^[0-9a-f]{64}$/.test(t)) return new Response("forbidden", { status: 403 });
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const base = Deno.env.get("SUPABASE_URL");
  if (!key || !base) return new Response("unavailable", { status: 503 });
  if ((await callToken(call, key)) !== t) return new Response("forbidden", { status: 403 });

  const svc = createClient(base, key);
  const { data: row } = await svc.from("lead_ivr_calls").select("id, lead_id, digit").eq("id", call).maybeSingle();
  if (!row) return ok();
  if (row.digit === "1" || row.digit === "2") return ok(); // ilk geçerli tuş korunur

  await svc.from("lead_ivr_calls").update({
    digit, state: "done", call_status: digit === "none" ? "no_digit" : "answered", notified_at: new Date().toISOString(),
  }).eq("id", row.id);
  const next = statusFromDigit(digit);
  if (next && row.lead_id) {
    await svc.from("danisan_basvurulari").update({ status: next }).eq("id", row.lead_id).in("status", [...BULK_IVR_STATUSES]);
  }
  return ok();
});
