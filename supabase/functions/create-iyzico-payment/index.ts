import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { packageType, customerData, subscriptionReferenceCode } = await req.json();

    const conversationId = `conv_${Date.now()}`;
    const packagePrice = "2998.00";

    const requestBody = {
      locale: "tr",
      conversationId,
      price: packagePrice,
      paidPrice: packagePrice,
      currency: "TRY",
      basketId: conversationId,
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr", // Anasayfaya yönlendir
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: "BY789",
        name: customerData.name || "John",
        surname: customerData.surname || "Doe",
        identityNumber: customerData.tcNo?.toString().padStart(11, '0') || "74300864791",
        email: customerData.email || "email@email.com",
        gsmNumber: customerData.phone?.startsWith('+90')
          ? customerData.phone
          : `+90${customerData.phone?.replace(/^0/, '') || '5555555555'}`,
        registrationDate: "2013-04-21 15:12:09",
        lastLoginDate: "2015-10-05 12:43:35",
        registrationAddress: customerData.address || "Adres girilmedi",
        city: customerData.city || "Istanbul",
        country: "Turkey",
        zipCode: customerData.zipCode || "34100",
        ip: "194.59.166.153"
      },
      shippingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city || "Istanbul",
        country: "Turkey",
        address: customerData.address || "Adres girilmedi",
        zipCode: customerData.zipCode || "34100"
      },
      billingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city || "Istanbul",
        country: "Turkey",
        address: customerData.address || "Adres girilmedi",
        zipCode: customerData.zipCode || "34100"
      },
      basketItems: [
        {
          id: "BI101",
          name: `${packageType} Paketi`,
          category1: "Hizmet",
          category2: "Danışmanlık",
          itemType: "VIRTUAL",
          price: packagePrice
        }
      ]
    };

    // İyzico API isteği
    const response = await fetch("https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize/auth/ecom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "IYZICO api_key:secret_key", // BURAYI .env ile çek ya da supabase config'e koy
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });

  } catch (e) {
    console.error("Hata:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
