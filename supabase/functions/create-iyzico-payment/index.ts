import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { packageType, customerData, subscriptionReferenceCode } = body;

    // Gerekli environment değişkenleri
    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error("İyzico API anahtarları eksik.");
    }

    // Rastgele string üret
    function generateRandomString(length = 12) {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }

    const conversationId = `conv_${Date.now()}`;
    const randomString = generateRandomString(16);
    const packagePrice = "2998.00"; // İstediğin gibi sabit ya da body'den gelebilir

    const requestBody = {
      locale: "tr",
      conversationId: conversationId,
      price: packagePrice,
      paidPrice: packagePrice,
      currency: "TRY",
      basketId: conversationId,
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr", // anasayfaya yönlendirme uygun
      enabledInstallments: [1, 2, 3, 6, 9],
      randomString: randomString,
      buyer: {
        id: "BY789",
        name: customerData.name || "John",
        surname: customerData.surname || "Doe",
        identityNumber: customerData.tcNo?.toString().padStart(11, "0") || "74300864791",
        email: customerData.email || "test@email.com",
        gsmNumber: customerData.phone?.startsWith("+90")
          ? customerData.phone
          : `+90${customerData.phone?.replace(/^0/, "") || "5300000000"}`,
        registrationDate: "2013-04-21 15:12:09",
        lastLoginDate: "2015-10-05 12:43:35",
        registrationAddress: customerData.address || "Adres bilgisi yok",
        city: customerData.city || "Istanbul",
        country: "Turkey",
        zipCode: customerData.zipCode || "34000",
        ip: req.headers.get("x-forwarded-for") || "85.34.99.112"
      },
      shippingAddress: {
        address: customerData.address || "Adres bilgisi yok",
        zipCode: customerData.zipCode || "34000",
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey"
      },
      billingAddress: {
        address: customerData.address || "Adres bilgisi yok",
        zipCode: customerData.zipCode || "34000",
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey"
      },
      basketItems: [
        {
          id: "BI101",
          price: packagePrice,
          name: `${packageType} Paketi`,
          category1: "Hizmet",
          category2: "Danışmanlık",
          itemType: "VIRTUAL"
        }
      ]
    };

    // Hash için base64-encoded string
    const hashStr = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY;
    const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(hashStr));
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

    const response = await fetch("https://sandbox-api.iyzipay.com/payment/iyzipos/checkoutform/initialize/auth/ecom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashBase64}`
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error("Hata:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
