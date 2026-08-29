import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = Deno.env.get("IYZICO_API_KEY")!;
const SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY")!;
const BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

async function iyzicoRequest(method: "GET" | "POST", uriPath: string, body?: unknown) {
  const jsonString = body ? JSON.stringify(body) : "";
  const randomString = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const dataToEncrypt = randomString + uriPath + jsonString;

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToEncrypt));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const authorization = `IYZWSv2 ${btoa(
    `apiKey:${API_KEY}&randomKey:${randomString}&signature:${signatureHex}`,
  )}`;

  const res = await fetch(`${BASE_URL}${uriPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
    },
    body: body ? jsonString : undefined,
  });

  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { status: "failure", raw: text };
  }
  console.log(`iyzico ${method} ${uriPath} =>`, JSON.stringify(parsed).slice(0, 1200));
  return parsed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      subscriptionReferenceCode,
      newPrice,
      orderId,
      planName,
      upgradePeriod = "NOW",
      dryRun = false,
    } = await req.json();

    if (!subscriptionReferenceCode || !newPrice || Number(newPrice) <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "subscriptionReferenceCode ve newPrice zorunlu" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const price = Number(newPrice);

    // 1) Mevcut aboneliğin detayını al (bağlı olduğu plan)
    const subDetail = await iyzicoRequest(
      "GET",
      `/v2/subscription/subscriptions/${subscriptionReferenceCode}`,
    );
    if (subDetail.status !== "success") {
      return new Response(JSON.stringify({ success: false, step: "subscription-detail", iyzico: subDetail }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentPlanRef =
      subDetail.data?.pricingPlanReferenceCode || subDetail.data?.pricingPlan?.referenceCode;
    if (!currentPlanRef) {
      return new Response(JSON.stringify({ success: false, error: "Mevcut plan referansı bulunamadı", iyzico: subDetail }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Mevcut planı oku (ürün referansı + ödeme periyodu)
    const planDetail = await iyzicoRequest("GET", `/v2/subscription/pricing-plans/${currentPlanRef}`);
    if (planDetail.status !== "success") {
      return new Response(JSON.stringify({ success: false, step: "plan-detail", iyzico: planDetail }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productRef = planDetail.data?.productReferenceCode;
    const paymentInterval = planDetail.data?.paymentInterval || "MONTHLY";
    const paymentIntervalCount = planDetail.data?.paymentIntervalCount || 1;
    const currencyCode = planDetail.data?.currencyCode || "TRY";

    if (!productRef) {
      return new Response(JSON.stringify({ success: false, error: "Ürün referansı bulunamadı", iyzico: planDetail }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Aynı fiyatta plan var mı? Yoksa yeni plan oluştur
    const plansList = await iyzicoRequest(
      "GET",
      `/v2/subscription/products/${productRef}?page=1&count=100`,
    );
    const existingPlans: any[] =
      plansList?.data?.pricingPlans?.items || plansList?.data?.pricingPlans || [];
    let targetPlanRef: string | undefined = existingPlans.find(
      (p) =>
        Math.abs(Number(p.price) - price) < 0.01 &&
        p.paymentInterval === paymentInterval &&
        Number(p.paymentIntervalCount || 1) === Number(paymentIntervalCount),
    )?.referenceCode;

    if (dryRun) {
      return new Response(
        JSON.stringify({ success: true, dryRun: true, productRef, currentPlanRef, targetPlanRef, price }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!targetPlanRef) {
      const created = await iyzicoRequest("POST", `/v2/subscription/pricing-plans`, {
        productReferenceCode: productRef,
        name: planName || `TEFE-TUFE Zamli Plan ${price.toFixed(2)} TL`,
        price: price.toFixed(2),
        currencyCode,
        paymentInterval,
        paymentIntervalCount,
        trialPeriodDays: 0,
        planPaymentType: "RECURRING",
      });
      if (created.status !== "success") {
        return new Response(JSON.stringify({ success: false, step: "plan-create", iyzico: created }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetPlanRef = created.data?.referenceCode;
    }

    // 4) Aboneliği yeni plana yükselt (kart bilgisi korunur, müşteri işlem yapmaz)
    const upgraded = await iyzicoRequest(
      "POST",
      `/v2/subscription/subscriptions/${subscriptionReferenceCode}/upgrade`,
      {
        subscriptionReferenceCode,
        newPricingPlanReferenceCode: targetPlanRef,
        upgradePeriod, // NOW | NEXT_PERIOD
        useTrial: false,
        resetRecurrenceCount: false,
      },
    );

    if (upgraded.status !== "success") {
      return new Response(
        JSON.stringify({ success: false, step: "upgrade", newPricingPlanReferenceCode: targetPlanRef, iyzico: upgraded }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5) Veritabanındaki tutarları güncelle
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (orderId) {
      await supabase.from("orders").update({ amount: price }).eq("id", orderId);
    }
    await supabase
      .from("orders")
      .update({ amount: price })
      .eq("subscription_reference_code", subscriptionReferenceCode)
      .eq("status", "pending");
    await supabase
      .from("automatic_orders")
      .update({ amount: price })
      .eq("subscription_reference_code", subscriptionReferenceCode);

    return new Response(
      JSON.stringify({
        success: true,
        newPricingPlanReferenceCode: targetPlanRef,
        price,
        upgradePeriod,
        iyzico: upgraded.data ?? upgraded,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("iyzico-subscription-upgrade hata:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
