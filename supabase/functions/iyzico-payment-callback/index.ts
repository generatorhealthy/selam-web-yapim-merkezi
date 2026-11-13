import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { iyzicoAuthHeader, iyzicoHttpPort, settleByToken, settleSubscriptionCharge, verifyWebhookSignature } from "../_shared/iyzicoCheckout.ts";
import { supabaseDbPort } from "../_shared/iyzicoDb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-iyz-signature-v3",
};
const SITE = "https://doktorumol.com.tr";
const redirect = (to: string) => new Response(null, { status: 302, headers: { ...corsHeaders, Location: to } });
const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const REF = /^[A-Za-z0-9-]{8,64}$/;

async function customerEmail(apiKey: string, secretKey: string, baseUrl: string, ref: string): Promise<string | null> {
  if (!REF.test(ref)) return null;
  const path = `/v2/subscription/customers/${ref}`;
  const { authorization, randomKey } = await iyzicoAuthHeader(apiKey, secretKey, path);
  try {
    const r = await (await fetch(`${baseUrl}${path}`, { headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: authorization, "x-iyzi-rnd": randomKey } })).json();
    return r?.status === "success" && r.data?.email ? String(r.data.email).toLowerCase().trim() : null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const isWebhookLike = (b: any) => typeof b?.iyziEventType === "string";
  let body: any = {};
  try {
    const raw = await req.text();
    if (raw) { try { body = JSON.parse(raw); } catch { body = Object.fromEntries(new URLSearchParams(raw).entries()); } }
    body = { ...body, ...Object.fromEntries(new URL(req.url).searchParams.entries()) };

    const apiKey = Deno.env.get("IYZICO_API_KEY"), secretKey = Deno.env.get("IYZICO_SECRET_KEY");
    const baseUrl = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";
    if (!apiKey || !secretKey) return isWebhookLike(body) ? json({ status: "rejected" }) : redirect(`${SITE}/`);
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const db = supabaseDbPort(admin);
    const iyzico = iyzicoHttpPort(apiKey, secretKey, baseUrl);

    // 1) Checkout Form dönüşü: tarayıcının "başarılı" beyanı yok sayılır; yalnız kayıtlı token ile
    //    iyzico Checkout Form Retrieve + abonelik tahsilatı doğrulanır ve tek DB işleminde onaylanır.
    if (body.token && !isWebhookLike(body)) {
      const r = await settleByToken(body.token, "checkout_callback", { db, iyzico });
      console.log("checkout callback:", r.outcome, r.reason ?? "");
      if ((r.outcome === "applied" || r.outcome === "duplicate" || r.outcome === "pending") && r.orderId) {
        const o = await db.readOrder(r.orderId);
        const orderData = { id: r.orderId, orderNumber: `DRP-${r.orderId.slice(0, 8).toUpperCase()}`,
          package: o?.package_name ?? "", amount: Number(o?.amount ?? 0), paymentMethod: "credit_card", customerName: o?.customer_name ?? "" };
        return redirect(`${SITE}/odeme-basarili?orderData=${encodeURIComponent(JSON.stringify(orderData))}`);
      }
      return redirect(`${SITE}/`);
    }

    const eventType = String(body.iyziEventType || "").toLowerCase();
    const isSuccess = ["subscription_order_success", "subscription.order.success"].includes(eventType)
      || body.status === "success" || body.status === "SUCCESS" || body.paymentStatus === "SUCCESS" || body.orderStatus === "SUCCESS";
    const isFailed = ["subscription_order_failure", "subscription.order.failure"].includes(eventType)
      || body.paymentStatus === "FAILED" || body.orderStatus === "FAILED";

    // Webhook imzası: merchantId tanımlıysa X-IYZ-SIGNATURE-V3 zorunlu.
    const merchantId = Deno.env.get("IYZICO_MERCHANT_ID");
    if (merchantId && isWebhookLike(body)) {
      const sig = req.headers.get("x-iyz-signature-v3") || "";
      if (!sig || !(await verifyWebhookSignature(secretKey, merchantId, body, sig))) return json({ status: "rejected", reason: "signature" });
    }

    if (isSuccess) {
      // 2) Abonelik olayı: gövde yalnız abonelik kodunu söyler; tahsilat, tutar ve müşteri iyzico'dan okunur
      //    ve yalnız bu aboneliğe sunucuda bağlı siparişe uygulanır (e-posta tek başına yetmez).
      const ref = String(body.subscriptionReferenceCode || body.subscription_reference_code || "");
      let outcome = "rejected";
      if (REF.test(ref)) {
        const raw = await iyzico.subscription(ref);
        const sub = Array.isArray(raw?.data?.items) ? raw.data.items[0] : raw?.data;
        const claimed = body.customerReferenceCode ? String(body.customerReferenceCode) : null;
        if (sub && (!claimed || claimed === String(sub.customerReferenceCode))) {
          const email = await customerEmail(apiKey, secretKey, baseUrl, String(sub.customerReferenceCode || ""));
          const r = await settleSubscriptionCharge(raw, ref, "subscription_event", { db }, email);
          outcome = r.outcome; console.log("subscription event:", r.outcome, r.reason ?? "");
        }
      }
      return isWebhookLike(body) ? json({ status: outcome }) : redirect(`${SITE}/`);
    }

    if (isFailed) {
      // Başarısız tahsilat: yalnız payment_status işaretlenir (onay yok). E-posta iyzico'dan çözülür.
      const email = body.customerReferenceCode ? await customerEmail(apiKey, secretKey, baseUrl, String(body.customerReferenceCode)) : null;
      if (email) {
        const { data } = await admin.from("orders").select("id").eq("customer_email", email).eq("status", "pending")
          .is("deleted_at", null).gte("created_at", new Date(Date.now() - 48 * 3600_000).toISOString());
        for (const o of data ?? []) await admin.from("orders").update({ payment_status: "failed" }).eq("id", o.id).eq("status", "pending");
      }
    }
    return isWebhookLike(body) ? json({ status: "received" }) : redirect(`${SITE}/`);
  } catch (err) {
    console.error("Callback hatası:", err instanceof Error ? err.message : String(err));
    return isWebhookLike(body) ? json({ status: "error" }) : redirect(`${SITE}/`);
  }
});
