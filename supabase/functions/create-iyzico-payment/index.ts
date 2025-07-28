import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      packageType,
      customerData,
      subscriptionReferenceCode,
    } = await req.json();

    console.log("İyzico ödeme isteği:", {
      packageType,
      subscriptionReferenceCode,
      customerEmail: customerData.email,
    });

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error("İyzico API anahtarları bulunamadı");
    }

    const priceMap: Record<string, number> = {
      premium: 2998.0,
      kampanya: 2398.0,
      profesyonel: 4998.0,
      orta: 3600.0,
    };

    const price = priceMap[packageType];
    if (!price) {
      throw new Error("Geçersiz paket tipi");
    }

    const conversationId = `conv_${Date.now()}`;
    const basketId = "B67832";
    const callbackUrl = "https://doktorumol.com.tr/payment-success";
    const priceStr = price.toString(); // sadece log için

    const requestBody = {
      locale: "tr",
      conversationId,
      price,
      paidPrice: price,
      currency: "TRY",
      basketId,
      paymentGroup: "PRODUCT",
      callbackUrl,
      buyer: {
        id: "BY789",
        name: customerData.name,
        surname: customerData.surname,
        gsmNumber: customerData.phone,
        email: customerData.email,
        identityNumber: customerData.identityNumber,
        registrationAddress: customerData.address,
        city: customerData.city,
        country: "Turkey",
        zipCode: customerData.zipCode,
      },
      shippingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.zipCode,
      },
      billingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.zipCode,
      },
      basketItems: [
        {
          id: packageType,
          name: `${packageType} Paket`,
          category1: "Üyelik",
          itemType: "VIRTUAL",
          price,
        },
      ],
      subscriptionInitialStatus: "ACTIVE",
      subscriptionReferenceCode,
    };

    const jsonRequest = JSON.stringify(requestBody);
    const randomString = Date.now().toString();
    const hashString =
      IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY + jsonRequest;

    const hashBuffer = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(hashString),
    );
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    const response = await fetch(
      "https://sandbox-api.iyzipay.com/v2/subscription/checkoutform/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `IYZWS ${IYZICO_API_KEY}:${hash}`,
          "x-iyzi-rnd": randomString,
        },
        body: jsonRequest,
      },
    );

    const data = await response.json();

    console.log("İyzico Yanıtı:", data);

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
      status: response.status,
    });
  } catch (error) {
    console.error("Hata:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
      status: 400,
    });
  }
});
