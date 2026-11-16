import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paytrHttpPort, startPaytrCheckout } from "../_shared/paytrCheckout.ts";
import { paytrDbPort } from "../_shared/paytrDb.ts";
import { cardPaymentsAllowedFor } from "../_shared/cardPaymentPackages.ts";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const SITE = "https://doktorumol.com.tr";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "method" }, { status: 405, headers });
  const merchantId = Deno.env.get("PAYTR_MERCHANT_ID"), key = Deno.env.get("PAYTR_MERCHANT_KEY"), salt = Deno.env.get("PAYTR_MERCHANT_SALT");
  if (!merchantId || !key || !salt) return Response.json({ status: "failure", errorCode: "card_unavailable", errorMessage: "Kart ödemesi şu an kullanılamıyor." }, { status: 503, headers });
  let body: any = {};
  try { body = await req.json(); } catch { return Response.json({ status: "failure", errorCode: "bad_request" }, { status: 400, headers }); }
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const db = paytrDbPort(admin);
    const order = typeof body.orderId === "string" ? await db.readOrder(body.orderId).catch(() => null) : null;
    const pkg = order?.package_type ?? "ozel-firsat";
    // Kart bu pakette henüz hazır değil: sunucu da yalnız izinli paketler için ödeme başlatır.
    if (!cardPaymentsAllowedFor(pkg)) {
      return Response.json({ status: "failure", errorCode: "card_unavailable", errorMessage: "Bu pakette kartla ödeme şu an kullanılamıyor; lütfen banka havalesi ile devam edin." }, { status: 409, headers });
    }
    const orderData = order ? { id: order.id, orderNumber: `DRP-${order.id.slice(0, 8).toUpperCase()}`, package: order.package_name ?? "",
      amount: Number(order.amount), paymentMethod: "credit_card", customerName: order.customer_name ?? "" } : null;
    const userIp = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const r = await startPaytrCheckout({ orderId: body.orderId, customerData: body.customerData, userIp }, {
      db, paytr: paytrHttpPort(), creds: { merchantId, key, salt },
      okUrl: `${SITE}/odeme-basarili${orderData ? `?orderData=${encodeURIComponent(JSON.stringify(orderData))}` : ""}`,
      failUrl: `${SITE}/odeme/${pkg}?odeme=basarisiz`,
    });
    console.log("paytr start:", r.status, r.body.errorCode ?? "ok");
    return Response.json(r.body, { status: r.status, headers });
  } catch (e) {
    console.error("paytr start error:", (e as Error).message?.slice(0, 120));
    return Response.json({ status: "failure", errorCode: "server_error", errorMessage: "Ödeme başlatılamadı" }, { status: 500, headers });
  }
});
