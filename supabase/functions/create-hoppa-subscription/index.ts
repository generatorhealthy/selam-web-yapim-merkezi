import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recurringHttpPort, startHoppaSubscription } from "../_shared/hoppaRecurring.ts";
import { hoppaDbPort } from "../_shared/hoppaDb.ts";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "method" }, { status: 405, headers });
  const merchant = Deno.env.get("HOPPA_MERCHANT"), key = Deno.env.get("HOPPA_MERCHANT_KEY");
  if (!merchant || !key) return Response.json({ status: "failure", errorCode: "card_unavailable" }, { status: 503, headers });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ status: "failure", errorCode: "bad_request" }, { status: 400, headers }); }
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const r = await startHoppaSubscription({ orderId: body?.orderId, customerData: body?.customerData, card: body?.card, clientIp: ip }, {
      db: hoppaDbPort(admin), rec: recurringHttpPort(merchant, key, Deno.env.get("HOPPA_BASE_URL") || "https://posservice.esnekpos.com"),
      backUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/hoppa-recurring-callback`,
    });
    body = null; // kart bilgisi bellekte tutulmaz
    console.log("hoppa subscription start:", r.status, r.body.errorCode ?? r.body.state ?? "ok");
    return Response.json(r.body, { status: r.status, headers });
  } catch (e) {
    body = null;
    console.error("hoppa subscription error:", String((e as Error).message || "").slice(0, 80));
    return Response.json({ status: "failure", errorCode: "server_error", errorMessage: "Abonelik başlatılamadı" }, { status: 500, headers });
  }
});
