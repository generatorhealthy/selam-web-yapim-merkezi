import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { safeLog } from "../_shared/safeLog.ts";
import { iyzicoHttpPort, legacyPlanForType, startCheckout } from "../_shared/iyzicoCheckout.ts";
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

    // Geçiş dönemi: eski önbellekli sayfa orderId göndermiyor. Ödeme alınabilir, ancak bu ödemeye
    // sunucu oturumu bağlanmadığı için otomatik onay/aktivasyon YAPILMAZ (personel doğrular).
    // Plan yalnız paket tipinden; istemci tutarı artık plan seçmez.
    const c = body?.customerData || {};
    safeLog("checkout start legacy (unbound)", { packageType: body?.packageType ?? null });
    const result = await iyzico.initialize({
      locale: "tr", callbackUrl: CALLBACK_URL, pricingPlanReferenceCode: legacyPlanForType(body?.packageType),
      subscriptionInitialStatus: "ACTIVE",
      customer: { name: c.name || "Kullanici", surname: c.surname || "Adi", email: c.email || "",
        gsmNumber: (() => { let d = String(c.gsmNumber ?? "").replace(/\D/g, ""); if (d.startsWith("90")) d = d.slice(2); if (d.startsWith("0")) d = d.slice(1); return d.length === 10 ? `+90${d}` : "+905000000000"; })(),
        identityNumber: String(c.identityNumber ?? "").replace(/\D/g, "").length === 11 ? String(c.identityNumber).replace(/\D/g, "") : "11111111111",
        billingAddress: { address: (c.billingAddress || c.registrationAddress || "").length >= 5 ? (c.billingAddress || c.registrationAddress) : "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
          zipCode: c.billingZipCode || "34100", contactName: `${c.name || "Kullanici"} ${c.surname || "Adi"}`, city: c.billingCity || c.city || "Istanbul", country: "Turkey" } },
    });
    if (!result) return json({ error: "Iyzico yanıt formatı hatası" }, 500);
    if (body?.layout === "popup" && result?.data?.checkoutPageUrl) result.popup = true;
    return json(result);
  } catch (err) {
    console.error("create-iyzico-payment error:", err instanceof Error ? err.message : String(err));
    return json({ error: "Sunucu hatası" }, 500);
  }
});
