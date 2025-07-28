import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY")!;
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY")!;
    const body = await req.json();
    console.log("📦 Gelen Body:", body);

    const now = new Date();
    const randomString = now.getTime().toString();
    const conversationId = `conv_${randomString}`;
    const price = "2998.0";

    const phone = body.customerData.phone?.replace(/\D/g, "") || "5310000000";
    const gsmNumber = phone.startsWith("90") ? `+${phone}` : `+90${phone.replace(/^0/, "")}`;
    const identityNumber = (body.customerData.tcNo || "74300864791").toString().padStart(11, "0");
    const ip = req.headers.get("x-forwarded-for") || "194.59.166.153";

    const requestBody = {
      locale: "tr",
      conversationId,
      price,
      paidPrice: price,
      currency: "TRY",
      basketId: "B67832",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/payment-success",
      buyer: {
        id: "BY789",
        name: body.customerData.name || "John",
        surname: body.customerData.surname || "Doe",
        identityNumber,
        email: body.customerData.email || "test@example.com",
        gsmNumber,
        registrationDate: "2023-07-01 12:00:00",
        lastLoginDate: "2023-07-25 12:00:00",
        registrationAddress: body.customerData.address || "Nidakule Göztepe",
        city: body.customerData.city || "Istanbul",
        country: "Turkey",
        zipCode: body.customerData.zipCode || "34732",
        ip,
      },
      shippingAddress: {
        contactName: `${body.customerData.name || "Jane"} ${body.customerData.surname || "Doe"}`,
        city: body.customerData.city || "Istanbul",
        country: "Turkey",
        address: body.customerData.address || "Nidakule Göztepe",
        zipCode: body.customerData.zipCode || "34742",
      },
      billingAddress: {
        contactName: `${body.customerData.name || "Jane"} ${body.customerData.surname || "Doe"}`,
        city: body.customerData.city || "Istanbul",
        country: "Turkey",
        address: body.customerData.address || "Nidakule Göztepe",
        zipCode: body.customerData.zipCode || "34742",
      },
      basketItems: [
        {
          id: "BI101",
          name: `${body.packageType || "Premium"} Paketi`,
          category1: "Hizmet",
          category2: "Psikoloji",
          itemType: "VIRTUAL",
          price,
        },
      ],
    };

    console.log("📤 İyzico Request Body:", requestBody);

    const raw = JSON.stringify(requestBody);
    const hashString = raw + randomString + IYZICO_SECRET_KEY;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(IYZICO_SECRET_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(hashString));
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    const iyzicoResponse = await fetch("https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${signature}`,
        "x-iyzi-rnd": randomString,
      },
      body: raw,
    });

    const text = await iyzicoResponse.text();
    console.log("🧾 İyzico Yanıt:", text);

    let result: any = {};
    try {
      result = JSON.parse(text);
    } catch (_) {
      return new Response(JSON.stringify({ success: false, error: "İyzico'dan geçersiz JSON" }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    if (result.status === "success") {
      return new Response(JSON.stringify({
        success: true,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
      }), {
        headers: corsHeaders,
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: result.errorMessage || "Bilinmeyen hata",
    }), {
      headers: corsHeaders,
      status: 400,
    });

  } catch (err) {
    console.error("❌ Hata:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
