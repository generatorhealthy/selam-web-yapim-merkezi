import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { safeLog } from "../_shared/safeLog.ts";
import { iyzicoHttpPort, startCheckout } from "../_shared/iyzicoCheckout.ts";
import { supabaseDbPort } from "../_shared/iyzicoDb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const CALLBACK_URL = "https://irnfwewabogveofwemvg.supabase.co/functions/v1/iyzico-payment-callback";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    // Eski açık/önbellekli sayfalar sağlayıcıya ulaşmadan durur; tahsilat başlatılmaz.
    if (!body?.orderId) return json({ status: "failure", errorCode: "order_required",
      errorMessage: "Ödeme sayfasını yenileyip siparişinizi yeniden doğrulayın. Ödeme başlatılmadı." }, 400);
    const apiKey = Deno.env.get("IYZICO_API_KEY"), secretKey = Deno.env.get("IYZICO_SECRET_KEY");
    if (!apiKey || !secretKey) return json({ status: "failure", errorCode: "provider_not_configured" }, 503);
    const iyzico = iyzicoHttpPort(apiKey, secretKey, Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com");

    if (body?.orderId) {
      // Güvenli yol: sipariş, paket, tutar ve para birimi sunucudaki sipariş kaydından;
      // token + conversationId bu siparişin tek ödeme oturumuna bağlanır.
      const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      const r = await startCheckout({ orderId: body.orderId, customerData: body.customerData, layout: body.layout },
        { db: supabaseDbPort(admin), iyzico, callbackUrl: CALLBACK_URL });
      safeLog("checkout start", { status: r.status, result: r.body.status, code: r.body.errorCode ?? null });
      return json(r.body, r.status);
    }

    return json({ status: "failure", errorCode: "order_required" }, 400);
  } catch (err) {
    console.error("create-iyzico-payment error:", err instanceof Error ? err.message : String(err));
    return json({ error: "Sunucu hatası" }, 500);
  }
});
