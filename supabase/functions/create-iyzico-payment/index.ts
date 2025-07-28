import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { packageType, customerData, subscriptionReferenceCode } = await req.json();

    const iyzicoApiKey = Deno.env.get("IYZICO_API_KEY")!;
    const iyzicoSecretKey = Deno.env.get("IYZICO_SECRET_KEY")!;

    const randomString = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
    const conversationId = `conv_${Date.now()}`;

    const requestBody = {
      locale: "tr",
      conversationId,
      price: "2998.00",
      paidPrice: "2998.00",
      currency: "TRY",
      basketId: randomString,
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/payment-success",
      enabledInstallments: [1, 3, 6, 9],
      buyer: {
        id: randomString,
        name: customerData.name,
        surname: customerData.surname,
        gsmNumber: customerData.phone,
        email: customerData.email,
        identityNumber: customerData.tc,
        lastLoginDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        registrationAddress: customerData.address,
        ip: "85.34.99.112",
        city: customerData.city,
        country: "Turkey",
        zipCode: customerData.postalCode,
      },
      shippingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.postalCode,
      },
      billingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.postalCode,
      },
      basketItems: [
        {
          id: "BI101",
          name: "Premium Paket",
          category1: "Abonelik",
          itemType: "VIRTUAL",
          price: "2998.00",
        },
      ],
    };

    const bodyString = JSON.stringify(requestBody);
    const randomHeader = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
    const hash = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(iyzicoApiKey + randomHeader + iyzicoSecretKey)
    );
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

    const response = await fetch("https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize/auth/ecom", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${iyzicoApiKey}:${hashBase64}`,
        "x-iyzi-rnd": randomHeader,
      },
      body: bodyString,
    });

    const result = await response.json();
    console.log("Iyzico Yanıtı:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Hata:", error);
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
