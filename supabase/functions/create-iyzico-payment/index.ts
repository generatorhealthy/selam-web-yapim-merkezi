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
    const body = await req.json();
    console.log("Gelen Body - V2:", body);

    const { packageType, customerData, subscriptionReferenceCode } = body;
    const { name, surname, email, phone, tcNo, address, city } = customerData;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY")!;
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY")!;
    const IYZICO_BASE_URL = "https://api.iyzipay.com"; // ✅ CANLI ORTAM

    const conversationId = `conv_${Date.now()}`;
    const price = packageType === "premium" ? 2998.0 : 0.0; // ✅ .00 yerine .0 gönderiliyor
    const paidPrice = price;

    const requestData = {
      locale: "tr",
      conversationId,
      price: price.toString(),
      paidPrice: paidPrice.toString(),
      currency: "TRY",
      installment: "1",
      basketId: "B67832",
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/iyzico-sonuc",
      buyer: {
        id: "BY789",
        name,
        surname,
        gsmNumber: phone,
        email,
        identityNumber: tcNo,
        lastLoginDate: "2023-04-10 12:43:35",
        registrationDate: "2023-04-10 12:43:35",
        registrationAddress: address,
        ip: "194.59.166.153", // ✅ IP
        city,
        country: "Turkey",
        zipCode: "34100",
      },
      shippingAddress: {
        contactName: name + " " + surname,
        city,
        country: "Turkey",
        address,
        zipCode: "34100",
      },
      billingAddress: {
        contactName: name + " " + surname,
        city,
        country: "Turkey",
        address,
        zipCode: "34100",
      },
      basketItems: [
        {
          id: "BI101",
          name: "Danışmanlık Paketi",
          category1: "Hizmet",
          itemType: "VIRTUAL",
          price: price.toString(),
        },
      ],
    };

    const jsonString = JSON.stringify(requestData);
    const randomString = Date.now().toString();

    const hash = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY)
    );
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashBase64}`,
        "x-iyzi-rnd": randomString,
      },
      body: jsonString,
    });

    const iyzicoResult = await iyzicoResponse.json();
    console.log("İyzico Yanıtı:", iyzicoResult);

    return new Response(JSON.stringify(iyzicoResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Hata:", err);
    return new Response(JSON.stringify({ error: "Sunucu hatası", details: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
