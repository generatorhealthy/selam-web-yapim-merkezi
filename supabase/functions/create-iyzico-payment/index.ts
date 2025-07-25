// index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { packageType, packagePrice, customerData, subscriptionReferenceCode } = await req.json();

    // Random ve unique bir string üret (conversationId, basketId vs için)
    const randomString = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const conversationId = `conv_${randomString}`;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY")!;
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY")!;

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error("API anahtarları eksik");
    }

    const requestBody = {
      locale: "tr",
      conversationId,
      price: packagePrice,
      paidPrice: packagePrice,
      currency: "TRY",
      basketId: conversationId,
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr", // ana sayfaya yönlendir
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: "BY789",
        name: customerData.name || "John",
        surname: customerData.surname || "Doe",
        identityNumber: customerData.tcNo?.toString().padStart(11, "0") || "74300864791",
        email: customerData.email || "ornek@example.com",
        gsmNumber: customerData.phone?.startsWith("+90")
          ? customerData.phone
          : `+90${customerData.phone?.replace(/^0/, "")}`,
        registrationDate: "2013-04-21 15:12:09",
        lastLoginDate: "2015-10-05 12:43:35",
        registrationAddress: customerData.address || "adres",
        city: customerData.city || "Istanbul",
        country: "Turkey",
        zipCode: customerData.zipCode || "34000",
        ip: "194.59.166.153", // sabit dış IP
      },
      shippingAddress: {
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey",
        address: customerData.address || "adres",
        zipCode: customerData.zipCode || "34000",
      },
      billingAddress: {
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey",
        address: customerData.address || "adres",
        zipCode: customerData.zipCode || "34000",
      },
      basketItems: [
        {
          id: "BI101",
          price: packagePrice,
          name: `${packageType} Paketi`,
          category1: "Dijital Hizmet",
          category2: "Danışmanlık",
          itemType: "VIRTUAL",
        },
      ],
    };

    // Authorization header için hash oluştur
    const randomHeader = randomString;
    const dataToHash = IYZICO_API_KEY + randomHeader + JSON.stringify(requestBody) + IYZICO_SECRET_KEY;
    const hashBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(dataToHash));
    const hashInBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    const iyzicoRes = await fetch("https://sandbox-api.iyzipay.com/payment/iyzipos/checkoutform/initialize/auth/ecom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashInBase64}`,
        "x-iyzi-rnd": randomHeader,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await iyzicoRes.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Hata:", err);
    return new Response(JSON.stringify({ status: "error", message: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
