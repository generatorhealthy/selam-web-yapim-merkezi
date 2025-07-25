// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// İyzico için CORS header'ları
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { packageType, customerData, subscriptionReferenceCode } = await req.json();

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY")!;
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY")!;

    const randomString = crypto.randomUUID();
    const message = IYZICO_API_KEY + randomString;

    // SHA256-HMAC base64 ile imzalama
    const encoder = new TextEncoder();
    const keyData = encoder.encode(IYZICO_SECRET_KEY);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const hash = btoa(String.fromCharCode(...new Uint8Array(signature)));

    const iyzicoPayload = {
      locale: "tr",
      conversationId: subscriptionReferenceCode,
      price: "2998",
      paidPrice: "2998",
      currency: "TRY",
      basketId: "doktorumol-" + subscriptionReferenceCode,
      paymentGroup: "SUBSCRIPTION",
      callbackUrl: "https://doktorumol.com.tr/api/iyzico/webhook",
      enabledInstallments: [1],
      buyer: {
        id: "BY789",
        name: customerData.firstName || "İsimsiz",
        surname: customerData.lastName || "Danışman",
        gsmNumber: customerData.phone || "+905555555555",
        email: customerData.email,
        identityNumber: "74300864791",
        registrationAddress: customerData.address || "Adres belirtilmedi",
        ip: customerData.ip || "85.34.99.112",
        city: customerData.city || "İstanbul",
        country: "Turkey",
      },
      basketItems: [
        {
          id: packageType,
          name: "Premium Paket",
          category1: "Abonelik",
          itemType: "VIRTUAL",
          price: "2998",
        },
      ],
    };

    const response = await fetch("https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize/auth/ecom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hash}`,
        "x-iyzi-rnd": randomString,
      },
      body: JSON.stringify(iyzicoPayload),
    });

    const data = await response.json();
    console.log("İyzico Yanıtı:", data);

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error("Hata:", e);
    return new Response(
      JSON.stringify({ error: true, message: e.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
