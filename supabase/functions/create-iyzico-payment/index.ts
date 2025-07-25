// /supabase/functions/create-iyzico-payment/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { packageType, customerData, subscriptionReferenceCode } = await req.json();

    console.log("İyzico ödeme isteği:", {
      packageType,
      subscriptionReferenceCode,
      customerEmail: customerData?.email
    });

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY")!;
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY")!;
    const IYZICO_BASE_URL = "https://api.iyzipay.com"; // Sandbox için: "https://sandbox-api.iyzipay.com"

    const randomString = crypto.randomUUID(); // 🔴 Zorunlu alan – eksikse hata verir
    const conversationId = `conv_${Date.now()}`;

    const requestBody = {
      locale: "tr",
      conversationId,
      price: "2998", // sabit olabilir veya packageType ile hesaplanabilir
      paidPrice: "2998",
      currency: "TRY",
      installment: 1,
      basketId: "B67832",
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/api/iyzico/callback",
      buyer: {
        id: "BY789",
        name: customerData.name,
        surname: customerData.surname,
        gsmNumber: customerData.phone,
        email: customerData.email,
        identityNumber: "11111111111",
        registrationAddress: customerData.address,
        ip: req.headers.get("x-forwarded-for") ?? "85.34.99.112", // dış IP zorunlu
        city: customerData.city,
        country: "Turkey"
      },
      shippingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address
      },
      billingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address
      },
      basketItems: [
        {
          id: "BI101",
          name: "Premium Paket",
          category1: "Danışmanlık",
          itemType: "VIRTUAL",
          price: "2998"
        }
      ]
    };

    // Hash ve authorization header hazırlığı
    const jsonString = JSON.stringify(requestBody);
    const randomHeader = randomString;
    const hash = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(IYZICO_API_KEY + randomHeader + IYZICO_SECRET_KEY + jsonString)
    );
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

    const headers = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashBase64}`,
      "x-iyzi-rnd": randomHeader
    };

    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: "POST",
      headers,
      body: jsonString
    });

    const iyzicoResult = await iyzicoResponse.json();

    console.log("İyzico yanıtı:", iyzicoResult);

    return new Response(JSON.stringify(iyzicoResult), {
      headers: corsHeaders,
      status: iyzicoResponse.status
    });
  } catch (e) {
    console.error("İyzico ödeme hatası:", e);
    return new Response(JSON.stringify({ error: "Ödeme işlemi başlatılamadı", detail: e.message }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
