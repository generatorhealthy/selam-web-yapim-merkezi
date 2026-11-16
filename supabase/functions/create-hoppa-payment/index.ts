import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hoppaHttpPort, startHoppaCheckout } from "../_shared/hoppaCheckout.ts";
import { hoppaDbPort } from "../_shared/hoppaDb.ts";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "method" }, { status: 405, headers });
  const merchant = Deno.env.get("HOPPA_MERCHANT"), key = Deno.env.get("HOPPA_MERCHANT_KEY");
  if (!merchant || !key) return Response.json({ status: "failure", errorCode: "card_unavailable", errorMessage: "Kart ödemesi şu an kullanılamıyor." }, { status: 503, headers });
  let body: any = {};
  try { body = await req.json(); } catch { return Response.json({ status: "failure", errorCode: "bad_request" }, { status: 400, headers }); }
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const r = await startHoppaCheckout({ orderId: body.orderId, customerData: body.customerData }, {
      db: hoppaDbPort(admin), hoppa: hoppaHttpPort(merchant, key, Deno.env.get("HOPPA_BASE_URL") || "https://posservice.esnekpos.com"),
      backUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/hoppa-payment-callback`,
    });
    console.log("hoppa start:", r.status, r.body.errorCode ?? "ok");
    return Response.json(r.body, { status: r.status, headers });
  } catch (e) {
    console.error("hoppa start error:", (e as Error).message?.slice(0, 120));
    return Response.json({ status: "failure", errorCode: "server_error", errorMessage: "Ödeme başlatılamadı" }, { status: 500, headers });
  }
});
